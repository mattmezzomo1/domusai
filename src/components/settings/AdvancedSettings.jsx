import React, { useState, useEffect } from 'react';
import { restaurantService } from "@/services/api.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Clock, Users, AlertCircle, CheckCircle, MessageCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function AdvancedSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    max_party_size: '',
    max_online_party_size: '',
    booking_cutoff_hours: '',
    cancellation_cutoff_hours: '',
    modification_cutoff_hours: '', // NOVO
    late_tolerance_minutes: '',
    enable_waitlist: true,
    enable_table_joining: true,
    enable_modifications: true, // NOVO
    whatsapp_message_template: 'Olá {nome}! Tudo bem?'
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
        max_party_size: restaurant.max_party_size?.toString() || '12',
        max_online_party_size: restaurant.max_online_party_size?.toString() || '8',
        booking_cutoff_hours: restaurant.booking_cutoff_hours?.toString() || '2',
        cancellation_cutoff_hours: restaurant.cancellation_cutoff_hours?.toString() || '2',
        modification_cutoff_hours: restaurant.modification_cutoff_hours?.toString() || '2', // NOVO
        late_tolerance_minutes: restaurant.late_tolerance_minutes?.toString() || '15',
        enable_waitlist: restaurant.enable_waitlist ?? true,
        enable_table_joining: restaurant.enable_table_joining ?? true,
        enable_modifications: restaurant.enable_modifications ?? true, // NOVO
        whatsapp_message_template: restaurant.whatsapp_message_template || 'Olá {nome}! Tudo bem?'
      });
    }
  }, [restaurant]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (restaurant) {
        console.log('🔍 Salvando configurações:', data);
        console.log('🔍 whatsapp_message_template:', data.whatsapp_message_template);
        const result = await restaurantService.update(restaurant.id, {
          max_party_size: parseInt(data.max_party_size),
          max_online_party_size: parseInt(data.max_online_party_size),
          booking_cutoff_hours: parseFloat(data.booking_cutoff_hours),
          cancellation_cutoff_hours: parseFloat(data.cancellation_cutoff_hours),
          modification_cutoff_hours: parseFloat(data.modification_cutoff_hours),
          late_tolerance_minutes: parseInt(data.late_tolerance_minutes),
          enable_waitlist: data.enable_waitlist,
          enable_table_joining: data.enable_table_joining,
          enable_modifications: data.enable_modifications,
          whatsapp_message_template: data.whatsapp_message_template
        });
        console.log('✅ Resultado do update:', result);
        return result;
      }
    },
    onSuccess: (data) => {
      console.log('✅ onSuccess chamado:', data);
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      setMessage({ type: 'success', text: 'Configurações avançadas salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      console.error('❌ onError chamado:', error);
      setMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (!restaurant) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Configure seu restaurante primeiro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#A56A38]" />
            Configurações Avançadas
          </CardTitle>
          <CardDescription>Regras de reserva, limites e automações</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Limites de Grupo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#A56A38]" />
                Limites de Grupo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_party_size">Tamanho Máximo de Grupo</Label>
                  <Input
                    id="max_party_size"
                    type="number"
                    value={formData.max_party_size}
                    onChange={(e) => setFormData({...formData, max_party_size: e.target.value})}
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Limite geral para reservas (manual e online)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_online_party_size">Limite Online</Label>
                  <Input
                    id="max_online_party_size"
                    type="number"
                    value={formData.max_online_party_size}
                    onChange={(e) => setFormData({...formData, max_online_party_size: e.target.value})}
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Limite para reservas pela página pública
                  </p>
                </div>
              </div>
            </div>

            {/* Cutoffs */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#A56A38]" />
                Prazos (Cutoffs)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="booking_cutoff">Criar Reserva</Label>
                  <select
                    id="booking_cutoff"
                    value={formData.booking_cutoff_hours}
                    onChange={(e) => setFormData({...formData, booking_cutoff_hours: e.target.value})}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="0.166">10 minutos</option>
                    <option value="0.5">30 minutos</option>
                    <option value="1">1 hora</option>
                    <option value="2">2 horas</option>
                    <option value="3">3 horas</option>
                    <option value="5">5 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Antecedência mínima para criar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modification_cutoff">Alterar Reserva</Label>
                  <select
                    id="modification_cutoff"
                    value={formData.modification_cutoff_hours}
                    onChange={(e) => setFormData({...formData, modification_cutoff_hours: e.target.value})}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="0.166">10 minutos</option>
                    <option value="0.5">30 minutos</option>
                    <option value="1">1 hora</option>
                    <option value="2">2 horas</option>
                    <option value="3">3 horas</option>
                    <option value="5">5 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Antecedência mínima para alterar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancellation_cutoff">Cancelar Reserva</Label>
                  <select
                    id="cancellation_cutoff"
                    value={formData.cancellation_cutoff_hours}
                    onChange={(e) => setFormData({...formData, cancellation_cutoff_hours: e.target.value})}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="0">Sem limite (até o horário)</option>
                    <option value="0.166">10 minutos</option>
                    <option value="0.5">30 minutos</option>
                    <option value="1">1 hora</option>
                    <option value="2">2 horas</option>
                    <option value="3">3 horas</option>
                    <option value="5">5 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Antecedência mínima para cancelar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="late_tolerance">Tolerância Atraso (min)</Label>
                  <Input
                    id="late_tolerance"
                    type="number"
                    value={formData.late_tolerance_minutes}
                    onChange={(e) => setFormData({...formData, late_tolerance_minutes: e.target.value})}
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Tempo de espera antes de liberar mesa
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#A56A38]" />
                Funcionalidades
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="modifications" className="text-base font-medium">Permitir Alterações Online</Label>
                    <p className="text-sm text-gray-500">Clientes podem alterar reservas pela página pública</p>
                  </div>
                  <Switch
                    id="modifications"
                    checked={formData.enable_modifications}
                    onCheckedChange={(checked) => setFormData({...formData, enable_modifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="waitlist" className="text-base font-medium">Fila de Espera</Label>
                    <p className="text-sm text-gray-500">Permitir clientes entrarem em fila quando lotado</p>
                  </div>
                  <Switch
                    id="waitlist"
                    checked={formData.enable_waitlist}
                    onCheckedChange={(checked) => setFormData({...formData, enable_waitlist: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="table_joining" className="text-base font-medium">Junção Automática de Mesas</Label>
                    <p className="text-sm text-gray-500">Combinar mesas automaticamente para grupos grandes</p>
                  </div>
                  <Switch
                    id="table_joining"
                    checked={formData.enable_table_joining}
                    onCheckedChange={(checked) => setFormData({...formData, enable_table_joining: checked})}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Message Template */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#A56A38]" />
                Mensagem do WhatsApp (CRM)
              </h3>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_message_template">Mensagem Padrão</Label>
                <Textarea
                  id="whatsapp_message_template"
                  value={formData.whatsapp_message_template}
                  onChange={(e) => setFormData({...formData, whatsapp_message_template: e.target.value})}
                  placeholder="Olá {nome}! Tudo bem?"
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Use <code className="bg-gray-100 px-1 py-0.5 rounded">{'{nome}'}</code> para inserir o nome do cliente automaticamente.
                  Esta mensagem será usada ao clicar no botão WhatsApp no CRM.
                </p>
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Dica: Cutoffs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800">
              Configure prazos adequados para reduzir no-shows e dar tempo para reorganização. 
              Sugerimos 2h para reservas de última hora e cancelamentos.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Dica: Fila de Espera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800">
              A fila de espera captura demanda quando lotado e reduz perda de reservas. 
              Clientes são notificados via WhatsApp quando houver disponibilidade.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}