import React, { useState } from "react";
import { restaurantService, reservationService, customerService, shiftService, tableService } from "@/services/api.service";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, AlertTriangle, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, differenceInYears, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

export default function Insights() {
  const [period, setPeriod] = useState('month'); // month, last_month, quarter, daily
  const [dailyDate, setDailyDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const getPeriodDates = () => {
    const now = new Date();
    if (period === 'month') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (period === 'last_month') {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    } else if (period === 'daily') {
      return { start: startOfDay(new Date(dailyDate)), end: endOfDay(new Date(dailyDate)) };
    } else if (period === 'quarter') { // quarter
      const threeMonthsAgo = subMonths(now, 3);
      return { start: startOfMonth(threeMonthsAgo), end: endOfMonth(now) }; // Adjusted quarter to be full months
    } else {
      // Default to month if period is unknown
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getPeriodDates();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['insights-reservations', restaurant?.id, start, end],
    queryFn: async () => {
      if (!restaurant) return [];
      // Filter reservations by date range directly in the query to avoid fetching all if possible
      // This part assumes the API can filter by date range, otherwise filtering below is necessary
      return await reservationService.filter({
        restaurant_id: restaurant.id,
        // Assuming 'date' field in reservation is comparable
        // 'date__gte': format(start, 'yyyy-MM-dd'),
        // 'date__lte': format(end, 'yyyy-MM-dd'),
      }, '-date');
    },
    enabled: !!restaurant,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['insights-customers', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await customerService.filter({
        restaurant_id: restaurant.id
      });
    },
    enabled: !!restaurant,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['insights-shifts', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await shiftService.filter({
        restaurant_id: restaurant.id
      });
    },
    enabled: !!restaurant,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['insights-tables', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await tableService.filter({
        restaurant_id: restaurant.id
      });
    },
    enabled: !!restaurant,
  });

  // Filtrar reservas do período
  const periodReservations = reservations.filter(r => {
    if (!r.date) return false;
    try {
      const resDate = new Date(r.date);
      if (isNaN(resDate.getTime())) return false;
      // Ensure comparison is robust against time components
      resDate.setHours(0, 0, 0, 0);
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      return resDate >= startDate && resDate <= endDate;
    } catch (error) {
      return false;
    }
  });

  // Calcular KPIs principais
  const totalReservations = periodReservations.length;
  const confirmedReservations = periodReservations.filter(r => r.status === 'confirmed' || r.status === 'completed').length;
  const noShowReservations = periodReservations.filter(r => r.status === 'no_show').length;
  const cancelledReservations = periodReservations.filter(r => r.status === 'cancelled').length;
  const completedReservations = periodReservations.filter(r => r.status === 'completed').length;

  const noShowRate = totalReservations > 0 ? (noShowReservations / totalReservations * 100).toFixed(1) : 0;
  const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations * 100).toFixed(1) : 0;
  const completionRate = totalReservations > 0 ? (completedReservations / totalReservations * 100).toFixed(1) : 0;

  // Calcular receita total
  const totalRevenue = periodReservations
    .filter(r => r.ticket_amount && r.status === 'completed')
    .reduce((sum, r) => sum + r.ticket_amount, 0);

  // Calcular ticket médio da casa
  const avgTicket = periodReservations.filter(r => r.ticket_amount && r.ticket_amount > 0).length > 0
    ? (periodReservations
        .filter(r => r.ticket_amount && r.ticket_amount > 0)
        .reduce((sum, r) => sum + r.ticket_amount, 0) / 
       periodReservations.filter(r => r.ticket_amount && r.ticket_amount > 0).length)
    : 0;

  // Lead time médio (tempo entre criação e data da reserva) - calculation kept but not displayed
  const leadTimes = periodReservations
    .filter(r => r.created_date && r.date)
    .map(r => {
      try {
        const createdDate = new Date(r.created_date);
        const reservationDate = new Date(r.date);
        if (isNaN(createdDate.getTime()) || isNaN(reservationDate.getTime())) return null;
        return differenceInDays(reservationDate, createdDate);
      } catch (error) {
        return null;
      }
    })
    .filter(time => time !== null);
  const averageLeadTime = leadTimes.length > 0
    ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1)
    : 0;

  // Insights de Público: Idade e Gênero
  const publicInsights = {
    byAge: {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0,
      'Não informado': 0
    },
    byGender: {
      'Masculino': 0,
      'Feminino': 0,
      'Outro': 0,
      'Não informado': 0
    }
  };

  // Processar clientes com reservas no período para demográficos
  const customerIdsInPeriodReservations = new Set(periodReservations.map(r => r.customer_id));
  const uniqueCustomersInPeriod = customers.filter(c => customerIdsInPeriodReservations.has(c.id));

  uniqueCustomersInPeriod.forEach(customer => {
    // Idade
    if (customer.birth_date) {
      try {
        const birthDate = new Date(customer.birth_date + 'T12:00:00');
        if (isNaN(birthDate.getTime())) {
          publicInsights.byAge['Não informado']++;
        } else {
          const age = differenceInYears(new Date(), birthDate);
          if (age >= 18 && age <= 25) publicInsights.byAge['18-25']++;
          else if (age >= 26 && age <= 35) publicInsights.byAge['26-35']++;
          else if (age >= 36 && age <= 45) publicInsights.byAge['36-45']++;
          else if (age >= 46 && age <= 55) publicInsights.byAge['46-55']++;
          else if (age >= 56) publicInsights.byAge['56+']++;
          else publicInsights.byAge['Não informado']++; // For ages outside these ranges, e.g., <18
        }
      } catch (error) {
        publicInsights.byAge['Não informado']++;
      }
    } else {
      publicInsights.byAge['Não informado']++;
    }

    // Gênero
    if (customer.gender) {
      const normalizedGender = customer.gender.toLowerCase();
      if (normalizedGender === 'male' || normalizedGender === 'masculino') publicInsights.byGender['Masculino']++;
      else if (normalizedGender === 'female' || normalizedGender === 'feminino') publicInsights.byGender['Feminino']++;
      else publicInsights.byGender['Outro']++;
    } else {
      publicInsights.byGender['Não informado']++;
    }
  });

  const ageData = Object.entries(publicInsights.byAge)
    .filter(([, value]) => value > 0) // Only include age groups with data
    .map(([name, value]) => ({
      name,
      value
    }));

  const genderData = Object.entries(publicInsights.byGender)
    .filter(([, value]) => value > 0) // Only include genders with data
    .map(([name, value]) => ({
      name,
      value
    }));

  // Ocupação por turno
  const occupancyByShift = shifts.map(shift => {
    const shiftReservations = periodReservations.filter(r => r.shift_id === shift.id && (r.status === 'confirmed' || r.status === 'completed'));
    const totalSeatsReserved = shiftReservations.reduce((sum, r) => sum + r.party_size, 0);
    const totalCapacity = tables.reduce((sum, t) => sum + t.seats, 0);
    const daysInPeriod = differenceInDays(end, start) + 1;
    // Max capacity per day based on table seats
    // Assuming a shift might repeat daily within the period, so multiply by days.
    // This calculation needs careful consideration for how "occupancy" is defined.
    // If a restaurant has 1 shift per day and 100 seats, over 30 days, capacity is 3000.
    const maxShiftCapacityOverPeriod = totalCapacity > 0 ? totalCapacity * daysInPeriod : 0; // Seats * Days
    
    // Occupancy based on seats reserved vs total capacity of tables over the period for that shift
    const occupancy = maxShiftCapacityOverPeriod > 0 ? (totalSeatsReserved / maxShiftCapacityOverPeriod * 100).toFixed(1) : 0;

    return {
      name: shift.name,
      ocupacao: parseFloat(occupancy),
      reservas: shiftReservations.length
    };
  });


  // Reservas por dia da semana
  const dayOfWeekData = [
    { name: 'Dom', reservas: 0 },
    { name: 'Seg', reservas: 0 },
    { name: 'Ter', reservas: 0 },
    { name: 'Qua', reservas: 0 },
    { name: 'Qui', reservas: 0 },
    { name: 'Sex', reservas: 0 },
    { name: 'Sáb', reservas: 0 }
  ];

  periodReservations.forEach(r => {
    if (r.date) {
      try {
        const date = new Date(r.date);
        if (!isNaN(date.getTime())) {
          const day = date.getDay();
          dayOfWeekData[day].reservas++;
        }
      } catch (error) {
        // Ignore invalid dates
      }
    }
  });

  // Status das reservas (para gráfico de pizza)
  // Removed 'Confirmadas' from statusData as per "remover fluxo de confirmação"
  const statusData = [
    { name: 'Concluídas', value: completedReservations, color: '#10B981' },
    // { name: 'Confirmadas', value: confirmedReservations - completedReservations, color: '#3B82F6' }, // Removed
    { name: 'Canceladas', value: cancelledReservations, color: '#EF4444' },
    { name: 'No-Show', value: noShowReservations, color: '#F59E0B' }
  ].filter(item => item.value > 0); // Filter out entries with 0 value

  // Top clientes (mais reservas)
  const customerReservationCount = {};
  periodReservations.forEach(r => {
    customerReservationCount[r.customer_id] = (customerReservationCount[r.customer_id] || 0) + 1;
  });

  const topCustomers = Object.entries(customerReservationCount)
    .map(([customerId, count]) => {
      const customer = customers.find(c => c.id === customerId);
      return {
        customer,
        count,
        revenue: periodReservations
          .filter(r => r.customer_id === customerId && r.ticket_amount)
          .reduce((sum, r) => sum + r.ticket_amount, 0)
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Clientes com mais no-shows
  const customersWithNoShows = customers
    .filter(c => c.no_show_count > 0)
    .sort((a, b) => b.no_show_count - a.no_show_count)
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-4 md:p-8">
        <Card className="p-12 text-center">
          <p className="text-gray-500">Configure seu restaurante primeiro</p>
        </Card>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Insights e Análises</h1>
          <p className="text-sm md:text-base text-gray-500 mb-4">KPIs e métricas do seu restaurante</p>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setPeriod('daily')}
                variant={period === 'daily' ? 'default' : 'outline'}
                className={period === 'daily' ? 'bg-gradient-to-r from-[#C47B3C] to-[#A56A38]' : ''}
              >
                Diário
              </Button>
              <Button
                onClick={() => setPeriod('month')}
                variant={period === 'month' ? 'default' : 'outline'}
                className={period === 'month' ? 'bg-gradient-to-r from-[#C47B3C] to-[#A56A38]' : ''}
              >
                Este Mês
              </Button>
              <Button
                onClick={() => setPeriod('last_month')}
                variant={period === 'last_month' ? 'default' : 'outline'}
                className={period === 'last_month' ? 'bg-gradient-to-r from-[#C47B3C] to-[#A56A38]' : ''}
              >
                Mês Passado
              </Button>
              <Button
                onClick={() => setPeriod('quarter')}
                variant={period === 'quarter' ? 'default' : 'outline'}
                className={period === 'quarter' ? 'bg-gradient-to-r from-[#C47B3C] to-[#A56A38]' : ''}
              >
                Últimos 3 Meses
              </Button>
            </div>
            
            {period === 'daily' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="daily-date" className="text-sm whitespace-nowrap">Selecionar data:</Label>
                <Input
                  id="daily-date"
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards - "Lead Time Médio" card removed */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-[#A56A38]" />
                <Badge variant="outline" className="bg-amber-50 text-[#A56A38]">
                  +{totalReservations}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{totalReservations}</p>
              <p className="text-xs text-gray-500">Total de Reservas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Badge>
              </div>
              <p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-500">Receita Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-[#A56A38]" />
                <Badge variant="outline" className="bg-amber-50 text-[#A56A38]">
                  Médio
                </Badge>
              </div>
              <p className="text-2xl font-bold">R$ {avgTicket.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Ticket Médio</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  {noShowRate}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{noShowReservations}</p>
              <p className="text-xs text-gray-500">No-Shows</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {completionRate}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{completedReservations}</p>
              <p className="text-xs text-gray-500">Concluídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {cancellationRate}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{cancelledReservations}</p>
              <p className="text-xs text-gray-500">Cancelamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-[#A56A38]" />
                <Badge variant="outline" className="bg-amber-50 text-[#A56A38]">
                  Ativo
                </Badge>
              </div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-gray-500">Total de Clientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 text-yellow-500" />
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  VIP
                </Badge>
              </div>
              <p className="text-2xl font-bold">{customers.filter(c => c.tags?.includes('VIP')).length}</p>
              <p className="text-xs text-gray-500">Clientes VIP</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts - Tabs order changed and default value updated */}
        <Tabs defaultValue="status" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="status">Status</TabsTrigger> {/* Moved to first position */}
            <TabsTrigger value="occupancy">Ocupação</TabsTrigger>
            <TabsTrigger value="dayofweek">Dia da Semana</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="demographics">Demografia</TabsTrigger>
          </TabsList>

          {/* TabContent for Status - Corresponding to new order */}
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
                <CardDescription>Proporção de reservas por status</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TabContent for Occupancy */}
          <TabsContent value="occupancy">
            <Card>
              <CardHeader>
                <CardTitle>Ocupação por Turno</CardTitle>
                <CardDescription>Percentual de ocupação em relação à capacidade total</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={occupancyByShift}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ocupacao" fill="#A56A38" name="Ocupação (%)" />
                    <Bar dataKey="reservas" fill="#C47B3C" name="Reservas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TabContent for Day of Week */}
          <TabsContent value="dayofweek">
            <Card>
              <CardHeader>
                <CardTitle>Reservas por Dia da Semana</CardTitle>
                <CardDescription>Distribuição de reservas ao longo da semana</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="reservas" fill="#A56A38" name="Reservas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TabContent for Customers */}
          <TabsContent value="customers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Clientes</CardTitle>
                  <CardDescription>Clientes com mais reservas no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCustomers.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#C47B3C] to-[#A56A38] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.customer?.full_name}</p>
                            <p className="text-xs text-gray-500">{item.count} reservas</p>
                          </div>
                        </div>
                        {item.revenue > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alerta: No-Shows Frequentes</CardTitle>
                  <CardDescription>Clientes com histórico de não comparecimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customersWithNoShows.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Nenhum cliente com no-show registrado
                      </p>
                    ) : (
                      customersWithNoShows.map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div>
                            <p className="font-semibold text-sm">{customer.full_name}</p>
                            <p className="text-xs text-gray-500">{customer.phone_whatsapp}</p>
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-700">
                            {customer.no_show_count} no-shows
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TabContent for Demographics */}
          <TabsContent value="demographics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Faixa Etária</CardTitle>
                  <CardDescription>Idade dos clientes que reservaram no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#A56A38" name="Clientes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Gênero</CardTitle>
                  <CardDescription>Gênero dos clientes que reservaram no período</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'Masculino' ? '#3B82F6' :
                              entry.name === 'Feminino' ? '#EC4899' :
                              entry.name === 'Outro' ? '#9CA3AF' :
                              '#A56A38'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </SubscriptionGuard>
  );
}