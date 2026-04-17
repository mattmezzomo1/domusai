import React, { useState, useEffect } from 'react';
import { restaurantService } from "@/services/api.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Activity, Eye, EyeOff, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function TrackingSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    facebook_pixel_id: '',
    meta_conversion_api_token: '',
    gtm_container_id: '',
  });

  const [showTokens, setShowTokens] = useState({
    meta_token: false,
  });

  const [message, setMessage] = useState(null);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  useEffect(() => {
    if (restaurant) {
      setFormData({
        facebook_pixel_id: restaurant.facebook_pixel_id || '',
        meta_conversion_api_token: restaurant.meta_conversion_api_token || '',
        gtm_container_id: restaurant.gtm_container_id || '',
      });
    }
  }, [restaurant]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (restaurant) {
        return await restaurantService.update(restaurant.id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurants']);
      setMessage({ type: 'success', text: 'Configurações de tracking salvas com sucesso!' });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar configurações' });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Remove empty values
    const cleanData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] && formData[key].trim() !== '') {
        cleanData[key] = formData[key].trim();
      } else {
        cleanData[key] = null; // Set to null to clear in database
      }
    });

    updateMutation.mutate(cleanData);
  };

  const toggleTokenVisibility = (field) => {
    setShowTokens(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!restaurant) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure seu restaurante primeiro antes de configurar o tracking.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Configurações de Tracking</CardTitle>
              <CardDescription>
                Configure Facebook Pixel, Meta Conversions API e Google Tag Manager para rastrear conversões
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Facebook Pixel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Facebook Pixel</h3>
                <a 
                  href="https://www.facebook.com/business/help/952192354843755" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-gray-600">
                O Facebook Pixel rastreia ações dos visitantes no seu site de reservas.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="facebook_pixel_id">Pixel ID</Label>
                <Input
                  id="facebook_pixel_id"
                  value={formData.facebook_pixel_id}
                  onChange={(e) => setFormData({...formData, facebook_pixel_id: e.target.value})}
                  placeholder="Ex: 1234567890123456"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Encontre seu Pixel ID no Gerenciador de Eventos do Facebook
                </p>
              </div>
            </div>

            <Separator />

            {/* Meta Conversions API */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Meta Conversions API</h3>
                <a
                  href="https://www.facebook.com/business/help/2041148702652965"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-gray-600">
                A Conversions API complementa o Pixel com rastreamento server-side para maior precisão.
              </p>

              <div className="space-y-2">
                <Label htmlFor="meta_conversion_api_token">Access Token</Label>
                <div className="relative">
                  <Input
                    id="meta_conversion_api_token"
                    type={showTokens.meta_token ? "text" : "password"}
                    value={formData.meta_conversion_api_token}
                    onChange={(e) => setFormData({...formData, meta_conversion_api_token: e.target.value})}
                    placeholder="Ex: EAAxxxxxxxxxxxxx..."
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleTokenVisibility('meta_token')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showTokens.meta_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Gere um token de acesso no Gerenciador de Eventos do Facebook
                </p>
              </div>
            </div>

            <Separator />

            {/* Google Tag Manager */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Google Tag Manager</h3>
                <a
                  href="https://tagmanager.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-gray-600">
                O GTM permite gerenciar todas as suas tags de marketing em um só lugar.
              </p>

              <div className="space-y-2">
                <Label htmlFor="gtm_container_id">Container ID</Label>
                <Input
                  id="gtm_container_id"
                  value={formData.gtm_container_id}
                  onChange={(e) => setFormData({...formData, gtm_container_id: e.target.value})}
                  placeholder="Ex: GTM-XXXXXXX"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Encontre seu Container ID no painel do Google Tag Manager
                </p>
              </div>
            </div>

            <Separator />

            {/* Info sobre eventos rastreados */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Eventos rastreados automaticamente:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>ViewContent:</strong> Quando o cliente visualiza o formulário de reserva</li>
                  <li><strong>Lead:</strong> Quando a reserva é concluída com sucesso</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card de teste */}
      <Card className="shadow-lg border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Como testar suas configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div>
            <strong>Facebook Pixel:</strong>
            <p>Use a extensão "Facebook Pixel Helper" no Chrome para verificar se o pixel está disparando corretamente.</p>
          </div>
          <div>
            <strong>Google Tag Manager:</strong>
            <p>Use o modo "Preview" no GTM para ver os eventos sendo disparados em tempo real.</p>
          </div>
          <div>
            <strong>Meta Conversions API:</strong>
            <p>Verifique no Gerenciador de Eventos se os eventos server-side estão sendo recebidos.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

