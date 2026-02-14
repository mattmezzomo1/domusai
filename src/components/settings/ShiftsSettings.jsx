import React, { useState } from 'react';
import { restaurantService, shiftService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export default function ShiftsSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    slot_interval_minutes: '15',
    default_dwell_minutes: '90',
    default_buffer_minutes: '10',
    max_capacity: '', // New field
    days_of_week: [0, 1, 2, 3, 4, 5, 6] // New field, default all days
  });

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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await authService.me();
      return shiftService.create({
        ...data,
        restaurant_id: restaurant.id,
        owner_email: user.email,
        slot_interval_minutes: parseInt(data.slot_interval_minutes),
        default_dwell_minutes: parseInt(data.default_dwell_minutes),
        default_buffer_minutes: parseInt(data.default_buffer_minutes),
        max_capacity: data.max_capacity ? parseInt(data.max_capacity) : null,
        days_of_week: data.days_of_week
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        slot_interval_minutes: '15',
        default_dwell_minutes: '90',
        default_buffer_minutes: '10',
        max_capacity: '',
        days_of_week: [0, 1, 2, 3, 4, 5, 6]
      });
      setEditingShift(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => shiftService.update(id, {
      ...data,
      slot_interval_minutes: parseInt(data.slot_interval_minutes),
      default_dwell_minutes: parseInt(data.default_dwell_minutes),
      default_buffer_minutes: parseInt(data.default_buffer_minutes),
      max_capacity: data.max_capacity ? parseInt(data.max_capacity) : null,
      days_of_week: data.days_of_week
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        slot_interval_minutes: '15',
        default_dwell_minutes: '90',
        default_buffer_minutes: '10',
        max_capacity: '',
        days_of_week: [0, 1, 2, 3, 4, 5, 6]
      });
      setEditingShift(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => shiftService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      slot_interval_minutes: shift.slot_interval_minutes.toString(),
      default_dwell_minutes: shift.default_dwell_minutes.toString(),
      default_buffer_minutes: shift.default_buffer_minutes.toString(),
      max_capacity: shift.max_capacity?.toString() || '',
      days_of_week: shift.days_of_week || [0, 1, 2, 3, 4, 5, 6]
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getDaysLabels = (daysOfWeek) => {
    const dayMap = {
      0: 'Dom',
      1: 'Seg',
      2: 'Ter',
      3: 'Qua',
      4: 'Qui',
      5: 'Sex',
      6: 'Sáb',
    };
    return daysOfWeek?.sort((a, b) => a - b).map(day => dayMap[day]) || [];
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A56A38]" />
              Turnos
            </CardTitle>
            <CardDescription>Configure os turnos de atendimento do restaurante</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingShift(null);
              setFormData({
                name: '',
                start_time: '',
                end_time: '',
                slot_interval_minutes: '15',
                default_dwell_minutes: '90',
                default_buffer_minutes: '10',
                max_capacity: '',
                days_of_week: [0, 1, 2, 3, 4, 5, 6]
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Turno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingShift ? 'Editar Turno' : 'Adicionar Turno'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shift-name">Nome do Turno *</Label>
                    <Input
                      id="shift-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Almoço, Jantar"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interval">Intervalo (minutos) *</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={formData.slot_interval_minutes}
                      onChange={(e) => setFormData({...formData, slot_interval_minutes: e.target.value})}
                      placeholder="15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start">Horário Início *</Label>
                    <Input
                      id="start"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">Horário Fim *</Label>
                    <Input
                      id="end"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dwell">Tempo na Mesa (min) *</Label>
                    <Input
                      id="dwell"
                      type="number"
                      value={formData.default_dwell_minutes}
                      onChange={(e) => setFormData({...formData, default_dwell_minutes: e.target.value})}
                      placeholder="90"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buffer">Buffer (min) *</Label>
                    <Input
                      id="buffer"
                      type="number"
                      value={formData.default_buffer_minutes}
                      onChange={(e) => setFormData({...formData, default_buffer_minutes: e.target.value})}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Capacidade Máxima</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                      placeholder="0 (ilimitado)"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Dias da Semana *</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant={formData.days_of_week.includes(index) ? 'default' : 'outline'}
                          onClick={() => {
                            setFormData((prev) => {
                              const newDays = prev.days_of_week.includes(index)
                                ? prev.days_of_week.filter((day) => day !== index)
                                : [...prev.days_of_week, index];
                              return { ...prev, days_of_week: newDays.sort((a,b) => a-b) };
                            });
                          }}
                          className={formData.days_of_week.includes(index) ? 'bg-[#A56A38] hover:bg-[#C47B3C] text-white' : 'border-[#A56A38] text-[#A56A38] hover:bg-[#FDF3EB]'}
                        >
                          {dayName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48]"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : editingShift ? 'Salvar Alterações' : 'Criar Turno'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {shifts.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum turno cadastrado</h3>
            <p className="text-gray-500 mb-4">Crie turnos para organizar as reservas</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Intervalo</TableHead>
                    <TableHead>Tempo Mesa</TableHead>
                    <TableHead>Buffer</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-semibold">{shift.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {shift.start_time} - {shift.end_time}
                        </div>
                      </TableCell>
                      <TableCell>{shift.slot_interval_minutes} min</TableCell>
                      <TableCell>{shift.default_dwell_minutes} min</TableCell>
                      <TableCell>{shift.default_buffer_minutes} min</TableCell>
                      <TableCell>{shift.max_capacity || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getDaysLabels(shift.days_of_week).map((day, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={shift.active ? "default" : "secondary"}>
                          {shift.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(shift)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(shift.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {shifts.map((shift) => (
                <Card key={shift.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{shift.name}</p>
                        <div className="space-y-1 mt-2 text-sm text-gray-600">
                          <p>⏰ {shift.start_time} - {shift.end_time}</p>
                          <p>📊 Intervalo: {shift.slot_interval_minutes}min</p>
                          <p>⏱️ Permanência: {shift.default_dwell_minutes}min</p>
                          <p>🔄 Buffer: {shift.default_buffer_minutes}min</p>
                          {shift.max_capacity && (
                            <p>👥 Capacidade: {shift.max_capacity}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getDaysLabels(shift.days_of_week).map((day, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEdit(shift)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(shift.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge variant={shift.active ? "default" : "secondary"}>
                      {shift.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}