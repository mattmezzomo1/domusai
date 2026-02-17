import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, User, Calendar, Phone, DollarSign, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import EditReservationDialog from "../reservations/EditReservationDialog";
import WhatsAppButton from "../shared/WhatsAppButton";

export default function ReservationsList({ reservations, isLoading, selectedDate }) {
  const queryClient = useQueryClient();
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketValue, setTicketValue] = useState('');
  const [selectedReservations, setSelectedReservations] = useState([]);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: () => base44.entities.Table.list(),
    initialData: [],
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Reservation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, ticket_amount }) => base44.entities.Reservation.update(id, { 
      ticket_amount: parseFloat(ticket_amount),
      status: 'completed'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
      setEditingTicket(null);
      setTicketValue('');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Reservation.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
      setSelectedReservations([]);
    },
  });

  const handleTicketSave = (reservationId) => {
    if (ticketValue && parseFloat(ticketValue) > 0) {
      updateTicketMutation.mutate({ 
        id: reservationId, 
        ticket_amount: ticketValue 
      });
    }
  };

  const toggleSelectReservation = (reservationId) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReservations.length === reservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(reservations.map(r => r.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedReservations.length === 0) return;
    if (confirm(`Tem certeza que deseja excluir ${selectedReservations.length} reserva(s)?`)) {
      bulkDeleteMutation.mutate(selectedReservations);
    }
  };

  const getCustomer = (customerId) => customers.find(c => c.id === customerId);
  const getTable = (tableId) => tables.find(t => t.id === tableId);
  const getShift = (shiftId) => shifts.find(s => s.id === shiftId);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    no_show: "bg-orange-100 text-orange-800 border-orange-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    altered: "bg-amber-100 text-amber-800 border-amber-200"
  };

  const statusLabels = {
    pending: "Reservada",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    no_show: "No-Show",
    completed: "Concluída",
    altered: "Alterada"
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b p-2 md:p-3">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#A56A38]" />
          Reservas do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        {/* Bulk Actions Bar */}
        {selectedReservations.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedReservations.length} reserva(s) selecionada(s)
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {bulkDeleteMutation.isPending ? 'Excluindo...' : 'Excluir Selecionadas'}
            </Button>
          </div>
        )}

        {/* Select All Button */}
        {reservations.length > 0 && !isLoading && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs"
            >
              {selectedReservations.length === reservations.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2 md:space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 md:h-24 w-full" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">Nenhuma reserva para este dia</h3>
            <p className="text-xs md:text-sm text-gray-500">As reservas aparecerão aqui quando forem criadas</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {[...reservations]
              .sort((a, b) => a.slot_time.localeCompare(b.slot_time))
              .map((reservation) => {
              // Use customer data from reservation (included by backend)
              const customer = reservation.customer || getCustomer(reservation.customer_id);
              const table = getTable(reservation.table_id);
              const shift = getShift(reservation.shift_id);

              const hasAlteredTag = reservation.tags && reservation.tags.includes('alterada');

              return (
                <div
                  key={reservation.id}
                  className="bg-gray-50 rounded-lg p-2 md:p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedReservations.includes(reservation.id)}
                      onChange={() => toggleSelectReservation(reservation.id)}
                      className="w-4 h-4 mt-1 cursor-pointer shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs md:text-sm font-semibold text-[#A56A38]">
                            {reservation.reservation_code}
                          </p>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`${statusColors[reservation.status]} border text-[10px] md:text-xs px-2 py-1 rounded-md font-semibold cursor-pointer hover:opacity-80 transition-opacity`}>
                                {statusLabels[reservation.status]}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'pending' })}>
                                Reservada
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'confirmed' })}>
                                Confirmada
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'no_show' })}>
                                No-Show
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'cancelled' })}>
                                Cancelada
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'completed' })}>
                                Concluída
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {shift && (
                            <Badge variant="outline" className="bg-amber-50 text-[#A56A38] border-amber-200 text-[10px] md:text-xs">
                              {shift.name}
                            </Badge>
                          )}

                          {hasAlteredTag && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] md:text-xs">
                              Alterada
                            </Badge>
                          )}

                          {reservation.ticket_amount && reservation.ticket_amount > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] md:text-xs">
                              <DollarSign className="w-3 h-3 mr-1" />
                              R$ {reservation.ticket_amount.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <WhatsAppButton
                            phone={customer?.phone_whatsapp}
                            message={`Olá ${customer?.full_name}! Confirmando sua reserva para ${format(new Date(reservation.date), "dd/MM")} às ${reservation.slot_time}.`}
                            size="sm"
                            className="text-xs"
                          />
                          <EditReservationDialog reservation={reservation} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="font-semibold truncate">{reservation.slot_time}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{reservation.party_size} pessoas</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{customer?.full_name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{customer?.phone_whatsapp || '-'}</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                              {customer?.full_name}
                            </p>
                            {reservation.notes && (
                              <p className="text-xs md:text-sm text-gray-600 mt-1 italic line-clamp-2">"{reservation.notes}"</p>
                            )}
                          </div>

                          {(reservation.status === 'confirmed' || reservation.status === 'completed' || reservation.status === 'pending') && (
                            <div className="flex items-center gap-2 ml-4">
                              {editingTicket === reservation.id ? (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="R$"
                                    value={ticketValue}
                                    onChange={(e) => setTicketValue(e.target.value)}
                                    className="w-24 h-8 text-sm"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleTicketSave(reservation.id)}
                                    disabled={updateTicketMutation.isPending}
                                    className="h-8 bg-green-600 hover:bg-green-700"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingTicket(null);
                                      setTicketValue('');
                                    }}
                                    className="h-8 px-2"
                                  >
                                    ✕
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingTicket(reservation.id);
                                    setTicketValue(reservation.ticket_amount?.toString() || '');
                                  }}
                                  className="h-8 text-xs"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  {reservation.ticket_amount && reservation.ticket_amount > 0 ? 'Editar' : 'Valor'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}