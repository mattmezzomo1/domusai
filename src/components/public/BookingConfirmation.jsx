import React, { useState } from "react";
import { CheckCircle, Phone, AlertTriangle, Calendar, Users, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BookingConfirmation({ reservationCode, restaurant, bookingData, onBackToHome }) {
  const [confirmPhone, setConfirmPhone] = useState("");
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // O número original já está limpo (sem formatação)
  const originalPhone = bookingData.phone_whatsapp;

  const handleConfirmPhone = () => {
    const cleanConfirmPhone = confirmPhone.replace(/\D/g, '');
    const cleanOriginalPhone = originalPhone.replace(/\D/g, '');
    
    console.log('Original:', cleanOriginalPhone, 'Confirmado:', cleanConfirmPhone);
    
    if (cleanConfirmPhone === cleanOriginalPhone) {
      setShowWhatsAppButton(true);
      setPhoneError("");
    } else {
      setPhoneError("O WhatsApp digitado não corresponde ao WhatsApp informado anteriormente. Verifique e tente novamente.");
      setShowWhatsAppButton(false);
    }
  };

  const handleSendWhatsApp = () => {
    const whatsappNumber = restaurant.whatsapp_confirmation || restaurant.phone?.replace(/\D/g, '') || '';
    
    if (!whatsappNumber) {
      alert("Restaurante não configurou WhatsApp para confirmação. Entre em contato diretamente.");
      return;
    }

    const formattedDate = format(new Date(bookingData.date), "dd/MM/yyyy", { locale: ptBR });
    
    const message = encodeURIComponent(
      `Confirmar minha reserva abaixo:\n\n` +
      `Código: ${reservationCode}\n` +
      `Nome: ${bookingData.full_name}\n` +
      `Data: ${formattedDate}\n` +
      `Pessoas: ${bookingData.party_size}\n` +
      `Horário: ${bookingData.slot_time}`
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 2) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
    }
    if (cleaned.length >= 7) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    }
    
    setConfirmPhone(formatted);
    setPhoneError("");
  };

  // Formatar o número original para exibição
  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      let formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
      if (cleaned.length >= 7) {
        formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
      }
      return formatted;
    }
    return phone;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[rgba(20,20,20,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        {/* Success Header - Compacto */}
        <div className="bg-gradient-to-br from-[#C47B3C] to-[#A56A38] p-4 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Reserva Realizada!
          </h2>
          <p className="text-white/80 text-xs">
            Seu pedido de reserva foi registrado
          </p>
        </div>

        {/* Reservation Details */}
        <div className="p-8 space-y-6">
          <div className="bg-gradient-to-br from-[#C47B3C]/10 to-[#A56A38]/5 border border-[#C47B3C]/20 rounded-lg p-4">
            <p className="text-center text-white font-mono text-2xl tracking-wider">
              {reservationCode}
            </p>
            <p className="text-center text-[#888888] text-xs mt-1">
              Código da Reserva
            </p>
          </div>

          {/* Important Warning */}
          <div className="bg-[rgba(255,200,0,0.1)] border-2 border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-500 font-bold text-sm mb-1">
                  IMPORTANTE: VERIFIQUE OS DADOS DA SUA RESERVA COM CUIDADO
                </p>
                <p className="text-[#AAAAAA] text-xs">
                  Confirme todas as informações antes de enviar a confirmação no WhatsApp
                </p>
              </div>
            </div>
          </div>

          {/* Reservation Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
              <User className="w-5 h-5 text-[#C47B3C]" />
              <div>
                <p className="text-[#888888] text-xs">Nome</p>
                <p className="text-white font-medium">{bookingData.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
              <Phone className="w-5 h-5 text-[#C47B3C]" />
              <div>
                <p className="text-[#888888] text-xs">WhatsApp</p>
                <p className="text-white font-medium">{formatPhoneDisplay(bookingData.phone_whatsapp)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
              <Calendar className="w-5 h-5 text-[#C47B3C]" />
              <div>
                <p className="text-[#888888] text-xs">Data</p>
                <p className="text-white font-medium">
                  {format(new Date(bookingData.date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
              <Clock className="w-5 h-5 text-[#C47B3C]" />
              <div>
                <p className="text-[#888888] text-xs">Horário</p>
                <p className="text-white font-medium">{bookingData.slot_time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg md:col-span-2">
              <Users className="w-5 h-5 text-[#C47B3C]" />
              <div>
                <p className="text-[#888888] text-xs">Pessoas</p>
                <p className="text-white font-medium">{bookingData.party_size} pessoas</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Confirmation */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-white font-semibold text-lg">
              Enviar Confirmação
            </h3>
            
            {!showWhatsAppButton ? (
              <div className="space-y-3">
                <label className="text-white text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C47B3C]" />
                  Confirme seu WhatsApp
                </label>
                <input
                  type="tel"
                  value={confirmPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
                />
                
                {phoneError && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-500 text-sm">{phoneError}</p>
                  </div>
                )}

                <button
                  onClick={handleConfirmPhone}
                  className="premium-button w-full"
                >
                  Verificar WhatsApp
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-green-500 text-sm font-medium">
                    WhatsApp confirmado! Agora envie a confirmação.
                  </p>
                </div>
                
                <button
                  onClick={handleSendWhatsApp}
                  className="premium-button w-full flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Enviar Confirmação no WhatsApp
                </button>
              </div>
            )}

            <p className="text-xs text-[#888888] text-center">
              Ao clicar, você será redirecionado para o WhatsApp do restaurante com sua confirmação pré-preenchida
            </p>
          </div>

          <button
            onClick={onBackToHome}
            className="premium-button-outline w-full"
          >
            Voltar ao Início
          </button>
        </div>
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

        .premium-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(196, 123, 60, 0.4);
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