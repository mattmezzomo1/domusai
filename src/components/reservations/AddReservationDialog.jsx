import React, { useState } from 'react';
import { restaurantService, customerService, shiftService, tableService, reservationService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  validateReservation,
  generateAvailableSlots,
  validateOpeningHours,
  getDayOfWeek
} from "@/components/utils/reservationValidation";

export default function AddReservationDialog({ trigger }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  // Estado inicial do formulário com todos os campos definidos
  const initialFormData = {
    customer_id: '',
    date: '',
    shift_id: '',
    slot_time: '',
    party_size: '2',
    notes: '',
    whatsapp: '',
    customer_name: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const { data: customers } = useQuery({
    queryKey: ['customers', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await customerService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      const fetchedShifts = await shiftService.filter({ restaurant_id: restaurant.id });
      console.log('🔄 Shifts carregados do backend:', fetchedShifts);
      return fetchedShifts;
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await tableService.filter({
        restaurant_id: restaurant.id
      });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const handleDateChange = async (newDate) => {
    setFormData({ ...formData, date: newDate, shift_id: '', slot_time: '' });
    setError(null);
    setAvailableSlots([]);

    if (!newDate || !restaurant) return;

    const dayOfWeek = getDayOfWeek(newDate);

    console.log('📅 Data selecionada (Admin):', {
      date: newDate,
      dayOfWeek,
      dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]
    });

    console.log('🔍 Turnos recebidos do backend:', {
      count: shifts?.length || 0,
      shifts: shifts?.map(s => ({
        name: s.name,
        days_of_week: s.days_of_week,
        active: s.active
      }))
    });

    // Validar se o restaurante abre neste dia
    const openingValidation = validateOpeningHours(restaurant, newDate, shifts);
    if (!openingValidation.valid) {
      setError(openingValidation.message);
      return;
    }
  };

  const handleShiftChange = async (shiftId) => {
    setFormData({ ...formData, shift_id: shiftId, slot_time: '' });
    setError(null);
    setAvailableSlots([]);

    console.log('🔍 handleShiftChange - Dados:', {
      date: formData.date,
      party_size: formData.party_size,
      shiftId,
      totalTables: tables.length,
      totalShifts: shifts.length
    });

    if (!formData.date || !formData.party_size || !shiftId) {
      console.log('⚠️ Faltam dados obrigatórios');
      return;
    }

    setIsLoadingSlots(true);

    try {
      // Buscar TODAS as reservas do dia e filtrar apenas ativas
      const allReservations = await reservationService.filter({
        restaurant_id: restaurant.id,
        date: formData.date
      });

      const existingReservations = allReservations.filter(r =>
        r.status === 'pending' || r.status === 'confirmed' || r.status === 'PENDING' || r.status === 'CONFIRMED'
      );

      console.log('📊 Admin - Reservas no dia:', allReservations.length, '| Ativas:', existingReservations.length);
      
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) {
        setError("Turno não encontrado");
        return;
      }
      
      // Filtrar apenas mesas ativas e disponíveis
      // Backend retorna: is_active (boolean) e status (UPPERCASE)
      console.log('🔍 DEBUG - Todas as mesas:', tables.map(t => ({
        name: t.name,
        is_active: t.is_active,
        status: t.status,
        seats: t.seats
      })));

      const activeTables = tables.filter(t => {
        const isActive = t.is_active === true || t.is_active === 1;
        const isAvailable = t.status?.toUpperCase() === 'AVAILABLE';
        console.log(`Mesa ${t.name}: is_active=${t.is_active} (${isActive}), status=${t.status} (${isAvailable})`);
        return isActive && isAvailable;
      });

      console.log('📊 Admin - Mesas ativas:', activeTables.length, 'de', tables.length);
      
      if (activeTables.length === 0) {
        setError("Nenhuma mesa ativa e disponível cadastrada. Configure as mesas primeiro.");
        return;
      }
      
      // Gerar slots disponíveis
      console.log('🔍 Gerando slots com:', {
        shift: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        date: formData.date,
        party_size: parseInt(formData.party_size),
        activeTables: activeTables.length,
        existingReservations: existingReservations.length,
        booking_cutoff_hours: restaurant.booking_cutoff_hours || 2
      });

      const slots = generateAvailableSlots(
        shift,
        formData.date,
        parseInt(formData.party_size),
        activeTables,
        existingReservations,
        restaurant.booking_cutoff_hours || 2
      );

      console.log('📊 Admin - Slots gerados:', slots.length, slots);

      if (slots.length === 0) {
        const totalCapacity = activeTables.reduce((sum, t) => sum + t.seats, 0);
        setError(`Nenhum horário disponível para ${formData.party_size} pessoa(s). Capacidade total: ${totalCapacity} lugares. ${existingReservations.length > 0 ? 'Todas as mesas estão ocupadas.' : 'Verifique se há mesas suficientes cadastradas.'}`);
      }

      setAvailableSlots(slots);
    } catch (err) {
      console.error("Erro ao carregar slots:", err);
      setError("Erro ao carregar horários disponíveis");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      setError(null);

      // Buscar TODAS as reservas e filtrar apenas ativas
      const allReservations = await reservationService.filter({
        restaurant_id: restaurant.id,
        date: data.date
      });

      const existingReservations = allReservations.filter(r =>
        r.status === 'pending' || r.status === 'confirmed'
      );
      
      // Validação completa
      const validation = await validateReservation(
        restaurant.id,
        data.date,
        data.shift_id,
        data.slot_time,
        parseInt(data.party_size),
        restaurant,
        shifts,
        tables,
        existingReservations
      );

      console.log('🔍 Validação retornou:', validation);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      console.log('✅ Mesas alocadas pela validação:', validation.data.tables.map(t => ({
        id: t.id,
        name: t.name,
        seats: t.seats
      })));

      // Gerar código único
      const code = `${restaurant.slug.toUpperCase()}-${data.date.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const mainTable = validation.data.tables[0];
      const linkedTableIds = validation.data.tables.map(t => t.id);

      console.log('📝 Criando reserva com:', {
        table_id: mainTable.id,
        linked_tables: linkedTableIds,
        party_size: parseInt(data.party_size)
      });

      // Buscar o usuário autenticado para pegar o owner_email
      const user = await authService.me();

      // Criar a reserva com data em formato ISO-8601
      const reservationData = {
        restaurant_id: restaurant.id,
        owner_email: user.email,
        customer_id: data.customer_id,
        reservation_code: code,
        date: new Date(data.date).toISOString(), // Converter para ISO-8601
        shift_id: data.shift_id,
        slot_time: data.slot_time,
        party_size: parseInt(data.party_size),
        table_id: mainTable.id,
        linked_tables: linkedTableIds,
        environment_id: mainTable.environment_id || null,
        status: 'PENDING', // Status em UPPERCASE
        source: 'phone',
        notes: data.notes || `Reserva para ${data.party_size} pessoa(s). Mesas: ${validation.data.tables.map(t => t.name).join(', ')}`
      };

      console.log('📤 Enviando para o backend:', reservationData);

      const reservation = await reservationService.create(reservationData);

      console.log('✅ Reserva criada:', reservation);

      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['map-reservations'] });
      setIsOpen(false);
      setFormData(initialFormData);
      setAvailableSlots([]);
      setError(null);
      setCustomerFound(null);
    },
    onError: (err) => {
      setError(err.message || "Erro ao criar reserva");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Se não encontrou cliente no CRM, criar um novo
    if (!formData.customer_id && formData.customer_name && formData.whatsapp) {
      console.log('⚠️ Cliente não encontrado no CRM, será necessário criar um novo');
      setError('Por favor, cadastre o cliente no CRM antes de criar a reserva.');
      return;
    }

    if (!formData.customer_id) {
      setError('Por favor, preencha o WhatsApp para buscar o cliente.');
      return;
    }

    console.log('✅ Criando reserva com dados:', formData);
    createMutation.mutate(formData);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Buscar cliente por WhatsApp
  const handleWhatsAppChange = (value) => {
    setFormData({ ...formData, whatsapp: value });

    if (value.length >= 10) { // Telefone tem pelo menos 10 dígitos
      const cleanPhone = value.replace(/\D/g, '');
      const customer = customers.find(c => c.phone_whatsapp && c.phone_whatsapp.replace(/\D/g, '') === cleanPhone);

      if (customer) {
        setCustomerFound(customer);
        setFormData({
          ...formData,
          whatsapp: value,
          customer_id: customer.id,
          customer_name: customer.full_name
        });
      } else {
        setCustomerFound(null);
        // Limpar customer_id se não encontrou
        setFormData({
          ...formData,
          whatsapp: value,
          customer_id: ''
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova Reserva
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nova Reserva</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linha 1: Data e Pessoas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getTodayDate()}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="party_size">Pessoas</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max={restaurant?.max_party_size || 12}
                value={formData.party_size}
                onChange={(e) => setFormData({...formData, party_size: e.target.value, shift_id: '', slot_time: ''})}
                className="h-11"
                required
              />
            </div>
          </div>

          {/* Linha 2: Turno e Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift">Turno</Label>
              <Select
                value={formData.shift_id}
                onValueChange={handleShiftChange}
                required
                disabled={!formData.date || !formData.party_size}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecionar turno" />
                </SelectTrigger>
                <SelectContent>
                  {shifts
                    .filter(s => {
                      if (!formData.date) return false;
                      const dayOfWeek = getDayOfWeek(formData.date);
                      return s.active && s.days_of_week && s.days_of_week.includes(dayOfWeek);
                    })
                    .sort((a, b) => {
                      const timeA = a.start_time.split(':').map(Number);
                      const timeB = b.start_time.split(':').map(Number);
                      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                    })
                    .map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} ({shift.start_time} - {shift.end_time})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot_time">Horário</Label>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center h-11 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <Select
                  value={formData.slot_time}
                  onValueChange={(value) => setFormData({...formData, slot_time: value})}
                  required
                  disabled={!formData.shift_id || availableSlots.length === 0}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione um turno primeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.time} value={slot.time}>
                        {slot.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Linha 3: WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              type="text"
              value={formData.whatsapp}
              onChange={(e) => handleWhatsAppChange(e.target.value)}
              placeholder="(00) 00000-0000"
              className="h-11"
              required
            />
            <p className="text-xs text-gray-500">Digite o WhatsApp para buscar o cliente no CRM</p>
          </div>

          {/* Linha 4: Nome do Cliente */}
          <div className="space-y-2">
            <Label htmlFor="customer_name">Nome do Cliente</Label>
            <Input
              id="customer_name"
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              placeholder={customerFound ? "Cliente encontrado no CRM" : "Digite o nome do cliente"}
              className="h-11"
              disabled={!!customerFound}
              required
            />
            {customerFound && (
              <p className="text-xs text-green-600">✓ Cliente encontrado: {customerFound.full_name}</p>
            )}
          </div>

          {/* Linha 5: Mesa */}
          <div className="space-y-2">
            <Label htmlFor="table">Mesa (disponíveis para 2+ lugares)</Label>
            <Select disabled>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sem mesa" />
              </SelectTrigger>
            </Select>
            <p className="text-xs text-gray-500">
              💡 A mesa será atribuída automaticamente baseado na disponibilidade
            </p>
          </div>

          {/* Linha 6: Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Adicione observações sobre a reserva"
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-11 px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isLoadingSlots}
              className="bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white h-11 px-6"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Reserva'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}