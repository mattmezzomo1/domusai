import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Key, Mail } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminSettings() {
  return (
    <AdminGuard>
    <div className="p-3 md:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Configurações da Plataforma</h1>
          <p className="text-xs md:text-sm text-gray-500">Gerencie configurações globais do sistema Domus</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Banco de Dados</CardTitle>
                  <CardDescription>Gerenciar entidades e dados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Acesse o dashboard da Base44 para gerenciar entidades, visualizar logs e configurar regras de acesso.
              </p>
              <Button variant="outline">Abrir Dashboard Base44</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Key className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Stripe Integration</CardTitle>
                  <CardDescription>Configurações de pagamento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gerencie suas chaves de API do Stripe, webhooks e produtos de assinatura.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Modo</span>
                  <span className="font-medium text-orange-600">Test Mode</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Webhook</span>
                  <span className="font-medium text-green-600">Configurado</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Produto Ativo</span>
                  <span className="font-medium">Plano Domus - R$ 197/mês</span>
                </div>
              </div>
              <Button variant="outline" className="mt-4">Ir para Stripe Dashboard</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>E-mail e Notificações</CardTitle>
                  <CardDescription>Configurar envio de e-mails</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Configure templates de e-mail para confirmações de reserva, lembretes e notificações.
              </p>
              <Button variant="outline">Configurar E-mails</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Settings className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>Outras configurações da plataforma</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Versão da Plataforma</span>
                  <span className="font-medium">v1.0.0</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Ambiente</span>
                  <span className="font-medium text-blue-600">Production</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Última Atualização</span>
                  <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}