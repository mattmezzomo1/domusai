import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { functionsService } from "@/services/api.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PlansPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        // Página de planos é acessível mesmo sem login
      }
    };
    loadUser();
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: !!user?.email,
  });

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      // Verificar se está rodando em iframe
      if (window.self !== window.top) {
        alert('O checkout do Stripe funciona apenas no app publicado. Por favor, publique seu app e acesse-o diretamente.');
        setIsProcessing(false);
        return;
      }

      const priceId = 'price_1SxZb0A4KrGo8eWw7t0inHNO';
      const successUrl = `${window.location.origin}${createPageUrl("Dashboard")}`;
      const cancelUrl = `${window.location.origin}${createPageUrl("Plans")}`;

      const response = await functionsService.invoke('create-checkout', {
        priceId,
        successUrl,
        cancelUrl
      });

      console.log('Checkout response:', response);

      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else if (response?.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        console.error('Invalid response:', response);
        throw new Error('Erro ao criar sessão de checkout');
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
      setIsProcessing(false);
    }
  };

  const hasActiveSubscription = subscription && 
    (subscription.status === 'active' || subscription.status === 'trial');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/30 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#C47B3C] to-[#A56A38] bg-clip-text text-transparent">
            Plano Domus
          </h1>
          <p className="text-gray-600 text-lg">
            Sistema completo de gestão de reservas para seu restaurante
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
          <Card className="shadow-2xl border-2 border-[#C47B3C]">
            <CardHeader className="text-center bg-gradient-to-r from-amber-50 to-orange-50 border-b">
              <CardTitle className="text-3xl mb-2">Plano Domus</CardTitle>
              <CardDescription className="text-lg">Tudo que você precisa para gerenciar seu restaurante</CardDescription>
              <div className="mt-6">
                <div className="text-5xl font-bold text-[#A56A38]">R$ 197</div>
                <div className="text-gray-600 mt-2">por mês</div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4 mb-8">
                {[
                  'Sistema completo de reservas online',
                  'Gestão inteligente de mesas e turnos',
                  'Cadastro e histórico de clientes',
                  'Página pública personalizada',
                  'Dashboard com métricas em tempo real',
                  'Relatórios e insights avançados',
                  'Controle de capacidade e horários',
                  'Suporte técnico prioritário'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {hasActiveSubscription ? (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium">
                      ✓ Você já tem uma assinatura ativa
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(createPageUrl("Dashboard"))}
                    className="w-full bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48]"
                    size="lg"
                  >
                    Ir para o Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] text-lg h-14"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Assinar Agora
                      </>
                    )}
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Cancele quando quiser • Sem taxas ocultas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Pagamento seguro processado via Stripe</p>
          <p className="mt-2">Dúvidas? Entre em contato conosco</p>
        </div>
      </div>
    </div>
  );
}