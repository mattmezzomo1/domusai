import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { restaurantService, reservationService } from "@/services/api.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

import DashboardStats from "../components/dashboard/DashboardStats";
import ReservationsList from "../components/dashboard/ReservationsList";
import AddReservationDialog from "../components/reservations/AddReservationDialog";
import TableMapView from "../components/reservations/TableMapView";
import { base44 } from "@/api/base44Client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // "list" or "map"

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
    confirmed: reservations.filter(r => {
      const status = r.status?.toUpperCase();
      return status === 'CONFIRMED' || status === 'PENDING';
    }).length,
    cancelled: reservations.filter(r => r.status?.toUpperCase() === 'CANCELLED').length,
    seatsReserved: reservations
      .filter(r => {
        const status = r.status?.toUpperCase();
        return status === 'CONFIRMED' || status === 'PENDING';
      })
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
          <Button onClick={() => navigate(createPageUrl("Settings"))}>Configurar Restaurante</Button>
        </Card>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="p-4 md:p-6 pb-24 md:pb-6 w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Visão Diária
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Panorama de reservas do dia</p>
            </div>

            <div className="flex gap-3">
              <AddReservationDialog
                trigger={
                  <Button className="bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Reserva
                  </Button>
                }
              />
              <Button
                onClick={openPublicPage}
                variant="outline"
                className="hover:bg-gray-100 border-gray-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Página Pública
              </Button>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="hover:bg-gray-100 h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="text-center flex-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Data Selecionada</p>
              <p className="text-lg md:text-xl font-bold text-gray-900">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate('next')}
              className="hover:bg-gray-100 h-10 w-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="hover:bg-gray-100"
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
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={loadingReservations} />

        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={viewMode === "list"
              ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white"
              : "border-gray-300 hover:bg-gray-50"
            }
          >
            Lista
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            onClick={() => setViewMode("map")}
            className={viewMode === "map"
              ? "bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white"
              : "border-gray-300 hover:bg-gray-50"
            }
          >
            Mapa
          </Button>
        </div>

        {/* Content based on view mode */}
        {viewMode === "list" ? (
          <ReservationsList
            reservations={reservations}
            isLoading={loadingReservations}
            selectedDate={selectedDate}
          />
        ) : (
          <TableMapView
            selectedDate={format(selectedDate, 'yyyy-MM-dd')}
            restaurant={selectedRestaurant}
          />
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}