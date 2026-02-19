import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, User, Calendar, Phone, DollarSign, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { reservationService, customerService, tableService, shiftService } from "@/services/api.service";
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
    queryFn: () => customerService.list(),
    initialData: [],
  });

  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableService.list(),
    initialData: [],
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftService.list(),
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => reservationService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, ticket_amount }) => reservationService.update(id, {
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
      await Promise.all(ids.map(id => reservationService.delete(id)));
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

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_show: "bg-orange-100 text-orange-800 border-orange-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      altered: "bg-amber-100 text-amber-800 border-amber-200"
    };
    return colors[normalizedStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = status?.toLowerCase();
    const labels = {
      pending: "Reservada",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      no_show: "No-Show",
      completed: "Concluída",
      altered: "Alterada"
    };
    return labels[normalizedStatus] || status;
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="bg-white border-b border-gray-200 p-4 md:p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-bold text-gray-900">
            Reservas do Dia
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-amber-500 text-white hover:bg-amber-600 border-none"
            >
              Lista
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-gray-600 hover:bg-gray-100"
            >
              Mapa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5">
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
          <div className="space-y-3">
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
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Código da Reserva */}
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <p className="font-mono text-sm font-semibold text-gray-700">
                        {reservation.reservation_code}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="min-w-[100px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`${getStatusColor(reservation.status)} border text-xs px-3 py-1 rounded-md font-medium cursor-pointer hover:opacity-80 transition-opacity`}>
                            {getStatusLabel(reservation.status)}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'PENDING' })}>
                            Reservada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'CONFIRMED' })}>
                            Confirmada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'NO_SHOW' })}>
                            No-Show
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'CANCELLED' })}>
                            Cancelada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'COMPLETED' })}>
                            Concluída
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {shift && (
                        <Badge variant="outline" className="bg-amber-50 text-[#A56A38] border-amber-200 text-xs mt-1">
                          {shift.name}
                        </Badge>
                      )}
                    </div>

                    {/* Horário */}
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{reservation.slot_time}</span>
                    </div>

                    {/* Pessoas */}
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{reservation.party_size} pessoas</span>
                    </div>

                    {/* Valor */}
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {reservation.ticket_amount && reservation.ticket_amount > 0
                          ? `R$ ${reservation.ticket_amount.toFixed(2)}`
                          : 'R$ 0,00'}
                      </span>
                    </div>

                    {/* Mesa */}
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <span className="text-sm text-gray-600">
                        {table ? table.name : '-'}
                      </span>
                    </div>

                    {/* Telefone */}
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{customer?.phone_whatsapp || '-'}</span>
                    </div>

                    {/* Nome do Cliente */}
                    <div className="flex-1 min-w-[150px]">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {customer?.full_name}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <WhatsAppButton
                        phone={customer?.phone_whatsapp}
                        message={`Olá ${customer?.full_name}! Confirmando sua reserva para ${format(new Date(reservation.date), "dd/MM")} às ${reservation.slot_time}.`}
                        size="sm"
                        className="text-xs"
                      />
                      <EditReservationDialog reservation={reservation} />
                    </div>
                  </div>

                  {/* Notas (se houver) */}
                  {reservation.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">"{reservation.notes}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}