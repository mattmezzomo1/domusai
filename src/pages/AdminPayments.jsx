import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";
import { format } from "date-fns";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminPayments() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => base44.asServiceRole.entities.Subscription.list('-created_date'),
  });

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = subscriptions
    .filter(s => s.status === 'active')
    .length * 197;

  const monthlyRecurring = subscriptions
    .filter(s => s.status === 'active' || s.status === 'trial')
    .length * 197;

  return (
    <AdminGuard>
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamentos e Assinaturas</h1>
          <p className="text-gray-500">Gerencie todas as assinaturas e pagamentos da plataforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-lg border-none overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receita Ativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Mensal</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                MRR Previsto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                R$ {monthlyRecurring.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">Incluindo trials</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {subscriptions.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Todas os status</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por e-mail do usuário..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Todas as Assinaturas ({filteredSubscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSubscriptions.map(sub => (
                <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{sub.user_email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Plano: {sub.plan_type}</span>
                      {sub.stripe_customer_id && (
                        <span className="text-xs">Stripe: {sub.stripe_customer_id.substring(0, 20)}...</span>
                      )}
                    </div>
                    {sub.current_period_end && (
                      <p className="text-xs text-gray-400 mt-1">
                        Renova em: {format(new Date(sub.current_period_end), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 mt-3 md:mt-0">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      sub.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : sub.status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : sub.status === 'cancelled'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sub.status}
                    </span>
                    {sub.status === 'active' && (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <DollarSign className="w-4 h-4" />
                        R$ 197/mês
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminGuard>
  );
}