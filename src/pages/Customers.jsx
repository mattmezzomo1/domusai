import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { restaurantService, customerService, reservationService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, Calendar, Users as UsersIcon, Download, Filter, Trash2, Medal, Award, Gem, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";
import { Checkbox } from "@/components/ui/checkbox";

import AddCustomerDialog from "../components/crm/AddCustomerDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatsAppButton from "../components/shared/WhatsAppButton";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const selectedRestaurant = restaurants[0];

  // Helper function to format WhatsApp message
  const formatWhatsAppMessage = (customerName) => {
    const template = selectedRestaurant?.whatsapp_message_template || 'Olá {nome}! Tudo bem?';
    return template.replace(/{nome}/g, customerName);
  };

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
      confirmed: customerReservations.filter(r => r.status?.toUpperCase() === 'CONFIRMED').length,
      cancelled: customerReservations.filter(r => r.status?.toUpperCase() === 'CANCELLED').length,
      lastReservation: customerReservations.length > 0 ? customerReservations[0]?.date : null
    };
  };

  const getCustomerLevel = (reservationCount) => {
    if (reservationCount === 0) return { name: 'Novo', icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    if (reservationCount >= 1 && reservationCount <= 5) return { name: 'Bronze', icon: Medal, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
    if (reservationCount >= 6 && reservationCount <= 15) return { name: 'Prata', icon: Medal, color: 'text-gray-400', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' };
    if (reservationCount >= 16 && reservationCount <= 30) return { name: 'Ouro', icon: Award, color: 'text-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' };
    return { name: 'Diamante', icon: Gem, color: 'text-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' };
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
    const stats = getCustomerStats(customer.id);
    const level = getCustomerLevel(stats.total);

    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_whatsapp.includes(searchQuery) ||
      (customer.cpf && customer.cpf.includes(searchQuery)) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      levelFilter === "all" || level.name === levelFilter;

    const matchesMonth =
      monthFilter === "all" ||
      (monthFilter === "birthday" && isBirthdayThisMonth(customer.birth_date));

    return matchesSearch && matchesLevel && matchesMonth;
  });

  // Calculate level statistics
  const levelStats = {
    total: customers.length,
    bronze: customers.filter(c => {
      const stats = getCustomerStats(c.id);
      const level = getCustomerLevel(stats.total);
      return level.name === 'Bronze';
    }).length,
    prata: customers.filter(c => {
      const stats = getCustomerStats(c.id);
      const level = getCustomerLevel(stats.total);
      return level.name === 'Prata';
    }).length,
    ouro: customers.filter(c => {
      const stats = getCustomerStats(c.id);
      const level = getCustomerLevel(stats.total);
      return level.name === 'Ouro';
    }).length,
    diamante: customers.filter(c => {
      const stats = getCustomerStats(c.id);
      const level = getCustomerLevel(stats.total);
      return level.name === 'Diamante';
    }).length,
  };

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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">CRM</h1>
              <p className="text-sm text-gray-500">Gestão de clientes e fidelidade</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="h-10 border-gray-300 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <AddCustomerDialog />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Total */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">{levelStats.total}</div>
                <div className="text-sm text-gray-600">Total de Clientes</div>
              </CardContent>
            </Card>

            {/* Bronze */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl font-bold text-gray-900">{levelStats.bronze}</div>
                  <Medal className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-sm text-gray-600">Bronze</div>
              </CardContent>
            </Card>

            {/* Prata */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl font-bold text-gray-900">{levelStats.prata}</div>
                  <Medal className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600">Prata</div>
              </CardContent>
            </Card>

            {/* Ouro */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl font-bold text-gray-900">{levelStats.ouro}</div>
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-sm text-gray-600">Ouro</div>
              </CardContent>
            </Card>

            {/* Diamante */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl font-bold text-gray-900">{levelStats.diamante}</div>
                  <Gem className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-sm text-gray-600">Diamante</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Checkbox Selecionar tudo */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                onCheckedChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="select-all" className="text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                Selecionar tudo
              </label>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm border-gray-300"
              />
            </div>

            {/* Filters */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40 h-9 text-sm border-gray-300">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Prata">Prata</SelectItem>
                <SelectItem value="Ouro">Ouro</SelectItem>
                <SelectItem value="Diamante">Diamante</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-40 h-9 text-sm border-gray-300">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">todos os meses</SelectItem>
                <SelectItem value="birthday">Aniversariantes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9 text-sm border-gray-300">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </div>
            {selectedCustomers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="h-8"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {bulkDeleteMutation.isPending ? 'Excluindo...' : `Excluir ${selectedCustomers.length}`}
              </Button>
            )}
          </div>
        </div>

        {/* Customers List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum cliente encontrado</h3>
            <p className="text-base text-gray-500">
              {searchQuery || levelFilter !== "all" || monthFilter !== "all" ? "Tente ajustar os filtros" : "Adicione seu primeiro cliente"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((customer) => {
              const stats = getCustomerStats(customer.id);
              const level = getCustomerLevel(stats.total);
              const LevelIcon = level.icon;
              const initials = customer.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => toggleSelectCustomer(customer.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FA7318] to-[#f59e0c] flex items-center justify-center shrink-0">
                      <span className="text-white font-semibold text-sm">{initials}</span>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {customer.full_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-mono">{customer.phone_whatsapp}</span>
                        {customer.cpf && <span>• {customer.cpf}</span>}
                      </div>
                    </div>

                    {/* Level Badge */}
                    <Badge className={`${level.bgColor} ${level.color} border-0 px-2.5 py-1 text-xs font-medium`}>
                      <LevelIcon className="w-3 h-3 mr-1" />
                      {level.name}
                    </Badge>

                    {/* Reservations Count */}
                    <div className="text-center px-3">
                      <div className="text-sm font-semibold text-gray-900">{stats.total} reservas</div>
                      <div className="text-xs text-gray-500">{stats.lastReservation ? format(new Date(stats.lastReservation), "dd/MM/yy") : 'Sem reservas'}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <WhatsAppButton
                          phone={customer.phone_whatsapp}
                          message={formatWhatsAppMessage(customer.full_name)}
                          size="sm"
                          className="h-9 text-xs"
                        />
                      </div>
                      <Link to={`${createPageUrl('CustomerDetail')}?id=${customer.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-600 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}