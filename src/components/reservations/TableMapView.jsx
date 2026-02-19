import React, { useState } from 'react';
import { reservationService, tableService, customerService, environmentService, shiftService } from "@/services/api.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Clock, AlertCircle, Info, ArrowRightLeft } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function TableMapView({ selectedDate, restaurant }) {
  const queryClient = useQueryClient();
  const [dragError, setDragError] = useState(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedDestinationTable, setSelectedDestinationTable] = useState('');

  console.log('🗺️ TableMapView renderizado com:', { selectedDate, restaurantId: restaurant?.id });

  const { data: reservations = [] } = useQuery({
    queryKey: ['map-reservations', restaurant?.id, selectedDate],
    queryFn: async () => {
      try {
        console.log('🔍 Executando query de reservas do mapa...');
        if (!restaurant || !selectedDate) {
          console.log('⚠️ Restaurant ou selectedDate não definidos:', { restaurant: !!restaurant, selectedDate });
          return [];
        }

        console.log('📡 Buscando reservas com filtro:', {
          restaurant_id: restaurant.id,
          date: selectedDate
        });

        // Buscar TODAS as reservas do dia
        const allReservations = await reservationService.filter({
          restaurant_id: restaurant.id,
          date: selectedDate
        }, 'slot_time');

        // Filtrar apenas as ativas (pending ou confirmed, em qualquer case)
        const result = allReservations.filter(r => {
          const status = r.status?.toLowerCase();
          return status === 'pending' || status === 'confirmed';
        });

        console.log('✅ Query executada com sucesso!');
        console.log('🗺️ Reservas no mapa:', result.length, result.map(r => ({
          id: r.id,
          code: r.reservation_code,
          table_id: r.table_id,
          linked_tables: r.linked_tables,
          status: r.status,
          slot_time: r.slot_time,
          party_size: r.party_size
        })));

        return result;
      } catch (error) {
        console.error('❌ Erro ao buscar reservas do mapa:', error);
        return [];
      }
    },
    enabled: !!restaurant && !!selectedDate,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      const allTables = await tableService.filter({ restaurant_id: restaurant.id });
      return allTables.filter(t => t.is_active);
    },
    enabled: !!restaurant,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await customerService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
  });

  const { data: environments = [] } = useQuery({
    queryKey: ['environments', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await environmentService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await shiftService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
  });

  const updateReservationMutation = useMutation({
    mutationFn: ({ reservationId, newTableIds }) => {
      const mainTableId = newTableIds[0];
      return reservationService.update(reservationId, {
        table_id: mainTableId,
        linked_tables: newTableIds
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setDragError(null);
    },
    onError: (error) => {
      setDragError(error.message || "Erro ao mover reserva");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tableService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['map-reservations'] });
    },
  });

  const getCustomer = (customerId) => customers.find(c => c.id === customerId);
  
  const getEnvironment = (envId) => environments.find(e => e.id === envId);

  const getTableReservations = (tableId) => {
    const tableReservations = reservations.filter(r => {
      // Verificar se a mesa está na lista de mesas alocadas OU é a mesa principal
      const tableIds = r.linked_tables && r.linked_tables.length > 0
        ? r.linked_tables
        : [r.table_id];
      const includes = tableIds.includes(tableId);

      if (includes) {
        console.log(`✅ Mesa ${tableId} tem reserva:`, {
          code: r.reservation_code,
          slot_time: r.slot_time,
          table_id: r.table_id,
          linked_tables: r.linked_tables
        });
      }

      return includes;
    });

    return tableReservations;
  };

  const groupedTables = environments.reduce((acc, env) => {
    acc[env.id] = tables.filter(t => t.environment_id === env.id);
    return acc;
  }, {});

  const ungroupedTables = tables.filter(t => !t.environment_id);

  console.log('🏢 Mesas agrupadas:', {
    environments: environments.length,
    groupedTables: Object.keys(groupedTables).map(envId => ({
      envId,
      tables: groupedTables[envId].map(t => ({ id: t.id, name: t.name }))
    })),
    ungroupedTables: ungroupedTables.map(t => ({ id: t.id, name: t.name })),
    totalTables: tables.length,
    totalReservations: reservations.length
  });

  const canDropReservation = (reservationId, destinationTableId) => {
    const reservation = reservations.find(r => r.id === reservationId);
    const destinationTable = tables.find(t => t.id === destinationTableId);

    if (!reservation || !destinationTable) return { canDrop: false, reason: "Mesa não encontrada" };

    if (destinationTable.status === 'blocked') {
      return { canDrop: false, reason: "Mesa bloqueada" };
    }

    if (destinationTable.status === 'unavailable') {
      return { canDrop: false, reason: "Mesa indisponível" };
    }

    // Verificar se precisa de múltiplas mesas
    if (destinationTable.seats < reservation.party_size) {
      // Tentar encontrar combinação de mesas
      const availableTables = tables.filter(t => 
        t.status === 'available' && 
        !getTableReservations(t.id).some(r => r.id !== reservation.id)
      ).sort((a, b) => a.seats - b.seats);

      let totalSeats = 0;
      let neededTables = [];
      for (const table of availableTables) {
        if (totalSeats >= reservation.party_size) break;
        neededTables.push(table);
        totalSeats += table.seats;
      }

      if (totalSeats < reservation.party_size) {
        return { canDrop: false, reason: `Não há mesas disponíveis suficientes para ${reservation.party_size} pessoas` };
      }
    }

    const shift = shifts.find(s => s.id === reservation.shift_id);
    if (!shift) {
      return { canDrop: false, reason: "Turno não encontrado" };
    }

    const tableReservations = getTableReservations(destinationTableId);
    const reservationMinutes = parseInt(reservation.slot_time.split(':')[0]) * 60 + parseInt(reservation.slot_time.split(':')[1]);

    for (const existingRes of tableReservations) {
      if (existingRes.id === reservation.id) continue;

      const existingMinutes = parseInt(existingRes.slot_time.split(':')[0]) * 60 + parseInt(existingRes.slot_time.split(':')[1]);
      
      const occupiedStart = existingMinutes - shift.default_buffer_minutes;
      const occupiedEnd = existingMinutes + shift.default_dwell_minutes + shift.default_buffer_minutes;

      if (reservationMinutes >= occupiedStart && reservationMinutes < occupiedEnd) {
        return { 
          canDrop: false, 
          reason: `Mesa ocupada às ${existingRes.slot_time}. Tempo livre após ${Math.floor(occupiedEnd / 60)}:${String(occupiedEnd % 60).padStart(2, '0')}`
        };
      }
    }

    return { canDrop: true, reason: null };
  };

  const handleDragEnd = (result) => {
    if (!result.destination) {
      setDragError(null);
      return;
    }

    const reservationId = result.draggableId;
    const newTableId = result.destination.droppableId;

    const validation = canDropReservation(reservationId, newTableId);
    
    if (!validation.canDrop) {
      setDragError(validation.reason);
      setTimeout(() => setDragError(null), 5000);
      return;
    }

    const reservation = reservations.find(r => r.id === reservationId);
    const destinationTable = tables.find(t => t.id === newTableId);

    // Se a mesa comporta toda a reserva, usar só ela
    if (destinationTable.seats >= reservation.party_size) {
      updateReservationMutation.mutate({ 
        reservationId, 
        newTableIds: [newTableId] 
      });
    } else {
      // Alocar múltiplas mesas
      const availableTables = tables.filter(t => 
        t.status === 'available' && 
        !getTableReservations(t.id).some(r => r.id !== reservation.id)
      ).sort((a, b) => a.seats - b.seats);

      let totalSeats = 0;
      let selectedTables = [];
      for (const table of availableTables) {
        if (totalSeats >= reservation.party_size) break;
        selectedTables.push(table.id);
        totalSeats += table.seats;
      }

      updateReservationMutation.mutate({ 
        reservationId, 
        newTableIds: selectedTables 
      });
    }
  };

  const TableCard = ({ table }) => {
    const tableReservations = getTableReservations(table.id);
    const isOccupied = tableReservations.length > 0;
    const isAvailable = table.status?.toUpperCase() === 'AVAILABLE' && !isOccupied;

    const getStatusBadgeColor = () => {
      if (isOccupied) return 'bg-blue-50 text-blue-700 border-blue-200';
      if (isAvailable) return 'bg-green-50 text-green-700 border-green-200';
      return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    const getStatusText = () => {
      if (isOccupied) return 'Reservada';
      if (table.status?.toUpperCase() === 'BLOCKED') return 'Bloqueada';
      if (table.status?.toUpperCase() === 'UNAVAILABLE') return 'Indisponível';
      return 'Disponível';
    };

    return (
      <Droppable droppableId={table.id}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[140px] transition-all border-2 ${
              snapshot.isDraggingOver
                ? 'border-[#FA7318] bg-orange-50 shadow-lg'
                : isOccupied
                  ? 'border-blue-400 bg-white'
                  : isAvailable
                    ? 'border-green-400 bg-white'
                    : 'border-gray-300 bg-gray-50'
            }`}
          >
            <CardHeader className="pb-2 pt-3 px-3.5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    {table.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${getStatusBadgeColor()}`}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {table.seats}
                </Badge>
              </div>
              <Badge
                variant="outline"
                className={`text-xs w-fit ${getStatusBadgeColor()}`}
              >
                {getStatusText()}
              </Badge>
            </CardHeader>
            <CardContent className="px-3.5 pb-3.5 space-y-2">
              {tableReservations.map((reservation, index) => {
                const customer = getCustomer(reservation.customer_id);
                const isMultiTable = reservation.linked_tables && reservation.linked_tables.length > 1;
                return (
                  <Draggable
                    key={reservation.id}
                    draggableId={reservation.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white p-2.5 rounded-md border hover:shadow-md transition-all ${
                          snapshot.isDragging
                            ? 'shadow-xl border-blue-400 rotate-1 scale-105'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1">
                            <div {...provided.dragHandleProps} className="cursor-move touch-none">
                              <div className="flex flex-col gap-0.5">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              </div>
                            </div>
                            <p className="font-medium text-sm text-gray-900 leading-tight">
                              {customer?.full_name || 'Cliente'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Users className="w-3 h-3 mr-0.5" />
                              {reservation.party_size}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-orange-50 hover:text-[#FA7318]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReservation(reservation);
                                setMoveDialogOpen(true);
                              }}
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 ml-5">
                          <Clock className="w-3 h-3" />
                          {reservation.slot_time}
                        </div>
                        {isMultiTable && (
                          <Badge variant="outline" className="text-[10px] mt-1.5 ml-5 bg-purple-50 text-purple-700 border-purple-200">
                            {reservation.linked_tables.length} mesas
                          </Badge>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {!isOccupied && (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  Arraste uma reserva aqui
                </p>
              )}
              {provided.placeholder}
            </CardContent>
          </Card>
        )}
      </Droppable>
    );
  };

  if (!restaurant) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Sistema de Alocação Inteligente Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Sistema de Alocação Inteligente:
              </p>
              <p className="text-sm text-blue-700">
                Arraste reservas da lista para as mesas. Cada mesa comporta apenas uma reserva. Para grandes grupos, use o botão "Alocar Automaticamente".
              </p>
            </div>
          </div>
        </div>

        {dragError && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dragError}</AlertDescription>
          </Alert>
        )}

        {environments.map((env) => (
          <div key={env.id}>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4" />
              {env.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {groupedTables[env.id]?.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </div>
        ))}

        {ungroupedTables.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-3 text-gray-700">Sem Ambiente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ungroupedTables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog para Mover Reserva (Mobile-Friendly) */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mover Reserva</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <span>
                  Selecione a mesa de destino para a reserva de{' '}
                  <strong>{getCustomer(selectedReservation.customer_id)?.full_name || 'Cliente'}</strong>
                  {' '}({selectedReservation.party_size} pessoas às {selectedReservation.slot_time})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mesa de Destino</label>
              <Select value={selectedDestinationTable} onValueChange={setSelectedDestinationTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <React.Fragment key={env.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        {env.name}
                      </div>
                      {groupedTables[env.id]?.map((table) => {
                        const tableReservations = getTableReservations(table.id);
                        const isOccupied = tableReservations.length > 0 &&
                          !tableReservations.some(r => r.id === selectedReservation?.id);
                        const isAvailable = table.status?.toUpperCase() === 'AVAILABLE' && !isOccupied;

                        return (
                          <SelectItem
                            key={table.id}
                            value={table.id}
                            disabled={!isAvailable}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{table.name}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {table.seats}
                                </Badge>
                                {!isAvailable && (
                                  <Badge variant="secondary" className="text-xs">
                                    {isOccupied ? 'Ocupada' : 'Indisponível'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  {ungroupedTables.length > 0 && (
                    <React.Fragment>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        Sem Ambiente
                      </div>
                      {ungroupedTables.map((table) => {
                        const tableReservations = getTableReservations(table.id);
                        const isOccupied = tableReservations.length > 0 &&
                          !tableReservations.some(r => r.id === selectedReservation?.id);
                        const isAvailable = table.status?.toUpperCase() === 'AVAILABLE' && !isOccupied;

                        return (
                          <SelectItem
                            key={table.id}
                            value={table.id}
                            disabled={!isAvailable}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{table.name}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {table.seats}
                                </Badge>
                                {!isAvailable && (
                                  <Badge variant="secondary" className="text-xs">
                                    {isOccupied ? 'Ocupada' : 'Indisponível'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </React.Fragment>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMoveDialogOpen(false);
                  setSelectedReservation(null);
                  setSelectedDestinationTable('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08]"
                disabled={!selectedDestinationTable}
                onClick={() => {
                  if (selectedReservation && selectedDestinationTable) {
                    handleReservationMove(selectedReservation.id, selectedDestinationTable);
                    setMoveDialogOpen(false);
                    setSelectedReservation(null);
                    setSelectedDestinationTable('');
                  }
                }}
              >
                Mover Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}