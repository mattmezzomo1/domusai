import React, { useState, useEffect } from 'react';
import { restaurantService, shiftService, tableService, reservationService } from "@/services/api.service";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle, XCircle, AlertCircle, Users, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateChangeLog, buildModificationNote, addModificationToReservation, addCancellationToReservation } from "@/components/utils/reservationChanges";
import { validateAndReallocateTables } from "@/components/utils/reservationReallocation";

export default function EditReservationDialog({ reservation, trigger }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [reallocationInfo, setReallocationInfo] = useState(null);
  const [isCheckingReallocation, setIsCheckingReallocation] = useState(false);

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const { data: shifts } = useQuery({
    queryKey: ['shifts', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await shiftService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await tableService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const { data: allReservations = [] } = useQuery({
    queryKey: ['all-reservations-edit', restaurant?.id, reservation?.date],
    queryFn: async () => {
      if (!restaurant || !reservation) return [];
      return await reservationService.filter({
        restaurant_id: restaurant.id,
        date: reservation.date
      });
    },
    enabled: !!restaurant && !!reservation,
  });

  useEffect(() => {
    if (reservation) {
      // Convert ISO date string to YYYY-MM-DD format for date input
      const dateValue = reservation.date ? new Date(reservation.date).toISOString().split('T')[0] : '';

      const data = {
        date: dateValue,
        shift_id: reservation.shift_id,
        slot_time: reservation.slot_time,
        party_size: reservation.party_size.toString(),
        table_id: reservation.table_id,
        status: reservation.status,
        notes: reservation.notes || '',
        ticket_amount: reservation.ticket_amount?.toString() || ''
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [reservation]);

  // Validar realocação quando party_size muda
  const handlePartySizeChange = async (newPartySize) => {
    setFormData({...formData, party_size: newPartySize});
    setReallocationInfo(null);
    
    if (!newPartySize || parseInt(newPartySize) === parseInt(originalData.party_size)) {
      return;
    }

    setIsCheckingReallocation(true);

    try {
      const shift = shifts.find(s => s.id === reservation.shift_id);
      if (!shift) {
        setReallocationInfo({
          success: false,
          message: "Turno não encontrado"
        });
        setIsCheckingReallocation(false);
        return;
      }

      const result = await validateAndReallocateTables(
        reservation,
        parseInt(newPartySize),
        tables,
        allReservations,
        shift
      );

      setReallocationInfo(result);
    } catch (error) {
      console.error("Erro ao validar realocação:", error);
      setReallocationInfo({
        success: false,
        message: "Erro ao validar disponibilidade"
      });
    }

    setIsCheckingReallocation(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const changes = generateChangeLog(originalData, data, shifts);
      
      let updateData = {
        date: data.date,
        shift_id: data.shift_id,
        slot_time: data.slot_time,
        party_size: parseInt(data.party_size),
        status: data.status,
        notes: data.notes
      };

      if (data.ticket_amount) {
        updateData.ticket_amount = parseFloat(data.ticket_amount);
      }

      // IMPORTANTE: Se houve realocação de mesas, atualizar table_id e linked_tables
      if (reallocationInfo && reallocationInfo.needsReallocation && reallocationInfo.success) {
        const newTables = reallocationInfo.tables;
        updateData.table_id = newTables[0].id;
        updateData.linked_tables = newTables.map(t => t.id);
        updateData.environment_id = newTables[0].environment_id || null;
        
        // Adicionar informação sobre realocação nas mudanças
        const oldTableNames = reallocationInfo.previousTables 
          ? reallocationInfo.previousTables.join(', ') 
          : 'mesas anteriores';
        const newTableNames = newTables.map(t => t.name).join(', ');
        changes.push(`Mesas realocadas de ${oldTableNames} para ${newTableNames}`);
      }

      // Se houve mudanças, adicionar tags e logs
      if (changes.length > 0) {
        const modificationData = addModificationToReservation(reservation, changes, 'admin');
        const modificationNote = buildModificationNote(changes, 'admin');
        
        updateData.tags = modificationData.tags;
        updateData.modification_log = modificationData.modification_log;
        updateData.notes = (data.notes || '') + modificationNote;
      }

      console.log('📝 Atualizando reserva com dados:', updateData);

      // Converter date para ISO-8601 se fornecido
      if (updateData.date) {
        updateData.date = new Date(updateData.date).toISOString();
      }

      // Converter status para UPPERCASE se fornecido
      if (updateData.status) {
        updateData.status = updateData.status.toUpperCase();
      }

      return reservationService.update(reservation.id, updateData);
    },
    onSuccess: () => {
      console.log('✅ Reserva atualizada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['map-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations-edit'] });
      setIsOpen(false);
      setReallocationInfo(null);
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar reserva:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      // Excluir permanentemente a reserva
      return reservationService.delete(reservation.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['map-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['all-reservations-edit'] });
      setIsOpen(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Verificar se há realocação com erro
    if (reallocationInfo && !reallocationInfo.success) {
      return; // Não permitir salvar se houver erro de realocação
    }
    
    updateMutation.mutate(formData);
  };

  const handleStatusChange = (newStatus) => {
    let updateData = { ...formData, status: newStatus };

    if (newStatus === 'cancelled' && originalData.status !== 'cancelled') {
      const cancellationData = addCancellationToReservation(reservation, 'Status alterado para cancelada', 'admin');
      updateData = {
        ...updateData,
        tags: cancellationData.tags,
        modification_log: cancellationData.modification_log,
        notes: cancellationData.notes,
        cancelled_at: cancellationData.cancelled_at
      };
    }

    updateMutation.mutate(updateData);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    no_show: "bg-orange-100 text-orange-800 border-orange-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
    altered: "bg-amber-100 text-amber-800 border-amber-300"
  };

  const statusLabels = {
    pending: "Reservada",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    no_show: "Não Compareceu",
    completed: "Concluída",
    altered: "Alterada"
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-9 w-9 border-gray-300 hover:bg-gray-50"
        >
          <Pencil className="w-4 h-4 text-gray-600" />
        </Button>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Reserva #{reservation?.reservation_code}</span>
            <div className="flex gap-2">
              <Badge variant="outline" className={`${statusColors[reservation?.status]} border-2`}>
                {statusLabels[reservation?.status]}
              </Badge>
              {reservation?.tags && reservation.tags.includes('alterada') && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  Alterada
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <Label className="text-sm font-semibold mb-3 block">Ações Rápidas</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button
                onClick={() => handleStatusChange('confirmed')}
                size="sm"
                variant={formData.status === 'confirmed' ? 'default' : 'outline'}
                className={formData.status === 'confirmed' ? 'bg-green-600' : ''}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmar
              </Button>
              <Button
                onClick={() => handleStatusChange('completed')}
                size="sm"
                variant={formData.status === 'completed' ? 'default' : 'outline'}
                className={formData.status === 'completed' ? 'bg-blue-600' : ''}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Concluir
              </Button>
              <Button
                onClick={() => handleStatusChange('no_show')}
                size="sm"
                variant={formData.status === 'no_show' ? 'default' : 'outline'}
                className={formData.status === 'no_show' ? 'bg-orange-600' : ''}
              >
                <XCircle className="w-4 h-4 mr-1" />
                No-Show
              </Button>
              <Button
                onClick={() => handleStatusChange('cancelled')}
                size="sm"
                variant={formData.status === 'cancelled' ? 'default' : 'outline'}
                className={formData.status === 'cancelled' ? 'bg-red-600' : ''}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                onClick={() => handleStatusChange('altered')}
                size="sm"
                variant={formData.status === 'altered' ? 'default' : 'outline'}
                className={formData.status === 'altered' ? 'bg-amber-600' : ''}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Alterada
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot_time">Horário *</Label>
                <Input
                  id="slot_time"
                  type="time"
                  value={formData.slot_time}
                  onChange={(e) => setFormData({...formData, slot_time: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Turno *</Label>
                <Select
                  value={formData.shift_id}
                  onValueChange={(value) => setFormData({...formData, shift_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="party_size">Pessoas *</Label>
                <Input
                  id="party_size"
                  type="number"
                  min="1"
                  value={formData.party_size}
                  onChange={(e) => handlePartySizeChange(e.target.value)}
                  required
                />
                {isCheckingReallocation && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verificando disponibilidade...
                  </div>
                )}
              </div>

              {/* Alertas de Realocação */}
              {reallocationInfo && (
                <div className="col-span-2">
                  <Alert variant={reallocationInfo.success ? "default" : "destructive"}>
                    <div className="flex items-start gap-2">
                      {reallocationInfo.success ? (
                        <Users className="w-4 h-4 mt-0.5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription className="font-medium mb-1">
                          {reallocationInfo.success ? "✓ Validação OK" : "✗ Erro de Disponibilidade"}
                        </AlertDescription>
                        <AlertDescription className="text-sm">
                          {reallocationInfo.message}
                        </AlertDescription>
                        
                        {reallocationInfo.success && reallocationInfo.needsReallocation && (
                          <div className="mt-2 text-xs">
                            <p className="font-semibold">Novas mesas:</p>
                            <p>{reallocationInfo.tables.map(t => `${t.name} (${t.seats} lugares)`).join(', ')}</p>
                            
                            {reallocationInfo.previousTables && (
                              <p className="mt-1 text-gray-600">
                                Anteriormente: {reallocationInfo.previousTables.join(', ')}
                              </p>
                            )}
                            
                            {reallocationInfo.freedTables && reallocationInfo.freedTables.length > 0 && (
                              <p className="mt-1 text-green-600">
                                Mesas liberadas: {reallocationInfo.freedTables.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                </div>
              )}

              <div className="space-y-2 col-span-2">
                <Label htmlFor="ticket_amount">Valor da Conta (R$)</Label>
                <Input
                  id="ticket_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.ticket_amount}
                  onChange={(e) => setFormData({...formData, ticket_amount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta reserva?')) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Reserva
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    updateMutation.isPending || 
                    isCheckingReallocation ||
                    (reallocationInfo && !reallocationInfo.success)
                  }
                  className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38]"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}