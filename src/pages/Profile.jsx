import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { subscriptionService } from "@/services/api.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Lock, 
  CreditCard, 
  MessageCircle, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Calendar,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("account");
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await authService.me(),
  });

  const { data: subscription, isLoading: loadingSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await subscriptionService.filter({ user_email: user.email });
      return subs[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || ""
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await authService.updateMe({
        full_name: formData.full_name
      });

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Enviar email de redefinição de senha
      await authService.resetPassword(user.email);

      setMessage({
        type: 'success',
        text: 'Um link para redefinir sua senha foi enviado para seu email. Verifique sua caixa de entrada.'
      });
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao solicitar redefinição de senha. Tente novamente.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.')) {
      return;
    }

    setMessage({ type: 'info', text: 'Entre em contato com o suporte para cancelar sua assinatura.' });
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#C47B3C] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-500">Gerencie sua conta e preferências</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 
            message.type === 'error' ? 'bg-red-50 border-red-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <AlertDescription className={
              message.type === 'success' ? 'text-green-800' : 
              message.type === 'error' ? 'text-red-800' : 
              'text-blue-800'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden md:inline">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">Suporte</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Alterar Senha</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Por segurança, enviaremos um link de redefinição de senha para seu email cadastrado.
                        </AlertDescription>
                      </Alert>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38]"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          {isSaving ? 'Enviando...' : 'Enviar Link de Redefinição'}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="pt-6 border-t space-y-3">
                    <h3 className="font-semibold text-lg mb-4">Segurança Adicional</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Autenticação em Dois Fatores</p>
                        <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Em Breve
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Sessões Ativas</p>
                        <p className="text-sm text-gray-500">Gerencie dispositivos conectados</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Em Breve
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Minha Assinatura
                </CardTitle>
                <CardDescription>Gerencie seu plano e pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-3 border-[#C47B3C] border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-500">Carregando informações...</p>
                  </div>
                ) : subscription ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {subscription.plan_type === 'domus_paid' ? 'Plano Premium' : 'Plano Gratuito'}
                            {subscription.status === 'active' && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className="font-medium capitalize">{
                              subscription.status === 'active' ? 'Ativo' :
                              subscription.status === 'trial' ? 'Trial' :
                              subscription.status === 'cancelled' ? 'Cancelado' :
                              subscription.status === 'expired' ? 'Expirado' : subscription.status
                            }</span>
                          </p>
                        </div>
                        {subscription.plan_type === 'domus_paid' && subscription.status === 'active' && (
                          <Crown className="w-8 h-8 text-amber-500" />
                        )}
                      </div>

                      {subscription.current_period_end && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Renovação: {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      {subscription.plan_type === 'domus_paid' ? (
                        <div className="mt-6 pt-6 border-t border-amber-200">
                          <h4 className="font-semibold mb-3">Recursos Inclusos:</h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Reservas ilimitadas
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              CRM completo de clientes
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Analytics e insights avançados
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Suporte prioritário
                            </li>
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-6 pt-6 border-t border-amber-200">
                          <p className="text-sm text-gray-700 mb-4">
                            Faça upgrade para o plano Premium e desbloqueie todos os recursos!
                          </p>
                          <Button 
                            className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38]"
                            onClick={() => window.location.href = '/Plans'}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Fazer Upgrade
                          </Button>
                        </div>
                      )}
                    </div>

                    {subscription.plan_type === 'domus_paid' && subscription.status === 'active' && (
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setMessage({ type: 'info', text: 'Entre em contato com o suporte para gerenciar seu método de pagamento.' })}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Gerenciar Método de Pagamento
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleCancelSubscription}
                        >
                          Cancelar Assinatura
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Você ainda não possui uma assinatura</p>
                    <Button 
                      className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38]"
                      onClick={() => window.location.href = '/Plans'}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Ver Planos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Suporte e Ajuda</CardTitle>
                <CardDescription>Tire suas dúvidas sobre a plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert className="bg-amber-50 border-amber-200">
                    <MessageCircle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <p className="font-semibold mb-2">Suporte com IA em desenvolvimento</p>
                      Estamos desenvolvendo um assistente inteligente que irá ajudá-lo com todas as funcionalidades da plataforma. 
                      Em breve você poderá tirar dúvidas, aprender a usar recursos e receber orientações personalizadas.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold mb-2">📚 Central de Ajuda</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Acesse tutoriais e documentação completa
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Acessar
                      </Button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold mb-2">💬 Chat ao Vivo</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Fale diretamente com nossa equipe
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Iniciar Chat
                      </Button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold mb-2">📧 Email</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Envie sua dúvida por email
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        suporte@domus.com
                      </Button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold mb-2">📞 Telefone</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Suporte por telefone disponível
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        (11) 0000-0000
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SubscriptionGuard>
  );
}