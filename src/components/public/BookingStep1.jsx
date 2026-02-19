import React, { useState } from "react";
import { Calendar, Users, Clock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BookingStep1({ onComplete, formData, setFormData, restaurant, shifts, environments }) {
  const [selectedDate, setSelectedDate] = useState(formData.date || "");
  const [partySize, setPartySize] = useState(formData.party_size || "");
  const [selectedShift, setSelectedShift] = useState(formData.shift_id || "");
  const [selectedEnvironment, setSelectedEnvironment] = useState(formData.environment_id || "");

  const handleContinue = () => {
    if (!selectedDate || !partySize || !selectedShift) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    // Se houver múltiplos ambientes, exigir seleção
    if (environments && environments.length > 1 && !selectedEnvironment) {
      alert("Por favor, selecione um ambiente");
      return;
    }

    const partySizeNum = parseInt(partySize);
    if (partySizeNum < 1) {
      alert("O número de pessoas deve ser pelo menos 1");
      return;
    }

    if (partySizeNum > restaurant.max_online_party_size) {
      alert(`Reservas online são limitadas a ${restaurant.max_online_party_size} pessoas. Entre em contato conosco para grupos maiores.`);
      return;
    }

    onComplete({
      date: selectedDate,
      party_size: partySize,
      shift_id: selectedShift,
      environment_id: selectedEnvironment || null
    });
  };

  // Data mínima: hoje
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Selecione os Detalhes
        </h2>
        <p className="text-[#AAAAAA] text-sm">
          Escolha data, número de pessoas e turno
        </p>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label className="text-white text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#C47B3C]" />
          Data da Reserva
        </Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
          className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white focus:border-[#C47B3C] focus:outline-none transition-all"
        />
      </div>

      {/* Party Size */}
      <div className="space-y-3">
        <Label className="text-white text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-[#C47B3C]" />
          Número de Pessoas
        </Label>
        <Input
          type="number"
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
          min="1"
          max={restaurant.max_online_party_size}
          placeholder={`Digite de 1 a ${restaurant.max_online_party_size}`}
          className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
        />
        <p className="text-xs text-[#888888]">
          Limite para reservas online: {restaurant.max_online_party_size} pessoas
        </p>
      </div>

      {/* Environment Selection - Only show if multiple environments */}
      {environments && environments.length > 1 && (
        <div className="space-y-3">
          <Label className="text-white text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#C47B3C]" />
            Preferência de Ambiente
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {environments.map((env) => {
              const isSelected = selectedEnvironment === env.id;
              return (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvironment(env.id)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#C47B3C] to-[#A56A38] border-[#C47B3C] shadow-lg'
                      : 'bg-[rgba(255,255,255,0.05)] border-white/10 hover:border-[#C47B3C]/50'
                  }`}
                >
                  <div className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-white'}`}>
                    {env.name}
                  </div>
                  {env.capacity && (
                    <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-[#AAAAAA]'}`}>
                      Capacidade: {env.capacity} pessoas
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shift Selection */}
      {shifts && shifts.length > 0 && (
        <div className="space-y-3">
          <Label className="text-white text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C47B3C]" />
            Turno
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shifts.map((shift) => {
              const isSelected = selectedShift === shift.id;
              return (
                <button
                  key={shift.id}
                  onClick={() => setSelectedShift(shift.id)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#C47B3C] to-[#A56A38] border-[#C47B3C] shadow-lg'
                      : 'bg-[rgba(255,255,255,0.05)] border-white/10 hover:border-[#C47B3C]/50'
                  }`}
                >
                  <div className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-white'}`}>
                    {shift.name}
                  </div>
                  <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-[#AAAAAA]'}`}>
                    {shift.start_time} - {shift.end_time}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!selectedDate || !partySize || !selectedShift || (environments && environments.length > 1 && !selectedEnvironment)}
        className="premium-button w-full"
      >
        Continuar
      </button>

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

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}