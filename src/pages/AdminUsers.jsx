import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { functionsService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Shield, Gift, Percent, Ban, RefreshCw, MoreVertical, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import DiscountCodeDialog from "@/components/admin/DiscountCodeDialog";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [user, setUser] = React.useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.User.list('-created_date');
      console.log('Usuários carregados:', result);
      return result;
    },
    enabled: !isCheckingAuth && user?.role === 'admin',
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-all-subscriptions'],
    queryFn: () => base44.asServiceRole.entities.Subscription.list(),
    enabled: !isCheckingAuth && user?.role === 'admin',
  });

  const grantFreePlanMutation = useMutation({
    mutationFn: (userEmail) => functionsService.invoke('admin-grant-free-plan', { user_email: userEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      alert('Plano gratuito concedido com sucesso!');
    },
    onError: (error) => {
      alert('Erro ao conceder plano gratuito: ' + error.message);
    }
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (userEmail) => functionsService.invoke('admin-revoke-access', { user_email: userEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      alert('Acesso revogado com sucesso!');
    },
    onError: (error) => {
      alert('Erro ao revogar acesso: ' + error.message);
    }
  });

  const upgradeToPaidMutation = useMutation({
    mutationFn: (userEmail) => functionsService.invoke('admin-upgrade-to-paid', { user_email: userEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-subscriptions'] });
      alert('Plano alterado para pago com sucesso!');
    },
    onError: (error) => {
      alert('Erro ao alterar plano: ' + error.message);
    }
  });

  const handleGrantFreePlan = (userEmail) => {
    if (confirm(`Conceder plano gratuito para ${userEmail}?`)) {
      grantFreePlanMutation.mutate(userEmail);
    }
  };

  const handleRevokeAccess = (userEmail) => {
    if (confirm(`Revogar acesso de ${userEmail}?`)) {
      revokeAccessMutation.mutate(userEmail);
    }
  };

  const handleUpgradeToPaid = (userEmail) => {
    if (confirm(`Alterar ${userEmail} para plano pago?`)) {
      upgradeToPaidMutation.mutate(userEmail);
    }
  };

  const handleCreateDiscountForUser = (userEmail) => {
    const code = prompt('Digite o código de desconto:');
    if (!code) return;
    
    const percentage = prompt('Digite a porcentagem de desconto (ex: 50 para 50%):');
    if (!percentage) return;

    functionsService.invoke('admin-create-discount-code', {
      code: code,
      percentage: parseInt(percentage),
      user_email: userEmail
    }).then(() => {
      alert(`Código de desconto criado e aplicado para ${userEmail}!`);
    }).catch(err => {
      alert('Erro ao criar código: ' + err.message);
    });
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserSubscription = (email) => {
    return subscriptions.find(s => s.user_email === email);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
              <p className="text-gray-500">Visualize e gerencie todos os usuários da plataforma</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => refetchUsers()}
                variant="outline"
                disabled={isLoadingUsers}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={() => setShowDiscountDialog(true)}
                className="bg-gradient-to-r from-green-600 to-green-700"
              >
                <Percent className="w-4 h-4 mr-2" />
                Criar Código de Desconto
              </Button>
            </div>
          </div>
        </div>

        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              Todos os Usuários ({filteredUsers.length})
              {isLoadingUsers && <span className="text-sm text-gray-500 ml-2">(carregando...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(user => {
                const subscription = getUserSubscription(user.email);
                return (
                  <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4 mb-3 md:mb-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.full_name || 'Sem nome'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        {user.created_date && (
                          <p className="text-xs text-gray-400 mt-1">
                            Criado em {format(new Date(user.created_date), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <Shield className="w-3 h-3 inline mr-1" />
                        {user.role}
                      </span>
                      
                      {subscription ? (
                        <>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subscription.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : subscription.status === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subscription.status}
                          </span>
                          {subscription.plan_type && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {subscription.plan_type}
                            </span>
                          )}
                          {user.role !== 'admin' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {subscription.plan_type === 'domus_free' && (
                                  <DropdownMenuItem onClick={() => handleUpgradeToPaid(user.email)}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Alterar para Pago
                                  </DropdownMenuItem>
                                )}
                                {subscription.plan_type === 'domus_paid' && (
                                  <DropdownMenuItem onClick={() => handleGrantFreePlan(user.email)}>
                                    <Gift className="w-4 h-4 mr-2" />
                                    Alterar para Free
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleCreateDiscountForUser(user.email)}>
                                  <Percent className="w-4 h-4 mr-2" />
                                  Criar Desconto
                                </DropdownMenuItem>
                                {subscription.status === 'active' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRevokeAccess(user.email)}
                                    className="text-red-600"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Revogar Acesso
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      ) : (
                        user.role !== 'admin' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleGrantFreePlan(user.email)}
                            disabled={grantFreePlanMutation.isPending}
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            Conceder Plano Free
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DiscountCodeDialog 
        open={showDiscountDialog}
        onOpenChange={setShowDiscountDialog}
        onSuccess={() => {}}
      />
    </div>
  );
}