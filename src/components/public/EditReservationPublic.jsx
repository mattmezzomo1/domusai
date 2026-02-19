import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { shiftService, tableService, reservationService } from "@/services/api.service";
import { Calendar, Clock, Users, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

export default function EditReservationPublic({ reservation, restaurant, onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    date: "",
    shift_id: "",
    slot_time: "",
    party_size: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Buscar turnos do restaurante
  const { data: shifts = [] } = useQuery({
    queryKey: ['public-shifts', restaurant.id],
    queryFn: async () => {
      const result = await shiftService.filter({
        restaurant_id: restaurant.id,
        active: true
      });
      return result;
    },
    enabled: !!restaurant,
  });

  // Inicializar form com dados da reserva
  useEffect(() => {
    if (reservation) {
      const dateObj = new Date(reservation.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      setFormData({
        date: formattedDate,
        shift_id: reservation.shift_id,
        slot_time: reservation.slot_time,
        party_size: reservation.party_size.toString(),
      });
    }
  }, [reservation]);

  // Gerar slots disponíveis quando shift é selecionado
  useEffect(() => {
    if (formData.shift_id && shifts.length > 0) {
      const selectedShift = shifts.find(s => s.id === formData.shift_id);
      if (selectedShift) {
        const slots = generateTimeSlots(selectedShift.start_time, selectedShift.end_time);
        setAvailableSlots(slots);
      }
    }
  }, [formData.shift_id, shifts]);

  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar disponibilidade
      const tables = await tableService.filter({
        restaurant_id: restaurant.id,
        is_active: true,
        status: "available"
      });

      const allReservations = await reservationService.filter({
        restaurant_id: restaurant.id,
        date: formData.date,
        shift_id: formData.shift_id
      });

      const existingReservations = allReservations.filter(r => 
        r.id !== reservation.id && // Excluir a reserva atual
        (r.status === "confirmed" || r.status === "pending") &&
        r.slot_time === formData.slot_time
      );

      const occupiedTableIds = new Set();
      existingReservations.forEach(r => {
        if (Array.isArray(r.linked_tables)) {
          r.linked_tables.forEach(tableId => occupiedTableIds.add(tableId));
        }
      });

      const availableTables = tables
        .filter(t => !occupiedTableIds.has(t.id))
        .sort((a, b) => a.seats - b.seats);

      const partySize = parseInt(formData.party_size);
      let seatsNeeded = partySize;
      const selectedTables = [];
      let totalSelectedSeats = 0;

      for (const table of availableTables) {
        if (seatsNeeded <= 0) break;
        selectedTables.push(table);
        totalSelectedSeats += table.seats;
        seatsNeeded -= table.seats;
      }

      if (seatsNeeded > 0) {
        throw new Error(`Não há mesas disponíveis para ${partySize} pessoas neste horário. Por favor, escolha outro horário.`);
      }

      // Atualizar reserva usando endpoint público
      const mainTable = selectedTables[0];
      const tableIds = selectedTables.map(t => t.id);

      const updatePayload = {
        date: new Date(formData.date).toISOString(),
        shift_id: formData.shift_id,
        slot_time: formData.slot_time,
        party_size: partySize,
        table_id: mainTable.id,
        linked_tables: tableIds,
        status: "PENDING", // Atualizar status para PENDING quando cliente edita
      };

      console.log('📝 Atualizando reserva pública:', {
        reservationId: reservation.id,
        oldStatus: reservation.status,
        newStatus: updatePayload.status,
        payload: updatePayload
      });

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/reservations/public/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao atualizar reserva');
      }

      const updatedReservation = await response.json();
      console.log('✅ Reserva atualizada com sucesso:', updatedReservation);

      setSuccess("Reserva alterada com sucesso!");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);

    } catch (err) {
      console.error("Erro:", err);
      setError(err.message || "Erro ao alterar reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 md:p-12">
      {/* Header */}
      <button
        onClick={onBack}
        className="text-[#C47B3C] hover:text-[#D48B4C] mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <h2 className="text-3xl font-bold text-white mb-2">
        Alterar Reserva
      </h2>
      <p className="text-[#AAAAAA] mb-2">
        Código: <span className="text-[#C47B3C] font-mono font-semibold">{reservation.reservation_code}</span>
      </p>
      <p className="text-[#AAAAAA] mb-8">
        Modifique os dados da sua reserva
      </p>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-white font-semibold">
            <Calendar className="w-4 h-4 text-[#C47B3C]" />
            Data
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            required
            className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C47B3C] transition-colors"
          />
        </div>

        {/* Turno */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-white font-semibold">
            <Clock className="w-4 h-4 text-[#C47B3C]" />
            Turno
          </label>
          <select
            value={formData.shift_id}
            onChange={(e) => setFormData({ ...formData, shift_id: e.target.value, slot_time: "" })}
            required
            className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C47B3C] transition-colors"
          >
            <option value="">Selecione um turno</option>
            {shifts.map(shift => (
              <option key={shift.id} value={shift.id}>
                {shift.name} ({shift.start_time} - {shift.end_time})
              </option>
            ))}
          </select>
        </div>

        {/* Horário */}
        {formData.shift_id && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-semibold">
              <Clock className="w-4 h-4 text-[#C47B3C]" />
              Horário
            </label>
            <select
              value={formData.slot_time}
              onChange={(e) => setFormData({ ...formData, slot_time: e.target.value })}
              required
              className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C47B3C] transition-colors"
            >
              <option value="">Selecione um horário</option>
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Número de Pessoas */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-white font-semibold">
            <Users className="w-4 h-4 text-[#C47B3C]" />
            Número de Pessoas
          </label>
          <input
            type="number"
            value={formData.party_size}
            onChange={(e) => setFormData({ ...formData, party_size: e.target.value })}
            min="1"
            max="20"
            required
            className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C47B3C] transition-colors"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-white/10 text-white font-semibold py-4 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-[#C47B3C] to-[#A56A38] text-white font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#D48B4C] hover:to-[#B57A48] transition-all"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

