
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { customerService, reservationService, restaurantService, tableService, shiftService } from "@/services/api.service";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, TrendingUp, Phone, Mail, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import WhatsAppButton from "../components/shared/WhatsAppButton";
import EditCustomerDialog from "../components/crm/EditCustomerDialog";

export default function CustomerDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const customerId = urlParams.get('id');

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const customers = await customerService.list();
      return customers.find(c => c.id === customerId);
    },
  });

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['customer-reservations', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      return await reservationService.filter(
        { customer_id: customerId },
        '-date'
      );
    },
    enabled: !!customerId,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await tableService.filter({ restaurant_id: restaurant.id });
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

  if (loadingCustomer) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Cliente não encontrado</h2>
          <Link to={createPageUrl('Customers')}>
            <Button>Voltar para Clientes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    noShow: reservations.filter(r => r.status === 'no_show').length,
    avgPartySize: reservations.length > 0 
      ? Math.round(reservations.reduce((sum, r) => sum + r.party_size, 0) / reservations.length)
      : 0,
    lastReservation: reservations[0]?.date,
    favoriteShift: null,
    // Calcular ticket médio
    avgTicket: reservations.filter(r => r.ticket_amount && r.ticket_amount > 0).length > 0
      ? (reservations
          .filter(r => r.ticket_amount && r.ticket_amount > 0)
          .reduce((sum, r) => sum + r.ticket_amount, 0) / 
         reservations.filter(r => r.ticket_amount && r.ticket_amount > 0).length)
      : 0
  };

  // Calcular turno favorito
  const shiftCounts = reservations.reduce((acc, r) => {
    acc[r.shift_id] = (acc[r.shift_id] || 0) + 1;
    return acc;
  }, {});
  const favoriteShiftId = Object.keys(shiftCounts).sort((a, b) => shiftCounts[b] - shiftCounts[a])[0];
  stats.favoriteShift = shifts.find(s => s.id === favoriteShiftId)?.name;

  const getTable = (tableId) => tables.find(t => t.id === tableId);
  const getShift = (shiftId) => shifts.find(s => s.id === shiftId);

  const statusColors = {
    confirmed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    no_show: "bg-orange-100 text-orange-800 border-orange-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200"
  };

  const statusLabels = {
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    no_show: "Não Compareceu",
    completed: "Concluída"
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to={createPageUrl('Customers')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Clientes
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.full_name}</h1>
              <p className="text-gray-500">Perfil completo e histórico de reservas</p>
            </div>
            <div className="flex gap-3">
              <WhatsAppButton 
                phone={customer.phone_whatsapp}
                message={`Olá ${customer.full_name}! Tudo bem?`}
                size="lg"
              />
              <EditCustomerDialog customer={customer} />
            </div>
          </div>
        </div>

        {/* Informações de Contato */}
        <Card className="mb-6 shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#A56A38]" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="font-semibold">{customer.phone_whatsapp}</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#A56A38]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-sm">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.birth_date && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#A56A38]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data de Nascimento</p>
                    <p className="font-semibold">
                      {format(new Date(customer.birth_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#A56A38]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente desde</p>
                  <p className="font-semibold">
                    {format(new Date(customer.created_date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">📝 Observações</p>
                <p className="text-sm text-yellow-800">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-[#C47B3C] to-[#A56A38] rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total de Reservas</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-[#C47B3C] to-[#A56A38] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{stats.avgPartySize}</p>
              <p className="text-xs text-gray-500">Média de Pessoas</p>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
              <p className="text-xs text-gray-500">Confirmadas</p>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-amber-50">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-[#C47B3C] to-[#A56A38] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-[#A56A38]">{stats.completed}</p>
              <p className="text-xs text-gray-500">Concluídas</p>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-red-50">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Canceladas</p>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-orange-50">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats.noShow}</p>
              <p className="text-xs text-gray-500">No-Show</p>
            </CardContent>
          </Card>
        </div>

        {/* Padrões de Comportamento */}
        {(stats.favoriteShift || stats.avgTicket > 0 || stats.lastReservation) && (
          <Card className="mb-6 shadow-lg border-none bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#A56A38]" />
                🎯 Padrões de Comportamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.favoriteShift && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Turno Preferido</p>
                    <p className="text-xl font-bold text-[#A56A38]">{stats.favoriteShift}</p>
                  </div>
                )}
                {stats.avgTicket > 0 && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                    <p className="text-xl font-bold text-[#A56A38]">
                      R$ {stats.avgTicket.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )}
                {stats.lastReservation && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Última Visita</p>
                    <p className="text-xl font-bold text-[#A56A38]">
                      {format(new Date(stats.lastReservation), "dd/MM/yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Reservas */}
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A56A38]" />
              Histórico de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {reservations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhuma reserva encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => {
                  const table = getTable(reservation.table_id);
                  const shift = getShift(reservation.shift_id);
                  return (
                    <div
                      key={reservation.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-mono text-sm font-semibold text-[#A56A38]">
                              {reservation.reservation_code}
                            </p>
                            <Badge variant="outline" className={`${statusColors[reservation.status]} border`}>
                              {statusLabels[reservation.status]}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{format(new Date(reservation.date), "dd/MM/yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{reservation.slot_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>{reservation.party_size} pessoas</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{table?.name || '-'}</span>
                            </div>
                          </div>
                          {shift && (
                            <Badge variant="outline" className="mt-2 text-xs bg-amber-50 text-[#A56A38] border-amber-200">
                              {shift.name}
                            </Badge>
                          )}
                          {reservation.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{reservation.notes}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
