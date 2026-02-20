import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { restaurantService, reservationService, customerService, tableService, shiftService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Clock, Users, MapPin, Phone, Download, Filter, DollarSign, Trash2, Plus } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

import AddReservationDialog from "../components/reservations/AddReservationDialog";
import EditReservationDialog from "../components/reservations/EditReservationDialog";
import WhatsAppButton from "../components/shared/WhatsAppButton";

export default function Reservations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketValue, setTicketValue] = useState('');
  const [selectedReservations, setSelectedReservations] = useState([]);

  // Novos filtros
  const [customerFilter, setCustomerFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc, date_asc, code, customer_name

  // Visualização (dia/semana/mês)
  const [viewMode, setViewMode] = useState("week"); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  // Helper function to format WhatsApp message
  const formatWhatsAppMessage = (customerName) => {
    const template = restaurant?.whatsapp_message_template || 'Olá {nome}! Tudo bem?';
    return template.replace(/{nome}/g, customerName);
  };

  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0]);
    }
  }, [restaurants, selectedRestaurant]);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['all-reservations', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await reservationService.filter(
        { restaurant_id: selectedRestaurant.id },
        '-date'
      );
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await customerService.filter({ restaurant_id: selectedRestaurant.id });
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await tableService.filter({ restaurant_id: selectedRestaurant.id });
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await shiftService.filter({ restaurant_id: selectedRestaurant.id });
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const queryClient = useQueryClient();

  // Atualizar datas baseado no modo de visualização
  useEffect(() => {
    updateDateRange();
  }, [viewMode, currentDate]);

  const updateDateRange = () => {
    let start, end;

    if (viewMode === "day") {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else if (viewMode === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Domingo
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else if (viewMode === "month") {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentDate(new Date()); // Reset para hoje
  };

  const navigatePrevious = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, ticket_amount }) => reservationService.update(id, {
      ticket_amount: parseFloat(ticket_amount)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reservations', selectedRestaurant?.id] });
      setEditingTicket(null);
      setTicketValue('');
    },
  });

  const confirmReservationMutation = useMutation({
    mutationFn: (id) => reservationService.update(id, {
      status: 'CONFIRMED'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-reservations']);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => reservationService.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
      setSelectedReservations([]);
    },
  });

  const handleTicketSave = (reservationId) => {
    if (ticketValue !== '' && parseFloat(ticketValue) >= 0) {
      updateTicketMutation.mutate({ 
        id: reservationId, 
        ticket_amount: ticketValue 
      });
    } else {
      // If ticketValue is empty, set it to 0
      updateTicketMutation.mutate({ 
        id: reservationId, 
        ticket_amount: 0 
      });
    }
  };

  const getCustomer = (customerId) => customers.find(c => c.id === customerId);
  const getTable = (tableId) => tables.find(t => t.id === tableId);
  const getShift = (shiftId) => shifts.find(s => s.id === shiftId);

  const filteredReservations = reservations.filter(reservation => {
    const customer = reservation.customer || getCustomer(reservation.customer_id);
    const table = getTable(reservation.table_id);

    const matchesSearch =
      reservation.reservation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.phone_whatsapp.includes(searchQuery);

    // Comparar status (já está em UPPERCASE no backend)
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;

    // Comparar datas corretamente (formato YYYY-MM-DD)
    const reservationDate = typeof reservation.date === 'string'
      ? reservation.date.split('T')[0]
      : reservation.date;
    const matchesDateRange = (!startDate || reservationDate >= startDate) &&
                             (!endDate || reservationDate <= endDate);

    const matchesCustomer = !customerFilter ||
      customer?.full_name.toLowerCase().includes(customerFilter.toLowerCase());

    const matchesTable = tableFilter === "all" || reservation.table_id === tableFilter;

    const matchesShift = shiftFilter === "all" || reservation.shift_id === shiftFilter;

    return matchesSearch && matchesStatus && matchesDateRange && matchesCustomer && matchesTable && matchesShift;
  }).sort((a, b) => {
    const customerA = getCustomer(a.customer_id);
    const customerB = getCustomer(b.customer_id);
    
    switch(sortBy) {
      case "date_asc":
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.slot_time.localeCompare(b.slot_time);
      case "date_desc":
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.slot_time.localeCompare(a.slot_time);
      case "code":
        return a.reservation_code.localeCompare(b.reservation_code);
      case "customer_name":
        return (customerA?.full_name || "").localeCompare(customerB?.full_name || "");
      default:
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.slot_time.localeCompare(b.slot_time);
    }
  });

  // Paginação
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, startDate, endDate, customerFilter, tableFilter, shiftFilter, sortBy]);

  const statusColors = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    CONFIRMED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    NO_SHOW: "bg-orange-50 text-orange-700 border-orange-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200"
  };

  const statusLabels = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    NO_SHOW: "Não Compareceu",
    COMPLETED: "Concluída"
  };

  const toggleSelectReservation = (reservationId) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReservations.length === paginatedReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(paginatedReservations.map(r => r.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedReservations.length === 0) return;
    if (confirm(`Tem certeza que deseja excluir ${selectedReservations.length} reserva(s)?`)) {
      bulkDeleteMutation.mutate(selectedReservations);
    }
  };

  const exportToCSV = () => {
    const headers = ['Código,Data,Horário,Cliente,Telefone,Pessoas,Mesa,Status,Valor'];
    const rows = filteredReservations.map(reservation => {
      const customer = getCustomer(reservation.customer_id);
      const table = getTable(reservation.table_id);
      return [
        reservation.reservation_code,
        reservation.date,
        reservation.slot_time,
        customer?.full_name || '',
        customer?.phone_whatsapp || '',
        reservation.party_size,
        table?.name || '',
        statusLabels[reservation.status],
        reservation.ticket_amount ? reservation.ticket_amount.toFixed(2) : '0.00'
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <SubscriptionGuard>
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Reservas</h1>
              <p className="text-sm text-gray-500">Gerencie todas as reservas do restaurante</p>
            </div>

            <div className="flex gap-2.5">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="hover:bg-gray-50 border-gray-300 h-10 px-4 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <AddReservationDialog
                trigger={
                  <Button className="bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white shadow-sm h-10 px-4 text-sm font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Reserva
                  </Button>
                }
              />
            </div>
          </div>

          {/* Toolbar - Desktop */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4 hidden md:block">
            {/* Linha única: Checkbox, Busca, Filtros e Data */}
            <div className="flex items-center gap-3 p-3">
              {/* Checkbox Selecionar tudo */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="checkbox"
                  checked={selectedReservations.length === paginatedReservations.length && paginatedReservations.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer rounded border-gray-300"
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">Selecionar tudo</span>
              </div>

              {/* Campo de Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, código ou CPF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm border-gray-300"
                />
              </div>

              {/* Filtro Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40 text-sm border-gray-300">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="NO_SHOW">No-Show</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Turno */}
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="h-9 w-40 text-sm border-gray-300">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {shifts.map(shift => (
                    <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Navegação de Data */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigatePrevious}
                  className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToday}
                  className="h-9 px-3 text-sm border-gray-300 hover:bg-gray-50"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateNext}
                  className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>

              {/* Seletor de Data */}
              <Input
                type="date"
                value={format(currentDate, "yyyy-MM-dd")}
                onChange={(e) => setCurrentDate(new Date(e.target.value))}
                className="h-9 w-44 text-sm border-gray-300"
              />

              {/* Botões de Visualização */}
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewModeChange("day")}
                  className={`h-9 px-4 text-sm border-gray-300 ${
                    viewMode === "day"
                      ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] text-white border-0 hover:from-[#e66610] hover:to-[#dc8c08]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Dia
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewModeChange("week")}
                  className={`h-9 px-4 text-sm border-gray-300 ${
                    viewMode === "week"
                      ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] text-white border-0 hover:from-[#e66610] hover:to-[#dc8c08]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewModeChange("month")}
                  className={`h-9 px-4 text-sm border-gray-300 ${
                    viewMode === "month"
                      ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] text-white border-0 hover:from-[#e66610] hover:to-[#dc8c08]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Mês
                </Button>
              </div>
            </div>
          </div>

          {/* Toolbar - Mobile */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4 md:hidden">
            <div className="p-3 space-y-3">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm border-gray-300"
                />
              </div>

              {/* Filtros em linha */}
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 flex-1 text-sm border-gray-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                    <SelectItem value="COMPLETED">Concluída</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    <SelectItem value="NO_SHOW">No-Show</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger className="h-10 flex-1 text-sm border-gray-300">
                    <SelectValue placeholder="Turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {shifts.map(shift => (
                      <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Navegação de Data e Botões de Visualização */}
              <div className="flex items-center justify-between gap-2">
                {/* Navegação */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigatePrevious}
                    className="h-10 w-10 p-0 border-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToday}
                    className="h-10 px-3 text-sm border-gray-300"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateNext}
                    className="h-10 w-10 p-0 border-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>

                {/* Botões de Visualização */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewModeChange("day")}
                    className={`h-10 px-3 text-xs border-gray-300 ${
                      viewMode === "day"
                        ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] text-white border-0"
                        : "bg-white"
                    }`}
                  >
                    Dia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewModeChange("week")}
                    className={`h-10 px-3 text-xs border-gray-300 ${
                      viewMode === "week"
                        ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] text-white border-0"
                        : "bg-white"
                    }`}
                  >
                    Semana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewModeChange("month")}
                    className={`h-10 px-3 text-xs border-gray-300 ${
                      viewMode === "month"
                        ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] text-white border-0"
                        : "bg-white"
                    }`}
                  >
                    Mês
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Period Indicator */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {viewMode === "day" && (
                <span>Mostrando reservas de <strong>{format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong></span>
              )}
              {viewMode === "week" && (
                <span>Mostrando reservas de <strong>{format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd/MM", { locale: ptBR })} a {format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd/MM/yyyy", { locale: ptBR })}</strong></span>
              )}
              {viewMode === "month" && (
                <span>Mostrando reservas de <strong>{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</strong></span>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva' : 'reservas'}
            </div>
          </div>

          {/* Reservations List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : paginatedReservations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-base text-gray-500">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <>
              {/* Group reservations by date */}
              {Object.entries(
                paginatedReservations.reduce((groups, reservation) => {
                  const date = reservation.date.split('T')[0];
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(reservation);
                  return groups;
                }, {})
              ).map(([date, dateReservations]) => {
                const reservationDate = new Date(date + 'T00:00:00');
                const dayOfWeek = format(reservationDate, 'EEEE', { locale: ptBR });
                const dayNumber = format(reservationDate, 'd');
                const monthName = format(reservationDate, 'MMMM', { locale: ptBR });
                const totalPeople = dateReservations.reduce((sum, r) => sum + r.party_size, 0);
                const occupancyRate = Math.round((dateReservations.length / 10) * 100); // Simplified calculation

                return (
                  <div key={date} className="mb-5">
                    {/* Date Header - Desktop */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2.5 hidden md:block">
                      <div className="flex items-center gap-6">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          {dayOfWeek.toUpperCase()}, {dayNumber} DE {monthName.toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-5 text-xs text-gray-600">
                          <span className="font-medium">{dateReservations.length} reservas</span>
                          <span className="font-medium">{dateReservations.filter(r => r.status !== 'CANCELLED').length} lugares</span>
                          <span className="text-[#FA7318] font-semibold">{occupancyRate}% ocupação</span>
                        </div>
                      </div>
                    </div>

                    {/* Date Header - Mobile */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2.5 md:hidden">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                          {dayOfWeek.toUpperCase()}, {dayNumber} DE {monthName.toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-medium text-gray-600">{dateReservations.length} reservas</span>
                          <span className="text-[#FA7318] font-semibold">{occupancyRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Reservations for this date */}
                    <div className="space-y-2">
                      {dateReservations.map((reservation) => {
                        const customer = getCustomer(reservation.customer_id);
                        const table = getTable(reservation.table_id);
                        const shift = getShift(reservation.shift_id);

                        return (
                          <div
                            key={reservation.id}
                            className="bg-white border border-gray-200 rounded-lg p-3.5 hover:shadow-sm transition-shadow"
                          >
                            {/* Desktop Layout */}
                            <div className="hidden md:flex items-center gap-3">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={selectedReservations.includes(reservation.id)}
                                onChange={() => toggleSelectReservation(reservation.id)}
                                className="w-4 h-4 cursor-pointer shrink-0 rounded border-gray-300"
                              />

                              {/* Código da Reserva */}
                              <div className="w-28 shrink-0">
                                <p className="font-mono text-xs font-medium text-gray-700">
                                  {reservation.reservation_code}
                                </p>
                              </div>

                              {/* Badges (Status, Turno, etc) */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`${statusColors[reservation.status]} border-0 text-xs px-2.5 py-0.5 font-medium rounded-md`}
                                >
                                  {statusLabels[reservation.status]}
                                </Badge>
                                {shift && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-0 text-xs px-2.5 py-0.5 font-medium rounded-md">
                                    {shift.name}
                                  </Badge>
                                )}
                              </div>

                              {/* Informações em linha */}
                              <div className="flex items-center gap-5 flex-1 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="font-medium text-gray-700">{reservation.slot_time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-600">{reservation.party_size} pessoas</span>
                                </div>
                                {reservation.ticket_amount > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-gray-600">R$ {reservation.ticket_amount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-600">Mesa {table?.name || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-600">{customer?.phone_whatsapp}</span>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="flex items-center gap-2 shrink-0">
                                <WhatsAppButton
                                  phone={customer?.phone_whatsapp}
                                  message={formatWhatsAppMessage(customer?.full_name)}
                                />
                                <EditReservationDialog reservation={reservation} />
                              </div>
                            </div>

                            {/* Nome do Cliente - Desktop */}
                            <div className="mt-2.5 pl-7 hidden md:block">
                              <p className="font-medium text-sm text-gray-900">
                                {customer?.full_name}
                              </p>
                              {reservation.notes && (
                                <p className="text-xs text-gray-500 mt-0.5 italic">"{reservation.notes}"</p>
                              )}
                            </div>

                            {/* Mobile Layout */}
                            <div className="md:hidden">
                              {/* Header com Código e Status */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedReservations.includes(reservation.id)}
                                    onChange={() => toggleSelectReservation(reservation.id)}
                                    className="w-4 h-4 cursor-pointer shrink-0 rounded border-gray-300 mt-0.5"
                                  />
                                  <div>
                                    <p className="font-mono text-xs font-medium text-gray-700">
                                      {reservation.reservation_code}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`${statusColors[reservation.status]} border-0 text-xs px-2.5 py-0.5 font-medium rounded-md`}
                                >
                                  {statusLabels[reservation.status]}
                                </Badge>
                              </div>

                              {/* Nome do Cliente */}
                              <p className="font-semibold text-base text-gray-900 mb-2">
                                {customer?.full_name}
                              </p>

                              {/* Informações Principais */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-[#FA7318]" />
                                  <span className="text-sm font-medium text-gray-900">{reservation.slot_time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{reservation.party_size} pessoas</span>
                                </div>
                                {shift && (
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-0 text-xs px-2 py-0.5 font-medium rounded-md">
                                      {shift.name}
                                    </Badge>
                                  </div>
                                )}
                                {table && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">Mesa {table.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notas */}
                              {reservation.notes && (
                                <p className="text-xs text-gray-500 mb-3 italic bg-gray-50 p-2 rounded">
                                  "{reservation.notes}"
                                </p>
                              )}

                              {/* Ações */}
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <WhatsAppButton
                                  phone={customer?.phone_whatsapp}
                                  message={formatWhatsAppMessage(customer?.full_name)}
                                />
                                <EditReservationDialog reservation={reservation} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}