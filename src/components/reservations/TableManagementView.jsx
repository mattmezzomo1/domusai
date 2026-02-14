import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Clock, AlertCircle, CheckCircle, XCircle, Info, Maximize2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TableManagementView({ selectedDate, restaurant }) {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid, timeline

  const { data: reservations = [] } = useQuery({
    queryKey: ['management-reservations', restaurant?.id, selectedDate],
    queryFn: async () => {
      if (!restaurant || !selectedDate) return [];
      return await base44.entities.Reservation.filter({
        restaurant_id: restaurant.id,
        date: selectedDate
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

  const updateTableStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Table.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const reallocateReservationMutation = useMutation({
    mutationFn: ({ reservationId, newTableId }) => {
      return base44.entities.Reservation.update(reservationId, { 
        table_id: newTableId,
        linked_tables: [newTableId]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-reservations'] });
      setSelectedReservation(null);
    },
  });

  const getCustomer = (customerId) => customers.find(c => c.id === customerId);
  const getEnvironment = (envId) => environments.find(e => e.id === envId);
  const getShift = (shiftId) => shifts.find(s => s.id === shiftId);

  const getTableReservations = (tableId) => {
    return reservations.filter(r => {
      const tableIds = r.linked_tables && r.linked_tables.length > 0 
        ? r.linked_tables 
        : [r.table_id];
      return tableIds.includes(tableId);
    }).filter(r => r.status === 'pending' || r.status === 'confirmed');
  };

  const getTableStatus = (table) => {
    if (table.status === 'blocked') return { status: 'blocked', label: 'Bloqueada', color: 'bg-red-100 border-red-300' };
    if (table.status === 'unavailable') return { status: 'unavailable', label: 'Indisponível', color: 'bg-gray-100 border-gray-300' };
    
    const tableReservations = getTableReservations(table.id);
    if (tableReservations.length === 0) {
      return { status: 'available', label: 'Disponível', color: 'bg-green-100 border-green-300', icon: CheckCircle };
    }
    
    return { status: 'occupied', label: `${tableReservations.length} Reserva(s)`, color: 'bg-amber-100 border-amber-300', icon: Users };
  };

  const groupedTables = environments.reduce((acc, env) => {
    acc[env.id] = tables.filter(t => t.environment_id === env.id);
    return acc;
  }, {});

  const ungroupedTables = tables.filter(t => !t.environment_id);

  const TableCard = ({ table }) => {
    const tableReservations = getTableReservations(table.id);
    const statusInfo = getTableStatus(table);
    const StatusIcon = statusInfo.icon;

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${statusInfo.color} ${
          selectedTable?.id === table.id ? 'ring-2 ring-[#C47B3C]' : ''
        }`}
        onClick={() => setSelectedTable(table)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#A56A38]" />
              {table.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-white">
              <Users className="w-3 h-3 mr-1" />
              {table.seats}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {StatusIcon && <StatusIcon className="w-4 h-4" />}
            <span className="text-xs font-semibold">{statusInfo.label}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {tableReservations.slice(0, 2).map((reservation) => {
            const customer = getCustomer(reservation.customer_id);
            const shift = getShift(reservation.shift_id);
            return (
              <div
                key={reservation.id}
                className="bg-white p-2 rounded-lg border text-xs hover:shadow-md transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReservation(reservation);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold truncate">{customer?.full_name}</p>
                  <Badge variant="secondary" className="text-[10px] bg-amber-50">
                    {reservation.party_size}p
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-3 h-3" />
                  {reservation.slot_time}
                  {shift && <span className="text-[10px]">• {shift.name}</span>}
                </div>
              </div>
            );
          })}
          {tableReservations.length > 2 && (
            <p className="text-xs text-gray-600 text-center">
              +{tableReservations.length - 2} mais
            </p>
          )}
          {tableReservations.length === 0 && table.status === 'available' && (
            <p className="text-xs text-gray-500 text-center py-2">Nenhuma reserva</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const ReservationDetailsDialog = () => {
    if (!selectedReservation) return null;
    
    const customer = getCustomer(selectedReservation.customer_id);
    const currentTable = tables.find(t => t.id === selectedReservation.table_id);
    const shift = getShift(selectedReservation.shift_id);
    const availableTables = tables.filter(t => 
      t.status === 'available' && 
      t.seats >= selectedReservation.party_size
    );

    return (
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#A56A38]" />
              Detalhes da Reserva
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-semibold">{customer?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Código</p>
                <p className="font-mono text-sm">{selectedReservation.reservation_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Horário</p>
                <p className="font-semibold">{selectedReservation.slot_time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pessoas</p>
                <p className="font-semibold">{selectedReservation.party_size}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Turno</p>
                <p className="font-semibold">{shift?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mesa Atual</p>
                <p className="font-semibold">{currentTable?.name}</p>
              </div>
            </div>

            {selectedReservation.notes && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Observações</p>
                <p className="text-sm">{selectedReservation.notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-2">Realocar para outra mesa</p>
              <Select 
                value={selectedReservation.table_id}
                onValueChange={(newTableId) => {
                  if (confirm('Tem certeza que deseja realocar esta reserva?')) {
                    reallocateReservationMutation.mutate({
                      reservationId: selectedReservation.id,
                      newTableId
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name} ({table.seats} lugares)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const TableDetailsPanel = () => {
    if (!selectedTable) return null;
    
    const tableReservations = getTableReservations(selectedTable.id);
    const statusInfo = getTableStatus(selectedTable);
    const environment = getEnvironment(selectedTable.environment_id);

    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#A56A38]" />
            {selectedTable.name}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {environment && <span>{environment.name}</span>}
            <span>• {selectedTable.seats} lugares</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Status da Mesa</p>
            <Select 
              value={selectedTable.status || "available"}
              onValueChange={(value) => 
                updateTableStatusMutation.mutate({ id: selectedTable.id, status: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Disponível
                  </div>
                </SelectItem>
                <SelectItem value="unavailable">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-gray-600" />
                    Indisponível
                  </div>
                </SelectItem>
                <SelectItem value="blocked">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Bloqueada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">
              Reservas ({tableReservations.length})
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tableReservations.map(reservation => {
                const customer = getCustomer(reservation.customer_id);
                const shift = getShift(reservation.shift_id);
                return (
                  <div
                    key={reservation.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedReservation(reservation)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{customer?.full_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {reservation.party_size}p
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      {reservation.slot_time}
                      {shift && <span>• {shift.name}</span>}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] mt-2"
                    >
                      {reservation.status === 'pending' ? 'Reservada' : 'Confirmada'}
                    </Badge>
                  </div>
                );
              })}
              {tableReservations.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma reserva para esta mesa
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!restaurant) return null;

  return (
    <div>
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#A56A38] shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Gerenciamento Visual de Mesas</p>
            <p className="text-xs">
              Clique em uma mesa para ver detalhes e reservas. Clique em uma reserva para realocá-la.
              Você pode alterar o status das mesas diretamente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-gray-600">Disponíveis</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {tables.filter(t => getTableStatus(t).status === 'available').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-gray-600">Ocupadas</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {tables.filter(t => getTableStatus(t).status === 'occupied').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-600">Indisponíveis</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">
                    {tables.filter(t => t.status === 'unavailable').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-gray-600">Bloqueadas</p>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {tables.filter(t => t.status === 'blocked').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mesas por Ambiente */}
            {environments.map((env) => (
              <div key={env.id}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#A56A38]" />
                  {env.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupedTables[env.id]?.map((table) => (
                    <TableCard key={table.id} table={table} />
                  ))}
                </div>
              </div>
            ))}

            {ungroupedTables.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Mesas sem Ambiente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ungroupedTables.map((table) => (
                    <TableCard key={table.id} table={table} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedTable ? (
            <TableDetailsPanel />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Maximize2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Selecione uma mesa para ver detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ReservationDetailsDialog />
    </div>
  );
}