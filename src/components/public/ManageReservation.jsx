import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, AlertCircle, Calendar, Clock, Users, Phone } from "lucide-react";
import EditReservationPublic from "./EditReservationPublic";

export default function ManageReservation({ restaurant, action, onBack }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [showReservations, setShowReservations] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowReservations(false);

    try {
      // Remover formatação do telefone (manter apenas números)
      const cleanPhone = phone.replace(/\D/g, '');

      console.log('🔍 Buscando reservas para telefone:', cleanPhone);
      console.log('Restaurant ID:', restaurant.id);

      // Buscar reservas por telefone
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const url = `${apiUrl}/reservations/phone/${encodeURIComponent(cleanPhone)}?restaurant_id=${restaurant.id}`;

      console.log('📡 URL da requisição:', url);

      const response = await fetch(url);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.error || "Erro ao buscar reservas");
      }

      const data = await response.json();
      console.log('Reservas encontradas:', data.length);

      if (data.length === 0) {
        setError("Nenhuma reserva futura encontrada para este telefone.");
        setLoading(false);
        return;
      }

      setReservations(data);
      setShowReservations(true);
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao buscar reservas. Verifique o telefone e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (!confirm(`Tem certeza que deseja cancelar a reserva ${reservation.reservation_code}?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Usar endpoint público para cancelar
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/reservations/public/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "CANCELLED"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao cancelar reserva');
      }

      setSuccess(`Reserva ${reservation.reservation_code} cancelada com sucesso!`);

      // Remover a reserva cancelada da lista
      setReservations(prev => prev.filter(r => r.id !== reservation.id));

      if (reservations.length === 1) {
        setShowReservations(false);
      }
    } catch (err) {
      console.error("Erro:", err);
      setError(err.message || "Erro ao cancelar reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                    .replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers;
  };

  // Se está editando uma reserva, mostrar o componente de edição
  if (editingReservation) {
    return (
      <EditReservationPublic
        reservation={editingReservation}
        restaurant={restaurant}
        onBack={() => setEditingReservation(null)}
        onSuccess={() => {
          setEditingReservation(null);
          setShowReservations(false);
          setReservations([]);
          setPhone("");
          setSuccess("Reserva alterada com sucesso!");
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 md:p-12">
      <button
        onClick={onBack}
        className="text-[#C47B3C] hover:text-[#D48B4C] mb-6 flex items-center gap-2"
      >
        ← Voltar
      </button>

      <h2 className="text-3xl font-bold text-white mb-2">
        {action === "cancel" ? "Cancelar Reserva" : "Gerenciar Reservas"}
      </h2>
      <p className="text-[#AAAAAA] mb-8">
        Insira seu telefone para ver suas reservas
      </p>

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
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}

      {!showReservations ? (
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white font-semibold">
              <Phone className="w-4 h-4 text-[#C47B3C]" />
              Telefone (WhatsApp)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
              placeholder="(11) 99999-9999"
              className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#C47B3C] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#C47B3C] to-[#A56A38] text-white font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#D48B4C] hover:to-[#B57A48] transition-all"
          >
            {loading ? "Buscando..." : "Buscar Minhas Reservas"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              Suas Reservas Futuras ({reservations.length})
            </h3>
            <button
              onClick={() => {
                setShowReservations(false);
                setReservations([]);
                setPhone("");
              }}
              className="text-[#C47B3C] hover:text-[#D48B4C] text-sm"
            >
              Nova Busca
            </button>
          </div>

          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-lg p-6 hover:border-[#C47B3C]/30 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C47B3C] font-mono font-semibold text-lg">
                      {reservation.reservation_code}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      reservation.status === 'CONFIRMED'
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-yellow-900/30 text-yellow-300'
                    }`}>
                      {reservation.status === 'CONFIRMED' ? 'Confirmada' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[#AAAAAA]">
                      <Calendar className="w-4 h-4 text-[#C47B3C]" />
                      <span>{formatDate(reservation.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#AAAAAA]">
                      <Clock className="w-4 h-4 text-[#C47B3C]" />
                      <span>{reservation.slot_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#AAAAAA]">
                      <Users className="w-4 h-4 text-[#C47B3C]" />
                      <span>{reservation.party_size} {reservation.party_size === 1 ? 'pessoa' : 'pessoas'}</span>
                    </div>
                  </div>

                  {reservation.customer && (
                    <div className="text-sm text-[#AAAAAA]">
                      <span className="font-semibold text-white">{reservation.customer.full_name}</span>
                    </div>
                  )}

                  {reservation.notes && (
                    <div className="text-sm text-[#AAAAAA] italic">
                      Obs: {reservation.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {action === "cancel" && (
                    <button
                      onClick={() => handleCancelReservation(reservation)}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600/20 border border-red-600/30 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  )}
                  {action === "modify" && (
                    <button
                      onClick={() => setEditingReservation(reservation)}
                      className="px-6 py-2 bg-[#C47B3C]/20 border border-[#C47B3C]/30 text-[#C47B3C] rounded-lg hover:bg-[#C47B3C]/30 transition-colors"
                    >
                      Alterar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}