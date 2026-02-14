import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Clock, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TableMapView({ selectedDate, restaurant }) {
  const queryClient = useQueryClient();
  const [dragError, setDragError] = useState(null);

  const { data: reservations = [] } = useQuery({
    queryKey: ['map-reservations', restaurant?.id, selectedDate],
    queryFn: async () => {
      if (!restaurant || !selectedDate) return [];
      return await base44.entities.Reservation.filter({
        restaurant_id: restaurant.id,
        date: selectedDate,
        status: { $in: ['pending', 'confirmed'] }
      }, 'slot_time');
    },
    enabled: !!restaurant && !!selectedDate,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await base44.entities.Table.filter({
        restaurant_id: restaurant.id,
        is_active: true
      });
    },
    enabled: !!restaurant,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await base44.entities.Customer.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
  });

  const { data: environments = [] } = useQuery({
    queryKey: ['environments', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await base44.entities.Environment.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await base44.entities.Shift.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
  });

  const updateReservationMutation = useMutation({
    mutationFn: ({ reservationId, newTableIds }) => {
      const mainTableId = newTableIds[0];
      return base44.entities.Reservation.update(reservationId, { 
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
    mutationFn: ({ id, status }) => base44.entities.Table.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['map-reservations'] });
    },
  });

  const getCustomer = (customerId) => customers.find(c => c.id === customerId);
  
  const getEnvironment = (envId) => environments.find(e => e.id === envId);

  const getTableReservations = (tableId) => {
    return reservations.filter(r => {
      // Verificar se a mesa está na lista de mesas alocadas OU é a mesa principal
      const tableIds = r.linked_tables && r.linked_tables.length > 0 
        ? r.linked_tables 
        : [r.table_id];
      return tableIds.includes(tableId);
    });
  };

  const groupedTables = environments.reduce((acc, env) => {
    acc[env.id] = tables.filter(t => t.environment_id === env.id);
    return acc;
  }, {});

  const ungroupedTables = tables.filter(t => !t.environment_id);

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

    const getStatusColor = (status) => {
      const colors = {
        available: "bg-green-100 text-green-800 border-green-200",
        unavailable: "bg-gray-100 text-gray-800 border-gray-200",
        blocked: "bg-red-100 text-red-800 border-red-200"
      };
      return colors[status] || colors.available;
    };

    return (
      <Droppable droppableId={table.id}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-32 transition-all ${
              snapshot.isDraggingOver ? 'border-2 border-[#C47B3C] bg-amber-50' : 
              isOccupied ? 'border-[#C47B3C] bg-amber-50/30' : 'border-gray-200'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#A56A38]" />
                  {table.name}
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-amber-50 text-[#A56A38] border-amber-200">
                  <Users className="w-3 h-3 mr-1" />
                  {table.seats}
                </Badge>
              </div>
              <Select
                value={table.status || "available"}
                onValueChange={(value) => updateStatusMutation.mutate({ id: table.id, status: value })}
              >
                <SelectTrigger className={`w-full text-xs ${getStatusColor(table.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-2">
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
                        {...provided.dragHandleProps}
                        className={`bg-white p-3 rounded-lg border-2 cursor-move hover:shadow-md transition-all ${
                          snapshot.isDragging ? 'shadow-xl border-[#C47B3C] rotate-2' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-sm">{customer?.full_name}</p>
                          <Badge variant="secondary" className="text-xs bg-amber-50 text-[#A56A38] border-amber-200">
                            <Users className="w-3 h-3 mr-1" />
                            {reservation.party_size}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Clock className="w-3 h-3" />
                          {reservation.slot_time}
                        </div>
                        {isMultiTable && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Múltiplas mesas ({reservation.linked_tables.length})
                          </Badge>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {!isOccupied && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Disponível
                </p>
              )}
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-[#A56A38]">
            💡 <strong>Dica:</strong> Arraste e solte as reservas entre as mesas para realocá-las. Reservas com múltiplas pessoas serão automaticamente distribuídas em várias mesas.
          </p>
        </div>

        {dragError && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dragError}</AlertDescription>
          </Alert>
        )}

        {environments.map((env) => (
          <div key={env.id}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#A56A38]" />
              {env.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedTables[env.id]?.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </div>
        ))}

        {ungroupedTables.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4">Mesas sem Ambiente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ungroupedTables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}