import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { restaurantService, reservationService, customerService, tableService, shiftService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Clock, Users, MapPin, Phone, Download, Filter, DollarSign, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

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
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200", // New status
    confirmed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    no_show: "bg-orange-100 text-orange-800 border-orange-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200" // Changed from yellow-toned to blue-toned
  };

  const statusLabels = {
    pending: "Reservada", // New status label
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    no_show: "Não Compareceu",
    completed: "Concluída"
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
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Reservas</h1>
          <p className="text-sm md:text-base text-gray-500 mb-4">Gerencie todas as reservas do restaurante</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <AddReservationDialog />
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="w-full sm:w-auto hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38]"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b p-4 md:p-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#A56A38]" />
              Todas as Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Search and Filters */}
            <div className="space-y-3 md:space-y-4 mb-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  placeholder="Buscar por código, cliente ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base"
                />
              </div>

              {/* Filter Toggle Button (Mobile) */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full md:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>

              {/* Filters */}
              <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 ${showFilters ? 'block' : 'hidden md:grid'}`}>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 md:h-12 text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="PENDING">Reservadas</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                      <SelectItem value="COMPLETED">Concluídas</SelectItem>
                      <SelectItem value="CANCELLED">Canceladas</SelectItem>
                      <SelectItem value="NO_SHOW">No-Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Turno</Label>
                  <Select value={shiftFilter} onValueChange={setShiftFilter}>
                    <SelectTrigger className="h-10 md:h-12 text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Turnos</SelectItem>
                      {shifts.map(shift => (
                        <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Mesa</Label>
                  <Select value={tableFilter} onValueChange={setTableFilter}>
                    <SelectTrigger className="h-10 md:h-12 text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Mesas</SelectItem>
                      {tables.sort((a, b) => a.name.localeCompare(b.name)).map(table => (
                        <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 md:h-12 text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Data (Mais Recente)</SelectItem>
                      <SelectItem value="date_asc">Data (Mais Antiga)</SelectItem>
                      <SelectItem value="code">Código da Reserva</SelectItem>
                      <SelectItem value="customer_name">Nome do Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda linha de filtros */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${showFilters ? 'block' : 'hidden md:grid'}`}>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 md:h-12 text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 md:h-12 text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Filtrar por Cliente</Label>
                  <Input
                    type="text"
                    placeholder="Nome do cliente..."
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="h-10 md:h-12 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

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

            {/* Results Count and Select All */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs md:text-sm text-gray-600">
                {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-500">
                    (Página {currentPage} de {totalPages})
                  </span>
                )}
              </div>
              {paginatedReservations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs"
                >
                  {selectedReservations.length === paginatedReservations.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              )}
            </div>

            {/* Reservations List */}
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 md:h-32 w-full" />
                ))}
              </div>
            ) : paginatedReservations.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Nenhuma reserva encontrada</h3>
                <p className="text-sm md:text-base text-gray-500">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <>
              <div className="space-y-3 md:space-y-4">
                {paginatedReservations.map((reservation) => {
                  const customer = getCustomer(reservation.customer_id);
                  const table = getTable(reservation.table_id);
                  const shift = getShift(reservation.shift_id);
                  
                  return (
                    <div
                      key={reservation.id}
                      className="bg-gray-50 rounded-lg p-3 md:p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedReservations.includes(reservation.id)}
                          onChange={() => toggleSelectReservation(reservation.id)}
                          className="w-4 h-4 mt-1 cursor-pointer shrink-0"
                        />
                        <div className="flex-1">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs md:text-sm font-semibold text-[#A56A38]">
                            {reservation.reservation_code}
                          </p>
                          <Badge variant="outline" className={`${statusColors[reservation.status]} border text-[10px] md:text-xs`}>
                            {statusLabels[reservation.status]}
                          </Badge>
                          {shift && (
                            <Badge variant="outline" className="bg-amber-50 text-[#A56A38] border-amber-200 text-[10px] md:text-xs">
                              {shift.name}
                            </Badge>
                          )}
                          
                          {/* Tag Alterada */}
                          {reservation.tags && reservation.tags.includes('alterada') && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] md:text-xs">
                              Alterada
                            </Badge>
                          )}

                          {/* Ticket Amount */}
                          {reservation.ticket_amount !== undefined && reservation.ticket_amount > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] md:text-xs">
                              <DollarSign className="w-3 h-3 mr-1" />
                              R$ {reservation.ticket_amount.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {reservation.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => confirmReservationMutation.mutate(reservation.id)}
                              disabled={confirmReservationMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                            >
                              Confirmar
                            </Button>
                          )}
                          <WhatsAppButton
                            phone={customer?.phone_whatsapp}
                            message={`Olá ${customer?.full_name}! Sobre sua reserva ${reservation.reservation_code}.`}
                            size="sm"
                            className="text-xs"
                          />
                          <EditReservationDialog reservation={reservation} />
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 text-xs md:text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{format(new Date(reservation.date), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="font-semibold truncate">{reservation.slot_time}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{reservation.party_size} pessoas</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{table?.name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{customer?.phone_whatsapp}</span>
                        </div>
                      </div>

                      {/* Customer Name and Ticket Input */}
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

                          {/* Quick Ticket Input */}
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
                                {reservation.ticket_amount !== undefined && reservation.ticket_amount > 0 ? 'Editar' : 'Valor'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      </div>
                      </div>
                      </div>
                      );
                      })}
                      </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
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
                          className={currentPage === pageNum ? "bg-[#C47B3C] hover:bg-[#A56A38]" : ""}
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
          </CardContent>
        </Card>
      </div>
    </div>
    </SubscriptionGuard>
  );
}