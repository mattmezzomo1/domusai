import React, { useState, useEffect } from "react";
import { User, Phone, Mail, Cake, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BookingStep3({ bookingData, restaurant, onComplete, onBack }) {
  const [formData, setFormData] = useState({
    phone_whatsapp: bookingData.phone_whatsapp || "",
    full_name: bookingData.full_name || "",
    email: bookingData.email || "",
    birthday_day: "",
    birthday_month: "",
    birthday_year: "",
    notes: bookingData.notes || ""
  });
  
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(null);

  // Buscar cliente quando WhatsApp for preenchido
  useEffect(() => {
    const searchCustomer = async () => {
      const cleanPhone = formData.phone_whatsapp.replace(/\D/g, '');
      
      if (cleanPhone.length >= 10) {
        setIsLoadingCustomer(true);
        try {
          const customers = await base44.entities.Customer.filter({
            restaurant_id: restaurant.id,
            phone_whatsapp: cleanPhone
          });

          if (customers.length > 0) {
            const customer = customers[0];
            setExistingCustomer(customer);
            
            // Preencher automaticamente os dados do cliente
            setFormData(prev => ({
              ...prev,
              full_name: customer.full_name || prev.full_name,
              email: customer.email || prev.email
            }));

            // Se tem birth_date, extrair dia, mês e ano
            if (customer.birth_date) {
              const [year, month, day] = customer.birth_date.split('-');
              setFormData(prev => ({
                ...prev,
                birthday_day: day,
                birthday_month: month,
                birthday_year: year
              }));
            }
          } else {
            setExistingCustomer(null);
          }
        } catch (error) {
          console.error("Erro ao buscar cliente:", error);
        } finally {
          setIsLoadingCustomer(false);
        }
      } else {
        setExistingCustomer(null);
      }
    };

    const debounce = setTimeout(searchCustomer, 500);
    return () => clearTimeout(debounce);
  }, [formData.phone_whatsapp, restaurant.id]);

  const handleSubmit = () => {
    if (!formData.phone_whatsapp || !formData.full_name) {
      alert("WhatsApp e Nome são obrigatórios");
      return;
    }

    // Validar WhatsApp (formato básico)
    const cleanPhone = formData.phone_whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      alert("Por favor, insira um WhatsApp válido (11 dígitos com DDD)");
      return;
    }

    // Converter data de nascimento para formato ISO se preenchido
    let birthday = null;
    if (formData.birthday_day && formData.birthday_month && formData.birthday_year) {
      const day = formData.birthday_day.padStart(2, '0');
      const month = formData.birthday_month.padStart(2, '0');
      const year = formData.birthday_year.padStart(4, '0');
      birthday = `${year}-${month}-${day}`;
    }

    onComplete({
      full_name: formData.full_name,
      phone_whatsapp: cleanPhone,
      email: formData.email,
      birth_date: birthday,
      notes: formData.notes
    });
  };

  const handlePhoneChange = (value) => {
    // Remover tudo que não é número
    const cleaned = value.replace(/\D/g, '');

    // Limitar a 11 dígitos (DDD + 9 dígitos)
    const limited = cleaned.substring(0, 11);

    // Formatar telefone automaticamente
    let formatted = limited;

    if (limited.length >= 2) {
      formatted = `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
    }
    if (limited.length >= 7) {
      formatted = `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`;
    }

    setFormData({ ...formData, phone_whatsapp: formatted });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Seus Dados
        </h2>
        <p className="text-[#AAAAAA] text-sm">
          Preencha suas informações para confirmar a reserva
        </p>
      </div>

      <div className="space-y-4">
        {/* WhatsApp - PRIMEIRO */}
        <div>
          <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-[#C47B3C]" />
            WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.phone_whatsapp}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={15}
            className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
          />
          {isLoadingCustomer && (
            <p className="text-xs text-[#C47B3C] mt-1 animate-pulse">
              Verificando cadastro...
            </p>
          )}
          {existingCustomer && !isLoadingCustomer && (
            <p className="text-xs text-green-500 mt-1">
              ✓ Cliente encontrado! Dados preenchidos automaticamente.
            </p>
          )}
          {!existingCustomer && !isLoadingCustomer && formData.phone_whatsapp.replace(/\D/g, '').length >= 10 && (
            <p className="text-xs text-[#888888] mt-1">
              Novo cliente - preencha os dados abaixo
            </p>
          )}
        </div>

        {/* Nome Completo */}
        <div>
          <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-[#C47B3C]" />
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Seu nome completo"
            className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
          />
        </div>

        {/* Email (Opcional) */}
        <div>
          <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-[#C47B3C]" />
            Email (opcional)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="seu@email.com"
            className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
          />
        </div>

        {/* Data de Nascimento (dd/mm/aaaa) */}
        <div>
          <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
            <Cake className="w-4 h-4 text-[#C47B3C]" />
            Data de Nascimento (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.birthday_day}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                setFormData({ ...formData, birthday_day: val });
              }}
              placeholder="DD"
              maxLength="2"
              className="w-20 p-4 text-center bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
            />
            <input
              type="text"
              value={formData.birthday_month}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                setFormData({ ...formData, birthday_month: val });
              }}
              placeholder="MM"
              maxLength="2"
              className="w-20 p-4 text-center bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
            />
            <input
              type="text"
              value={formData.birthday_year || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFormData({ ...formData, birthday_year: val });
              }}
              placeholder="AAAA"
              maxLength="4"
              className="flex-1 p-4 text-center bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all"
            />
          </div>
          <p className="text-xs text-[#C47B3C] mt-1">
            🎁 No seu aniversário você ganha um presente especial!
          </p>
        </div>

        {/* Observações */}
        <div>
          <label className="text-white text-sm font-medium flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#C47B3C]" />
            Observações/Preferências (opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Alguma preferência especial? Aniversário, comemoração, restrições alimentares..."
            rows={4}
            className="w-full p-4 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-lg text-white placeholder-[#888888] focus:border-[#C47B3C] focus:outline-none transition-all resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="premium-button-outline flex-1"
        >
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          className="premium-button flex-1"
        >
          Confirmar Reserva
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

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}