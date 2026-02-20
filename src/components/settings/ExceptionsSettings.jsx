import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Pencil, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExceptionsSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingException, setEditingException] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    type: 'holiday',
    name: '',
    capacity_override: '',
    notes: '',
    has_special_shift: false,
    special_shift_start_time: '',
    special_shift_end_time: '',
    special_shift_slot_interval: '15'
  });

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => base44.entities.Restaurant.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await base44.entities.Exception.filter({ restaurant_id: restaurant.id }, 'date');
    },
    enabled: !!restaurant,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Exception.create({
      ...data,
      restaurant_id: restaurant.id,
      capacity_override: data.capacity_override ? parseInt(data.capacity_override) : null,
      special_shift_slot_interval: data.has_special_shift && data.special_shift_slot_interval
        ? parseInt(data.special_shift_slot_interval)
        : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      setIsDialogOpen(false);
      setFormData({
        date: '',
        type: 'holiday',
        name: '',
        capacity_override: '',
        notes: '',
        has_special_shift: false,
        special_shift_start_time: '',
        special_shift_end_time: '',
        special_shift_slot_interval: '15'
      });
      setEditingException(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Exception.update(id, {
      ...data,
      capacity_override: data.capacity_override ? parseInt(data.capacity_override) : null,
      special_shift_slot_interval: data.has_special_shift && data.special_shift_slot_interval
        ? parseInt(data.special_shift_slot_interval)
        : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      setIsDialogOpen(false);
      setFormData({
        date: '',
        type: 'holiday',
        name: '',
        capacity_override: '',
        notes: '',
        has_special_shift: false,
        special_shift_start_time: '',
        special_shift_end_time: '',
        special_shift_slot_interval: '15'
      });
      setEditingException(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Exception.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
    },
  });

  const handleEdit = (exception) => {
    setEditingException(exception);
    setFormData({
      date: exception.date,
      type: exception.type,
      name: exception.name,
      capacity_override: exception.capacity_override?.toString() || '',
      notes: exception.notes || '',
      has_special_shift: exception.has_special_shift || false,
      special_shift_start_time: exception.special_shift_start_time || '',
      special_shift_end_time: exception.special_shift_end_time || '',
      special_shift_slot_interval: exception.special_shift_slot_interval?.toString() || '15'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingException) {
      updateMutation.mutate({ id: editingException.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const typeLabels = {
    blocked: "Bloqueado",
    holiday: "Feriado",
    special_event: "Evento Especial",
    reduced_capacity: "Capacidade Reduzida"
  };

  const typeColors = {
    blocked: "bg-red-100 text-red-800 border-red-200",
    holiday: "bg-yellow-100 text-yellow-800 border-yellow-200",
    special_event: "bg-purple-100 text-purple-800 border-purple-200",
    reduced_capacity: "bg-orange-100 text-orange-800 border-orange-200"
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
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A56A38]" />
              Exceções e Bloqueios
            </CardTitle>
            <CardDescription>Gerencie feriados, eventos especiais e datas bloqueadas</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingException(null);
              setFormData({
                date: '',
                type: 'holiday',
                name: '',
                capacity_override: '',
                notes: '',
                has_special_shift: false,
                special_shift_start_time: '',
                special_shift_end_time: '',
                special_shift_slot_interval: '15'
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48]">
                <Plus className="w-4 h-4 mr-2" />
                Nova Exceção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingException ? 'Editar Exceção' : 'Adicionar Exceção'}</DialogTitle>
              </DialogHeader>
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
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holiday">Feriado</SelectItem>
                        <SelectItem value="special_event">Evento Especial</SelectItem>
                        <SelectItem value="reduced_capacity">Capacidade Reduzida</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Natal, Evento Corporativo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidade (opcional)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity_override}
                      onChange={(e) => setFormData({...formData, capacity_override: e.target.value})}
                      placeholder="Deixe vazio para usar padrão"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Detalhes sobre a exceção"
                    />
                  </div>
                </div>

                {/* Special Shift Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="has_special_shift"
                      checked={formData.has_special_shift}
                      onChange={(e) => setFormData({...formData, has_special_shift: e.target.checked})}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <Label htmlFor="has_special_shift" className="cursor-pointer flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#A56A38]" />
                      Turno Especial com Horários Especiais
                    </Label>
                  </div>

                  {formData.has_special_shift && (
                    <div className="grid grid-cols-3 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="special_shift_start_time">Horário Início *</Label>
                        <Input
                          id="special_shift_start_time"
                          type="time"
                          value={formData.special_shift_start_time}
                          onChange={(e) => setFormData({...formData, special_shift_start_time: e.target.value})}
                          required={formData.has_special_shift}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="special_shift_end_time">Horário Fim *</Label>
                        <Input
                          id="special_shift_end_time"
                          type="time"
                          value={formData.special_shift_end_time}
                          onChange={(e) => setFormData({...formData, special_shift_end_time: e.target.value})}
                          required={formData.has_special_shift}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="special_shift_slot_interval">Intervalo (min)</Label>
                        <Input
                          id="special_shift_slot_interval"
                          type="number"
                          min="5"
                          step="5"
                          value={formData.special_shift_slot_interval}
                          onChange={(e) => setFormData({...formData, special_shift_slot_interval: e.target.value})}
                          placeholder="15"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : editingException ? 'Salvar Alterações' : 'Criar Exceção'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {exceptions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma exceção cadastrada</h3>
            <p className="text-gray-500 mb-4">Adicione feriados, eventos ou bloqueios de datas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.map((exception) => (
                <TableRow key={exception.id}>
                  <TableCell className="font-semibold">
                    {format(new Date(exception.date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{exception.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${typeColors[exception.type]} border`}>
                      {typeLabels[exception.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {exception.capacity_override ? `${exception.capacity_override} lugares` : 'Padrão'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {exception.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(exception)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(exception.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}