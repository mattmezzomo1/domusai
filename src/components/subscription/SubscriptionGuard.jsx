import React, { useEffect, useState } from 'react';
import { subscriptionService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";

export default function SubscriptionGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await subscriptionService.filter({ user_email: user.email });
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: !!user?.email,
  });

  // Admin sempre tem acesso - verificar primeiro antes de loading
  // Backend retorna role em UPPERCASE (ADMIN, USER)
  if (user?.role === 'ADMIN' || user?.role === 'admin') {
    return children;
  }

  // Mostrar loading apenas enquanto carrega user ou subscription
  if (loadingUser || (user && loadingSubscription)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se tem assinatura ativa
  // Backend retorna status em UPPERCASE (ACTIVE, TRIAL, CANCELLED, PAST_DUE)
  const hasActiveSubscription = subscription &&
    (subscription.status === 'ACTIVE' || subscription.status === 'active' ||
     subscription.status === 'TRIAL' || subscription.status === 'trial');

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50/30 p-4">
        <Card className="max-w-lg w-full shadow-2xl border-none">
          <CardHeader className="text-center bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
            <CardDescription className="text-base">
              Para acessar o sistema de gestão de reservas, você precisa de uma assinatura ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6">
            <div className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] text-white p-6 rounded-xl">
              <div className="text-sm font-medium mb-2">Plano Domus</div>
              <div className="text-4xl font-bold mb-1">R$ 197</div>
              <div className="text-sm opacity-90">por mês</div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema completo de reservas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Gestão de clientes e mesas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Página pública de reservas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Relatórios e insights</span>
              </div>
            </div>

            <Link to={createPageUrl("Plans")}>
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] text-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar Agora
              </Button>
            </Link>

            <p className="text-xs text-gray-500">
              Cancele quando quiser, sem multas ou taxas adicionais
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}