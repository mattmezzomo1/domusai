import React, { useState } from 'react';
import { restaurantService, environmentService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Layers, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil } from "lucide-react";

export default function EnvironmentsSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: '' });
  const [editingEnv, setEditingEnv] = useState(null); // New state for editing

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const { data: environments, isLoading } = useQuery({
    queryKey: ['environments', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await environmentService.filter({ restaurant_id: restaurant.id });
    },
    enabled: !!restaurant,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await authService.me();
      return environmentService.create({
        ...data,
        restaurant_id: restaurant.id,
        owner_email: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      setIsDialogOpen(false);
      setFormData({ name: '', capacity: '' });
    },
  });

  const updateMutation = useMutation({ // New update mutation
    mutationFn: ({ id, data }) => environmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      setIsDialogOpen(false);
      setFormData({ name: '', capacity: '' });
      setEditingEnv(null); // Clear editing state after successful update
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => environmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => environmentService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
    },
  });

  const handleEdit = (env) => { // New function to handle edit action
    setEditingEnv(env);
    setFormData({ name: env.name, capacity: env.capacity !== null ? env.capacity : '' }); // Populate form for editing
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const capacityValue = formData.capacity ? parseInt(formData.capacity) : null;

    if (editingEnv) {
      updateMutation.mutate({
        id: editingEnv.id,
        data: {
          name: formData.name,
          capacity: capacityValue
        }
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        capacity: capacityValue
      });
    }
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
              <Layers className="w-5 h-5 text-[#A56A38]" />
              Ambientes
            </CardTitle>
            <CardDescription>Gerencie os ambientes do restaurante (Salão, Deck, etc.)</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingEnv(null);
              setFormData({ name: '', capacity: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Ambiente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEnv ? 'Editar Ambiente' : 'Adicionar Ambiente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="env-name">Nome do Ambiente *</Label>
                  <Input
                    id="env-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Salão Principal, Deck, Mezanino"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade Total (opcional)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    placeholder="Número máximo de pessoas"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingEnv(null); // Clear editing state on cancel
                    setFormData({ name: '', capacity: '' }); // Reset form data on cancel
                  }}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' :
                     editingEnv ? 'Salvar Alterações' : 'Criar Ambiente'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {environments.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum ambiente cadastrado</h3>
            <p className="text-gray-500 mb-4">Comece adicionando ambientes ao seu restaurante</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {environments.map((env) => (
                    <TableRow key={env.id}>
                      <TableCell className="font-semibold">{env.name}</TableCell>
                      <TableCell>{env.capacity || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={env.is_active ? "default" : "secondary"}>
                          {env.is_active ? 'Ativo' : 'Inativo'}
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
                            <DropdownMenuItem onClick={() => handleEdit(env)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActiveMutation.mutate({
                                id: env.id,
                                is_active: !env.is_active
                              })}
                            >
                              {env.is_active ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(env.id)}
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
              {environments.map((env) => (
                <Card key={env.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{env.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Capacidade: {env.capacity || '-'}
                        </p>
                        <Badge variant={env.is_active ? "default" : "secondary"} className="mt-2">
                          {env.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEdit(env)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActiveMutation.mutate({
                              id: env.id,
                              is_active: !env.is_active
                            })}
                          >
                            {env.is_active ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(env.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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