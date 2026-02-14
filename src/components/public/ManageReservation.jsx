import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, AlertCircle } from "lucide-react";

export default function ManageReservation({ restaurant, action, onBack }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reservations = await base44.entities.Reservation.filter({
        restaurant_id: restaurant.id,
        reservation_code: code.toUpperCase()
      });

      if (reservations.length === 0) {
        setError("Reserva não encontrada. Verifique o código e tente novamente.");
        setLoading(false);
        return;
      }

      const reservation = reservations[0];

      if (action === "cancel") {
        await base44.entities.Reservation.update(reservation.id, {
          status: "cancelled",
          cancelled_at: new Date().toISOString()
        });
        setSuccess("Reserva cancelada com sucesso!");
      } else if (action === "modify") {
        setError("Função de alteração em desenvolvimento. Entre em contato diretamente com o restaurante.");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao processar sua solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 md:p-12">
      <button
        onClick={onBack}
        className="text-[#C47B3C] hover:text-[#D48B4C] mb-6 flex items-center gap-2"
      >
        ← Voltar
      </button>

      <h2 className="text-3xl font-bold text-white mb-2">
        {action === "cancel" ? "Cancelar Reserva" : "Alterar Reserva"}
      </h2>
      <p className="text-[#AAAAAA] mb-8">
        Insira o código da sua reserva
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-white font-semibold">
            <Search className="w-4 h-4 text-[#C47B3C]" />
            Código da Reserva
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            placeholder="Ex: SAZA-20260211-ABCD"
            className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#C47B3C] transition-colors uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#C47B3C] to-[#A56A38] text-white font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#D48B4C] hover:to-[#B57A48] transition-all"
        >
          {loading ? "Processando..." : action === "cancel" ? "Cancelar Reserva" : "Buscar Reserva"}
        </button>
      </form>
    </div>
  );
}