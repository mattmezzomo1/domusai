import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BookingStep2({ restaurant, shifts, initialData, onComplete, onBack }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(initialData.slot_time || "");
  const [isLoading, setIsLoading] = useState(true);

  const selectedShift = shifts.find(s => s.id === initialData.shift_id);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedShift) return;

      setIsLoading(true);
      try {
        const startTime = selectedShift.start_time.split(':');
        const endTime = selectedShift.end_time.split(':');
        const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
        const interval = selectedShift.slot_interval_minutes || 15;

        const slots = [];
        for (let minutes = startMinutes; minutes <= endMinutes - interval; minutes += interval) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          slots.push(timeStr);
        }

        setAvailableSlots(slots);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedShift, initialData.date, initialData.shift_id, restaurant.id]);

  const handleContinue = () => {
    if (!selectedSlot) {
      alert("Por favor, selecione um horário");
      return;
    }

    onComplete({ slot_time: selectedSlot });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Selecione o Horário
        </h2>
        <p className="text-[#AAAAAA] text-sm">
          Escolha o melhor horário para sua reserva
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-[#C47B3C] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#AAAAAA]">Carregando horários disponíveis...</p>
        </div>
      ) : availableSlots.length > 0 ? (
        <div className="space-y-3">
          <label className="text-white text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C47B3C]" />
            Horários Disponíveis
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-4 rounded-lg border transition-all font-semibold ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#C47B3C] to-[#A56A38] border-[#C47B3C] text-white shadow-lg'
                      : 'bg-[rgba(255,255,255,0.05)] border-white/10 text-[#AAAAAA] hover:border-[#C47B3C]/50'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-[rgba(255,255,255,0.05)] rounded-lg border border-white/10">
          <p className="text-[#AAAAAA]">Nenhum horário disponível para esta data</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="premium-button-outline flex-1"
        >
          Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="premium-button flex-1"
        >
          Continuar
        </button>
      </div>

      <style jsx>{`
        .premium-button {
          background: linear-gradient(135deg, #C47B3C, #A56A38);
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(196, 123, 60, 0.3);
        }

        .premium-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(196, 123, 60, 0.4);
        }

        .premium-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .premium-button-outline {
          background: transparent;
          border: 1px solid rgba(196, 123, 60, 0.5);
          color: #C47B3C;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .premium-button-outline:hover {
          background: rgba(196, 123, 60, 0.1);
          border-color: #C47B3C;
        }
      `}</style>
    </div>
  );
}