import React, { useState, useEffect } from 'react';
import { restaurantService, shiftService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Home, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

import PublicLinkCard from "./PublicLinkCard";

export default function RestaurantSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    address: '',
    total_capacity: '',
    timezone: 'America/Sao_Paulo',
    owner_email: '',
    public: true
  });

  const [message, setMessage] = useState(null);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['all-shifts'],
    queryFn: async () => {
      if (restaurants.length > 0) {
        return await shiftService.filter({ restaurant_id: restaurants[0].id });
      }
      return [];
    },
    enabled: restaurants.length > 0,
  });

  const restaurant = restaurants[0];

  useEffect(() => {
    const loadData = async () => {
      if (restaurant) {
        setFormData({
          name: restaurant.name || '',
          slug: restaurant.slug || '',
          phone: restaurant.phone || '',
          address: restaurant.address || '',
          total_capacity: restaurant.total_capacity?.toString() || '',
          timezone: restaurant.timezone || 'America/Sao_Paulo',
          owner_email: restaurant.owner_email || '',
          public: restaurant.public !== undefined ? restaurant.public : true
        });
      } else {
        // Se não tem restaurante, preencher com email do usuário atual
        const currentUser = await authService.me();
        setFormData(prev => ({
          ...prev,
          owner_email: currentUser.email
        }));
      }
    };
    
    loadData();
  }, [restaurant, shifts, restaurants]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Obter email do usuário atual
      const currentUser = await authService.me();

      if (restaurant) {
        return await restaurantService.update(restaurant.id, {
          ...data,
          total_capacity: parseInt(data.total_capacity)
        });
      } else {
        // Na criação, definir owner_email como o email do usuário logado
        return await restaurantService.create({
          ...data,
          total_capacity: parseInt(data.total_capacity),
          owner_email: data.owner_email || currentUser.email
        });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['all-shifts'] });
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };



  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#A56A38]" />
            Informações do Restaurante
          </CardTitle>
          <CardDescription>Configure os dados básicos do seu estabelecimento</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Restaurante *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Restaurante Sabor & Arte"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Amigável (slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  placeholder="Ex: sabor-arte"
                  required
                />
                <p className="text-xs text-gray-500">Será usado na URL pública de reservas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 98765-4321"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_capacity">Capacidade Total *</Label>
                <Input
                  id="total_capacity"
                  type="number"
                  value={formData.total_capacity}
                  onChange={(e) => setFormData({...formData, total_capacity: e.target.value})}
                  placeholder="Ex: 100"
                  required
                />
              </div>

              <div className="space-y-2 col-span-full">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_email">Email do Proprietário</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                  placeholder="contato@restaurante.com"
                />
              </div>
            </div>

            {/* Configuração de Página Pública */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#A56A38]" />
                Página Pública de Reservas
              </h3>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Checkbox
                  checked={formData.public}
                  onCheckedChange={(checked) => setFormData({...formData, public: checked})}
                  id="public"
                />
                <div className="flex-1">
                  <Label htmlFor="public" className="font-semibold cursor-pointer">
                    Habilitar página pública de reservas
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Quando ativo, seus clientes podem fazer reservas online através do link público. 
                    Desative caso queira receber reservas apenas por telefone ou presencialmente.
                  </p>
                </div>
              </div>
            </div>



            <div className="flex justify-end pt-6 border-t">
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48]"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {restaurant && <PublicLinkCard restaurant={restaurant} />}
    </div>
  );
}