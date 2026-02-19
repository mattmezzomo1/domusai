import React, { useState } from "react";
import { restaurantService, customerService, tableService, shiftService, reservationService, environmentService } from "@/services/api.service";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, ArrowLeft, AlertCircle } from "lucide-react";

import BookingStep1 from "../components/public/BookingStep1";
import BookingStep2 from "../components/public/BookingStep2";
import BookingStep3 from "../components/public/BookingStep3";
import BookingConfirmation from "../components/public/BookingConfirmation";
import ManageReservation from "../components/public/ManageReservation";

export default function PublicBooking() {
  const [currentView, setCurrentView] = useState("home");
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: "",
    party_size: "",
    shift_id: "",
    slot_time: "",
    environment_id: "",
    full_name: "",
    phone_whatsapp: "",
    email: "",
    notes: "",
    birth_date: "",
    customer_id: "", // Added customer_id
    skipPersonalData: false // Added skipPersonalData flag
  });
  const [reservationCode, setReservationCode] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug') || 'demo';

  const { data: restaurant, isLoading: loadingRestaurant, error: restaurantError } = useQuery({
    queryKey: ['public-restaurant', slug],
    queryFn: async () => {
      try {
        // Buscar restaurante pelo slug usando endpoint público
        const result = await restaurantService.getBySlug(slug);
        console.log('✅ Restaurante encontrado:', result);

        if (!result) {
          console.log('❌ Nenhum restaurante encontrado com slug:', slug);
          return null;
        }

        // Verificar se é público
        if (!result.public) {
          console.log('❌ Restaurante não é público:', result);
          return null;
        }

        console.log('✅ Restaurante público encontrado:', result);
        return result;
      } catch (error) {
        console.error('❌ Erro ao buscar restaurante:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const { data: shifts } = useQuery({
    queryKey: ['public-shifts', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await shiftService.filter({
        restaurant_id: restaurant.id,
        is_active: true
      });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const { data: environments } = useQuery({
    queryKey: ['public-environments', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await environmentService.filter({
        restaurant_id: restaurant.id,
        is_active: true
      });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const handleHomeSelection = (view) => {
    setCurrentView(view);
    setError(null);
    if (view === 'new') {
      setStep(1);
      setBookingData({
        date: "",
        party_size: "",
        shift_id: "",
        slot_time: "",
        environment_id: "",
        full_name: "",
        phone_whatsapp: "",
        email: "",
        notes: "",
        birth_date: "",
        customer_id: "", // Reset customer_id
        skipPersonalData: false // Reset skipPersonalData when starting a new booking
      });
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    } else {
      setCurrentView("home");
    }
  };

  const handleStep1Complete = (data) => {
    console.log("Step 1 Complete - Data:", data);
    setBookingData({ ...bookingData, ...data });
    
    // Sempre ir para step 2 (seleção de horário)
    setStep(2);
    setError(null);
  };

  const handleStep2Complete = (data) => {
    console.log("Step 2 Complete - Data:", data);
    
    const updatedData = { ...bookingData, ...data };
    setBookingData(updatedData);
    setStep(3);
    setError(null);
  };

  const handleStep3Complete = async (data) => {
    // Prevenir múltiplas submissões
    if (isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    const finalData = { ...bookingData, ...data };
    
    console.log("Step 3 Complete - Final Data:", finalData);
    
    try {
      let customer = [];
      
      // Se já tem customer_id (cliente existente confirmado), usar ele
      if (finalData.customer_id) {
        // customerService.filter returns an array, so we expect [customer]
        const fetchedCustomer = await customerService.filter({
          restaurant_id: restaurant.id,
          id: finalData.customer_id
        });
        customer = fetchedCustomer; // This will be [customer_object] or []

        console.log("Using existing customer:", customer[0]);
      } else {
        // Criar ou buscar novo cliente
        customer = await customerService.filter({
          restaurant_id: restaurant.id,
          phone_whatsapp: finalData.phone_whatsapp
        });

        if (customer.length === 0) {
          console.log("Creating new customer");
          customer = [await customerService.create({
            restaurant_id: restaurant.id,
            owner_email: restaurant.owner_email,
            full_name: finalData.full_name,
            phone_whatsapp: finalData.phone_whatsapp,
            email: finalData.email || null,
            birth_date: finalData.birth_date ? new Date(finalData.birth_date).toISOString() : null
          })];
        } else if (finalData.birth_date && !customer[0].birth_date) {
          console.log("Updating customer birth date");
          await customerService.update(customer[0].id, {
            birth_date: new Date(finalData.birth_date).toISOString()
          });
        }
      }

      if (customer.length === 0 || !customer[0]) {
        throw new Error("Cliente não encontrado ou inválido");
      }

      console.log("Customer ready:", customer[0]);

      // Buscar mesas - filtrar por ambiente se selecionado
      const tableFilters = {
        restaurant_id: restaurant.id,
        is_active: true,
        status: "available"
      };

      // Se um ambiente foi selecionado, filtrar apenas mesas desse ambiente
      if (finalData.environment_id) {
        tableFilters.environment_id = finalData.environment_id;
      }

      const tables = await tableService.filter(tableFilters);

      const allShifts = await shiftService.filter({
        restaurant_id: restaurant.id
      });
      const selectedShift = allShifts.find(s => s.id === finalData.shift_id);

      if (!selectedShift) {
        throw new Error("Turno selecionado não encontrado");
      }

      // Buscar reservas ativas (confirmed e pending) para verificar disponibilidade
      const allReservations = await reservationService.filter({
        restaurant_id: restaurant.id,
        date: finalData.date,
        shift_id: finalData.shift_id
      });
      
      const existingReservations = allReservations.filter(r => 
        r.status === "confirmed" || r.status === "pending"
      );
      
      console.log('📊 Reservas ativas no dia/turno:', existingReservations.length);

      const slotMinutes = parseInt(finalData.slot_time.split(':')[0]) * 60 + parseInt(finalData.slot_time.split(':')[1]);
      const dwellMinutes = selectedShift.default_dwell_minutes;
      const bufferMinutes = selectedShift.default_buffer_minutes;

      const newResBlockStart = slotMinutes - bufferMinutes;
      const newResBlockEnd = slotMinutes + dwellMinutes + bufferMinutes;
      
      // First, identify all tables that are *occupied* during the new reservation's time slot
      const occupiedTableIds = new Set();
      existingReservations.forEach(res => {
        const resMinutes = parseInt(res.slot_time.split(':')[0]) * 60 + parseInt(res.slot_time.split(':')[1]);
        const existingResBlockStart = resMinutes - bufferMinutes;
        const existingResBlockEnd = resMinutes + dwellMinutes + bufferMinutes;

        // Check for time conflict
        if (newResBlockStart < existingResBlockEnd && newResBlockEnd > existingResBlockStart) {
          const tableIdsInReservation = res.linked_tables && res.linked_tables.length > 0 
            ? res.linked_tables 
            : [res.table_id];
          tableIdsInReservation.forEach(tableId => occupiedTableIds.add(tableId));
        }
      });
      
      // Filter tables that are not occupied and sort by capacity (ascending)
      const trulyAvailableTables = tables
        .filter(table => !occupiedTableIds.has(table.id))
        .sort((a, b) => a.seats - b.seats);

      // Algorithm to select multiple tables
      const partySize = parseInt(finalData.party_size);
      let seatsNeeded = partySize;
      const selectedTables = [];
      let totalSelectedSeats = 0;

      for (const table of trulyAvailableTables) {
        if (seatsNeeded <= 0) break; // Already found enough seats

        selectedTables.push(table);
        totalSelectedSeats += table.seats;
        seatsNeeded -= table.seats;
      }

      if (seatsNeeded > 0) {
        throw new Error(`Não há mesas disponíveis suficientes para ${partySize} pessoas neste horário. Por favor, escolha outro horário ou entre em contato.`);
      }

      const code = `${restaurant.slug.toUpperCase()}-${finalData.date.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Criar reserva com status "pending" (Reservada)
      const mainTable = selectedTables[0];
      const tableIds = selectedTables.map(t => t.id);

      await reservationService.create({
        restaurant_id: restaurant.id,
        owner_email: restaurant.owner_email,
        customer_id: customer[0].id,
        reservation_code: code,
        date: new Date(finalData.date).toISOString(), // Converter para ISO-8601
        shift_id: finalData.shift_id,
        slot_time: finalData.slot_time,
        party_size: parseInt(finalData.party_size),
        table_id: mainTable.id,
        linked_tables: tableIds,
        environment_id: finalData.environment_id || mainTable.environment_id || null,
        status: "PENDING", // Status em UPPERCASE
        notes: finalData.notes || `Mesas alocadas: ${selectedTables.map(t => t.name).join(', ')}`,
        source: "online"
      });

      console.log("Reservation created successfully");

      setReservationCode(code);
      setCurrentView("confirmation");
      setIsSubmitting(false);
    } catch (err) {
      console.error("Erro ao criar reserva:", err);
      setError(err.message || "Erro ao criar reserva. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#C47B3C] border-t-transparent rounded-full mx-auto mb-6"></div>
          <p className="text-[#AAAAAA] text-lg font-light tracking-wide">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 md:p-12 text-center bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
          <AlertCircle className="w-16 h-16 mx-auto text-[#C47B3C] mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Restaurante não encontrado</h2>
          <p className="text-[#AAAAAA] text-sm md:text-base">Verifique o link e tente novamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C47B3C] rounded-full filter blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A56A38] rounded-full filter blur-[120px]"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 tracking-tight">
            {restaurant.name}
          </h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C47B3C]"></div>
            <p className="text-[#C47B3C] text-sm md:text-base font-medium uppercase tracking-[0.2em]">
              Reservas Online
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C47B3C]"></div>
          </div>
          {restaurant.address && (
            <p className="text-[#888888] text-sm mt-4">{restaurant.address}</p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border-2 border-[#C47B3C] rounded-2xl shadow-2xl mb-8 p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#C47B3C] shrink-0 mt-0.5" />
              <p className="text-white text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Home View - 3 Cards */}
        {currentView === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              className="bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#C47B3C]/30 hover:shadow-[#C47B3C]/20 cursor-pointer"
              onClick={() => handleHomeSelection('new')}
            >
              <div className="flex flex-col items-center text-center h-full justify-between py-8 px-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C47B3C]/20 to-[#A56A38]/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:from-[#C47B3C]/30 group-hover:to-[#A56A38]/20 group-hover:scale-105">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
                    Fazer Reserva
                  </h3>
                  <p className="text-[#AAAAAA] text-sm leading-relaxed">
                    Reserve sua mesa em poucos passos simples
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 w-full">
                  <span className="text-[#C47B3C] text-xs uppercase tracking-wider font-semibold">
                    Começar →
                  </span>
                </div>
              </div>
            </div>

            <div
              className="bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#C47B3C]/30 hover:shadow-[#C47B3C]/20 cursor-pointer"
              onClick={() => handleHomeSelection('modify')}
            >
              <div className="flex flex-col items-center text-center h-full justify-between py-8 px-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C47B3C]/20 to-[#A56A38]/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:from-[#C47B3C]/30 group-hover:to-[#A56A38]/20 group-hover:scale-105">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
                    Alterar Reserva
                  </h3>
                  <p className="text-[#AAAAAA] text-sm leading-relaxed">
                    Modifique data ou horário da sua reserva
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 w-full">
                  <span className="text-[#C47B3C] text-xs uppercase tracking-wider font-semibold">
                    Alterar →
                  </span>
                </div>
              </div>
            </div>

            <div
              className="bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#C47B3C]/30 hover:shadow-[#C47B3C]/20 cursor-pointer"
              onClick={() => handleHomeSelection('cancel')}
            >
              <div className="flex flex-col items-center text-center h-full justify-between py-8 px-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C47B3C]/20 to-[#A56A38]/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:from-[#C47B3C]/30 group-hover:to-[#A56A38]/20 group-hover:scale-105">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
                    Cancelar Reserva
                  </h3>
                  <p className="text-[#AAAAAA] text-sm leading-relaxed">
                    Cancele sua reserva quando necessário
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 w-full">
                  <span className="text-[#C47B3C] text-xs uppercase tracking-wider font-semibold">
                    Cancelar →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Booking Flow */}
        {currentView === "new" && (
          <div className="max-w-3xl mx-auto bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl animate-in fade-in duration-500">
            <div className="p-6 md:p-8 border-b border-white/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <button
                  onClick={handleBack}
                  className="premium-button-outline self-start"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </button>
                
                <div className="flex items-center gap-3">
                  <span className="text-[#888888] text-sm font-light">ETAPA</span>
                  {bookingData.skipPersonalData ? (
                    <>
                      {[1, 2].map(num => (
                        <div key={num} className="flex items-center gap-3">
                          <div className={`step-indicator ${step >= num ? 'active' : ''}`}>
                            {num < 10 ? `0${num}` : num}
                          </div>
                          {num < 2 && (
                            <div className={`step-divider ${step > num ? 'active' : ''}`}></div>
                          )}
                        </div>
                      ))}
                      <span className="text-[#888888] text-sm font-light">/ 02</span>
                    </>
                  ) : (
                    <>
                      {[1, 2, 3].map(num => (
                        <div key={num} className="flex items-center gap-3">
                          <div className={`step-indicator ${step >= num ? 'active' : ''}`}>
                            {num < 10 ? `0${num}` : num}
                          </div>
                          {num < 3 && (
                            <div className={`step-divider ${step > num ? 'active' : ''}`}></div>
                          )}
                        </div>
                      ))}
                      <span className="text-[#888888] text-sm font-light">/ 03</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              {step === 1 && (
                <BookingStep1
                  onComplete={handleStep1Complete}
                  formData={bookingData}
                  setFormData={setBookingData}
                  restaurant={restaurant}
                  shifts={shifts}
                  environments={environments}
                />
              )}
              {step === 2 && (
                <BookingStep2
                  restaurant={restaurant}
                  shifts={shifts}
                  initialData={bookingData}
                  onComplete={handleStep2Complete}
                  onBack={handleBack}
                />
              )}
              {step === 3 && !bookingData.skipPersonalData && (
                <BookingStep3
                  bookingData={bookingData}
                  restaurant={restaurant}
                  onComplete={handleStep3Complete}
                  onBack={handleBack}
                />
              )}
            </div>
          </div>
        )}

        {/* Confirmation */}
        {currentView === "confirmation" && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <BookingConfirmation 
              reservationCode={reservationCode}
              restaurant={restaurant}
              bookingData={bookingData}
              onBackToHome={() => setCurrentView("home")}
            />
          </div>
        )}

        {/* Manage Reservation */}
        {(currentView === "modify" || currentView === "cancel") && (
          <div className="animate-in fade-in duration-300">
            <ManageReservation
              restaurant={restaurant}
              action={currentView}
              onBack={() => setCurrentView("home")}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(20, 20, 20, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.4);
        }

        .premium-card {
          background: rgba(20, 20, 20, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-card:hover {
          transform: translateY(-4px);
          border-color: rgba(196, 123, 60, 0.3);
          box-shadow: 0px 8px 24px rgba(196, 123, 60, 0.15);
        }

        .premium-icon-wrapper {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(196, 123, 60, 0.2), rgba(165, 106, 56, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .premium-card:hover .premium-icon-wrapper {
          background: linear-gradient(135deg, rgba(196, 123, 60, 0.3), rgba(165, 106, 56, 0.2));
          transform: scale(1.05);
        }

        .premium-button-outline {
          background: transparent;
          border: 1px solid rgba(196, 123, 60, 0.5);
          color: #C47B3C;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          transition: all 0.2s ease-in-out;
        }

        .premium-button-outline:hover {
          background: rgba(196, 123, 60, 0.1);
          border-color: #C47B3C;
          transform: translateY(-2px);
        }

        .step-indicator {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
          color: #888888;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .step-indicator.active {
          background: linear-gradient(135deg, #C47B3C, #A56A38);
          color: white;
          border-color: #C47B3C;
          box-shadow: 0 0 20px rgba(196, 123, 60, 0.4);
        }

        .step-divider {
          width: 24px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .step-divider.active {
          background: #C47B3C;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.5s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}