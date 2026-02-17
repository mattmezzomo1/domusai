import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { restaurantService, customerService, reservationService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, Calendar, Users as UsersIcon, Download, Filter, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

import AddCustomerDialog from "../components/crm/AddCustomerDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatsAppButton from "../components/shared/WhatsAppButton";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [birthdayFilter, setBirthdayFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const selectedRestaurant = restaurants[0];

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await customerService.filter(
        { restaurant_id: selectedRestaurant.id },
        '-created_date'
      );
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const { data: allReservations } = useQuery({
    queryKey: ['all-reservations', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await reservationService.filter(
        { restaurant_id: selectedRestaurant.id },
        '-created_date'
      );
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => customerService.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomers([]);
    },
  });

  const getCustomerStats = (customerId) => {
    const customerReservations = allReservations.filter(r => r.customer_id === customerId);
    return {
      total: customerReservations.length,
      confirmed: customerReservations.filter(r => r.status === 'confirmed').length,
      cancelled: customerReservations.filter(r => r.status === 'cancelled').length,
      lastReservation: customerReservations.length > 0 ? customerReservations[0]?.date : null
    };
  };

  const isBirthdayThisMonth = (birthDate) => {
    if (!birthDate) return false;
    try {
      const birth = new Date(birthDate + 'T12:00:00');
      if (isNaN(birth.getTime())) return false;
      const now = new Date();
      return birth.getMonth() === now.getMonth();
    } catch (error) {
      return false;
    }
  };

  const formatBirthDate = (birthDate) => {
    if (!birthDate) return null;
    try {
      const date = new Date(birthDate + 'T12:00:00');
      if (isNaN(date.getTime())) return null;
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      return null;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_whatsapp.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBirthday =
      birthdayFilter === "all" ||
      (birthdayFilter === "birthday" && isBirthdayThisMonth(customer.birth_date));

    return matchesSearch && matchesBirthday;
  });

  const toggleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCustomers.length === 0) return;
    if (confirm(`Tem certeza que deseja excluir ${selectedCustomers.length} cliente(s)?`)) {
      bulkDeleteMutation.mutate(selectedCustomers);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Telefone', 'Email', 'Data Nascimento', 'Total Reservas', 'Confirmadas', 'Canceladas', 'Última Reserva'];
    const rows = filteredCustomers.map(customer => {
      const stats = getCustomerStats(customer.id);
      return [
        `"${customer.full_name.replace(/"/g, '""')}"`,
        customer.phone_whatsapp,
        customer.email ? `"${customer.email.replace(/"/g, '""')}"` : '',
        customer.birth_date ? format(new Date(customer.birth_date), "dd/MM/yyyy") : '',
        stats.total,
        stats.confirmed,
        stats.cancelled,
        stats.lastReservation ? format(new Date(stats.lastReservation), "dd/MM/yyyy") : ''
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <SubscriptionGuard>
    <div className="p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">CRM de Clientes</h1>
          <p className="text-xs md:text-sm text-gray-500 mb-2">Gerencie seus clientes e histórico</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <AddCustomerDialog />
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
              <UsersIcon className="w-4 h-4 md:w-5 md:h-5 text-[#A56A38]" />
              Base de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Search and Filters */}
            <div className="space-y-3 mb-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full md:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>

              {/* Filters */}
              <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
                <Select value={birthdayFilter} onValueChange={setBirthdayFilter}>
                  <SelectTrigger className="w-full h-10 md:h-12 text-sm md:text-base">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    <SelectItem value="birthday">🎂 Aniversariantes do Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCustomers.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  {selectedCustomers.length} cliente(s) selecionado(s)
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {bulkDeleteMutation.isPending ? 'Excluindo...' : 'Excluir Selecionados'}
                </Button>
              </div>
            )}

            {/* Results Count and Select All */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs md:text-sm text-gray-600">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
              </div>
              {filteredCustomers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs"
                >
                  {selectedCustomers.length === filteredCustomers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              )}
            </div>

            {/* Customers List */}
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 md:h-32 w-full" />
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <UsersIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-sm md:text-base text-gray-500">
                  {searchQuery || birthdayFilter === "birthday" ? "Tente ajustar os filtros" : "Adicione seu primeiro cliente"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id);
                  return (
                    <div key={customer.id} className="bg-gray-50 rounded-lg p-3 md:p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectCustomer(customer.id);
                          }}
                          className="w-4 h-4 mt-1 cursor-pointer shrink-0"
                        />
                        <Link
                          to={`${createPageUrl('CustomerDetail')}?id=${customer.id}`}
                          className="flex-1 block"
                        >
                          {/* Header */}
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">
                                {customer.full_name}
                              </h3>
                              {customer.notes && (
                                <p className="text-xs md:text-sm text-gray-500 line-clamp-1">{customer.notes}</p>
                              )}
                            </div>
                            <div onClick={(e) => e.preventDefault()}>
                              <WhatsAppButton
                                phone={customer.phone_whatsapp}
                                message={`Olá ${customer.full_name}! Tudo bem?`}
                                size="sm"
                                className="text-xs"
                              />
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs md:text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <Phone className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                              <span className="font-medium truncate">{customer.phone_whatsapp}</span>
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.birth_date && formatBirthDate(customer.birth_date) && (
                              <div className="flex items-center gap-2 min-w-0">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400 shrink-0" />
                                <span className="truncate">{formatBirthDate(customer.birth_date)}</span>
                              </div>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                            <Badge variant="outline" className="bg-amber-50 text-[#A56A38] border-amber-200 text-[10px] md:text-xs">
                              {stats.total} reservas
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] md:text-xs">
                              {stats.confirmed} confirmadas
                            </Badge>
                            {stats.cancelled > 0 && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] md:text-xs">
                                {stats.cancelled} canceladas
                              </Badge>
                            )}
                            {stats.lastReservation && (
                              <Badge variant="outline" className="text-[10px] md:text-xs">
                                Última: {format(new Date(stats.lastReservation), "dd/MM/yyyy")}
                              </Badge>
                            )}
                          </div>
                        </Link>
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
    </SubscriptionGuard>
  );
}