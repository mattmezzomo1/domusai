import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { restaurantService, reservationService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

import DashboardStats from "../components/dashboard/DashboardStats";
import ReservationsList from "../components/dashboard/ReservationsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TableMapView from "../components/reservations/TableMapView";
import TableManagementView from "../components/reservations/TableManagementView";
// Removed: OptimizeReservationsDialog from "../components/reservations/OptimizeReservationsDialog";
import AddReservationDialog from "../components/reservations/AddReservationDialog";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const { data: restaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0]);
    }
  }, [restaurants, selectedRestaurant]);

  const { data: allReservations, isLoading: loadingReservations } = useQuery({
    queryKey: ['reservations', selectedRestaurant?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      // Ensuring reservations are ordered by slot_time (descending as per original code)
      return await reservationService.filter({
        restaurant_id: selectedRestaurant.id,
        date: format(selectedDate, 'yyyy-MM-dd')
      }, '-slot_time');
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  // Filtrar reservas canceladas da visualização principal
  const reservations = allReservations.filter(r =>
    r.status !== 'cancelled' && r.status !== 'CANCELLED'
  );

  const { data: tables } = useQuery({
    queryKey: ['tables', selectedRestaurant?.id],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      return await base44.entities.Table.filter({ restaurant_id: selectedRestaurant.id });
    },
    enabled: !!selectedRestaurant,
    initialData: [],
  });

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    seatsReserved: reservations
      .filter(r => r.status === 'confirmed' || r.status === 'pending')
      .reduce((sum, r) => sum + r.party_size, 0),
    totalSeats: tables.filter(t => t.is_active && t.status?.toUpperCase() === 'AVAILABLE').reduce((sum, t) => sum + t.seats, 0)
  };

  const navigateDate = (direction) => {
    setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
  };

  const openPublicPage = () => {
    if (selectedRestaurant) {
      const publicUrl = `${window.location.origin}/PublicBooking?slug=${selectedRestaurant.slug}`;
      window.open(publicUrl, '_blank');
    }
  };

  if (loadingRestaurants) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 md:h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <Card className="p-8 md:p-12 text-center">
          <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">Nenhum restaurante cadastrado</h2>
          <p className="text-sm md:text-base text-gray-500 mb-6">Configure seu restaurante para começar a receber reservas</p>
          <Button>Configurar Restaurante</Button>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            {selectedRestaurant?.name}
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-4">Visão geral das reservas</p>
          
          {/* Adjusted mobile menu: Removed OptimizeReservationsDialog */}
          <div className="flex flex-col sm:flex-row gap-3">
            <AddReservationDialog 
              trigger={
                <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] text-white w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Reserva
                </Button>
              }
            />
            {/* Removed OptimizeReservationsDialog */}
            <Button
              onClick={openPublicPage}
              variant="outline"
              className="w-full sm:w-auto hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Página Pública
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38] shrink-0 h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-center flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-500 font-medium">Data Selecionada</p>
              <p className="text-base md:text-xl font-bold text-gray-900 truncate">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
              className="hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38] shrink-0 h-10 w-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38]"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Selecionar Data
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={loadingReservations} />

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="list" className="text-xs md:text-base py-2 md:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white">
              Lista
            </TabsTrigger>
            <TabsTrigger value="management" className="text-xs md:text-base py-2 md:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white">
              Gerenciar
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs md:text-base py-2 md:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C47B3C] data-[state=active]:to-[#A56A38] data-[state=active]:text-white">
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ReservationsList 
              reservations={reservations}
              isLoading={loadingReservations}
              selectedDate={selectedDate}
            />
          </TabsContent>

          <TabsContent value="management">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#A56A38]" />
                  Gerenciamento de Mesas - {format(selectedDate, "dd/MM/yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <TableManagementView
                  selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                  restaurant={selectedRestaurant}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#A56A38]" />
                  Mapa de Mesas - {format(selectedDate, "dd/MM/yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <TableMapView 
                  selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                  restaurant={selectedRestaurant}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </SubscriptionGuard>
  );
}