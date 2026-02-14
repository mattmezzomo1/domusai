import React, { useState } from "react";
import { functionsService } from "@/services/api.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, User, CheckCircle2, Loader2 } from "lucide-react";

export default function FreeTrialAdmin() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Chama o backend function que cria a conta e a subscription free
      await functionsService.invoke('create-freetrial-account', {
        email: formData.email,
        full_name: formData.full_name
      });

      setSuccess(true);
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Conta Criada com Sucesso!</CardTitle>
            <CardDescription className="text-base mt-2">
              Enviamos um e-mail para <strong>{formData.email}</strong> com as instruções para definir sua senha e acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">✓ Acesso Free Trial Ativado</p>
              <p>Você tem acesso completo a todas as funcionalidades da plataforma Domus sem necessidade de pagamento.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f1565be1fb405a8ae93cd6/e8bb9b709_LOGOS16.png" 
              alt="Logo" 
              className="w-16 h-16 rounded-xl object-cover shadow-lg"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Free Trial - Domus</CardTitle>
          <CardDescription className="text-base mt-2">
            Crie sua conta e tenha acesso completo ao sistema de reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  className="pl-10"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta Gratuita"
              )}
            </Button>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <p className="font-medium mb-1">✓ Acesso Completo Incluído</p>
              <p className="text-xs">Todas as funcionalidades sem necessidade de pagamento</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}