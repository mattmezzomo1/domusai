import React, { useState } from 'react';
import { restaurantService, environmentService, tableService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users, Pencil, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TablesSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ name: '', seats: '', environment_id: '' });
  
  // Bulk creation state
  const [bulkSeats, setBulkSeats] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkEnvironmentId, setBulkEnvironmentId] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState(null);
  
  // Multiple selection state
  const [selectedTables, setSelectedTables] = useState([]);

  // Inline editing state
  const [editingTableId, setEditingTableId] = useState(null);
  const [editingTableName, setEditingTableName] = useState('');

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  const restaurant = restaurants[0];

  const { data: environments } = useQuery({
    queryKey: ['environments', restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return [];
      return await environmentService.filter({ restaurant_id: restaurant.id });
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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await authService.me();
      return tableService.create({
        ...data,
        restaurant_id: restaurant.id,
        owner_email: user.email,
        seats: parseInt(data.seats)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsDialogOpen(false);
      setFormData({ name: '', seats: '', environment_id: '' });
      setEditingTable(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tableService.update(id, {
      ...data,
      seats: parseInt(data.seats)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsDialogOpen(false);
      setFormData({ name: '', seats: '', environment_id: '' });
      setEditingTable(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tableService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => tableService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const updateEnvironmentMutation = useMutation({
    mutationFn: ({ id, environment_id }) => tableService.update(id, { environment_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ id, name }) => tableService.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setEditingTableId(null);
      setEditingTableName('');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => tableService.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setSelectedTables([]);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (tablesData) => {
      const user = await authService.me();
      const dataWithOwner = tablesData.map(t => ({ ...t, owner_email: user.email }));
      // Criar mesas uma por uma (não temos bulkCreate na nova API)
      return await Promise.all(dataWithOwner.map(t => tableService.create(t)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setBulkSeats('');
      setBulkQuantity('');
      setBulkEnvironmentId('');
      setBulkSuccess('Mesas criadas com sucesso!');
      setTimeout(() => setBulkSuccess(null), 3000);
    },
  });

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      seats: table.seats.toString(),
      environment_id: table.environment_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getEnvironmentName = (envId) => {
    const env = environments.find(e => e.id === envId);
    return env?.name || '-';
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-800 border-green-200",
      unavailable: "bg-gray-100 text-gray-800 border-gray-200",
      blocked: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || colors.available;
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: "Disponível",
      unavailable: "Indisponível",
      blocked: "Bloqueada"
    };
    return labels[status] || "Disponível";
  };

  const handleBulkCreate = (e) => {
    e.preventDefault();
    if (!bulkSeats || !bulkQuantity) return;

    const quantity = parseInt(bulkQuantity);
    const seats = parseInt(bulkSeats);

    // Get the highest number from existing tables
    const existingNumbers = tables
      .map(t => {
        const match = t.name.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter(n => !isNaN(n));

    const startNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    // Create array of tables
    const newTables = Array.from({ length: quantity }, (_, index) => ({
      restaurant_id: restaurant.id,
      name: `Mesa ${startNumber + index}`,
      seats: seats,
      status: 'available',
      is_active: true,
      environment_id: bulkEnvironmentId && bulkEnvironmentId !== 'none' ? bulkEnvironmentId : null
    }));

    bulkCreateMutation.mutate(newTables);
  };

  const toggleSelectTable = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map(t => t.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTables.length === 0) return;
    if (confirm(`Tem certeza que deseja excluir ${selectedTables.length} mesa(s)?`)) {
      bulkDeleteMutation.mutate(selectedTables);
    }
  };

  const startEditingName = (table) => {
    setEditingTableId(table.id);
    setEditingTableName(table.name);
  };

  const cancelEditingName = () => {
    setEditingTableId(null);
    setEditingTableName('');
  };

  const saveTableName = (tableId) => {
    if (!editingTableName.trim()) {
      alert('O nome da mesa não pode estar vazio');
      return;
    }
    updateNameMutation.mutate({ id: tableId, name: editingTableName.trim() });
  };

  const handleNameKeyPress = (e, tableId) => {
    if (e.key === 'Enter') {
      saveTableName(tableId);
    } else if (e.key === 'Escape') {
      cancelEditingName();
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
              <Users className="w-5 h-5 text-[#A56A38]" />
              Mesas
            </CardTitle>
            <CardDescription>Configure as mesas do seu restaurante</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTable(null);
              setFormData({ name: '', seats: '', environment_id: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48] w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTable ? 'Editar Mesa' : 'Adicionar Mesa'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table-name">Identificador da Mesa *</Label>
                  <Input
                    id="table-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: M01, Janela-2"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Número de Lugares *</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    value={formData.seats}
                    onChange={(e) => setFormData({...formData, seats: e.target.value})}
                    placeholder="Ex: 4"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente (opcional)</Label>
                  <Select
                    value={formData.environment_id}
                    onValueChange={(value) => setFormData({...formData, environment_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.map((env) => (
                        <SelectItem key={env.id} value={env.id}>
                          {env.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : editingTable ? 'Salvar Alterações' : 'Criar Mesa'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {/* Bulk Creation Section */}
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Criação Rápida de Mesas
            </CardTitle>
            <CardDescription>
              Crie múltiplas mesas de uma só vez. Elas serão criadas com nomes padrão (Mesa 1, Mesa 2...) 
              e podem ser editadas depois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-seats">Lugares por Mesa</Label>
                  <Input
                    id="bulk-seats"
                    type="number"
                    min="1"
                    value={bulkSeats}
                    onChange={(e) => setBulkSeats(e.target.value)}
                    placeholder="Ex: 4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-quantity">Quantidade de Mesas</Label>
                  <Input
                    id="bulk-quantity"
                    type="number"
                    min="1"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-environment">Ambiente (Opcional)</Label>
                  <Select value={bulkEnvironmentId} onValueChange={setBulkEnvironmentId}>
                    <SelectTrigger id="bulk-environment">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem ambiente</SelectItem>
                      {environments.map((env) => (
                        <SelectItem key={env.id} value={env.id}>
                          {env.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!bulkSeats || !bulkQuantity || bulkCreateMutation.isPending}
                  >
                    {bulkCreateMutation.isPending ? 'Criando...' : 'Criar Mesas'}
                  </Button>
                </div>
              </div>
              {bulkSeats && bulkQuantity && (
                <p className="text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
                  💡 Serão criadas <strong>{bulkQuantity} mesas</strong> com <strong>{bulkSeats} lugares</strong> cada
                  {bulkEnvironmentId && bulkEnvironmentId !== 'none' && environments.find(e => e.id === bulkEnvironmentId) && (
                    <>, no ambiente <strong>{environments.find(e => e.id === bulkEnvironmentId).name}</strong></>
                  )},
                  nomeadas como: Mesa {tables.length + 1}, Mesa {tables.length + 2}, etc.
                </p>
              )}
              {bulkSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    ✓ {bulkSuccess}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {tables.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma mesa cadastrada</h3>
            <p className="text-gray-500 mb-4">Adicione mesas para começar a receber reservas</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedTables.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  {selectedTables.length} mesa(s) selecionada(s)
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {bulkDeleteMutation.isPending ? 'Excluindo...' : 'Excluir Selecionadas'}
                </Button>
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedTables.length === tables.length && tables.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Lugares</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.id} className="group">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table.id)}
                          onChange={() => toggleSelectTable(table.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        {editingTableId === table.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingTableName}
                              onChange={(e) => setEditingTableName(e.target.value)}
                              onKeyDown={(e) => handleNameKeyPress(e, table.id)}
                              className="h-8 w-40"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveTableName(table.id)}
                              disabled={updateNameMutation.isPending}
                              className="h-8 px-2"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditingName}
                              className="h-8 px-2"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{table.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingName(table)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{table.seats}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={table.environment_id || "none"}
                          onValueChange={(value) => updateEnvironmentMutation.mutate({ 
                            id: table.id, 
                            environment_id: value === "none" ? null : value 
                          })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Sem ambiente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem ambiente</SelectItem>
                            {environments.map((env) => (
                              <SelectItem key={env.id} value={env.id}>
                                {env.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={table.status?.toLowerCase() || "available"}
                          onValueChange={(value) => updateStatusMutation.mutate({ id: table.id, status: value })}
                        >
                          <SelectTrigger className={`w-32 ${getStatusColor(table.status?.toLowerCase())}`}>
                            <SelectValue placeholder={getStatusLabel(table.status?.toLowerCase())} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponível</SelectItem>
                            <SelectItem value="unavailable">Indisponível</SelectItem>
                            <SelectItem value="blocked">Bloqueada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEdit(table)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(table.id)}
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
              {tables.map((table) => (
                <Card key={table.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table.id)}
                          onChange={() => toggleSelectTable(table.id)}
                          className="w-4 h-4 mt-1 cursor-pointer"
                        />
                        <div className="flex-1">
                          {editingTableId === table.id ? (
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                value={editingTableName}
                                onChange={(e) => setEditingTableName(e.target.value)}
                                onKeyDown={(e) => handleNameKeyPress(e, table.id)}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => saveTableName(table.id)}
                                disabled={updateNameMutation.isPending}
                                className="h-8 px-2"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingName}
                                className="h-8 px-2"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-lg">{table.name}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingName(table)}
                                className="h-6 w-6 p-0"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{table.seats} lugares</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEdit(table)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(table.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Ambiente</Label>
                      <Select
                        value={table.environment_id || "none"}
                        onValueChange={(value) => updateEnvironmentMutation.mutate({ 
                          id: table.id, 
                          environment_id: value === "none" ? null : value 
                        })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sem ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem ambiente</SelectItem>
                          {environments.map((env) => (
                            <SelectItem key={env.id} value={env.id}>
                              {env.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label className="text-xs text-gray-600">Status</Label>
                      <Select
                        value={table.status?.toLowerCase() || "available"}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: table.id, status: value })}
                      >
                        <SelectTrigger className={`w-full ${getStatusColor(table.status?.toLowerCase())}`}>
                          <SelectValue placeholder={getStatusLabel(table.status?.toLowerCase())} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="unavailable">Indisponível</SelectItem>
                          <SelectItem value="blocked">Bloqueada</SelectItem>
                        </SelectContent>
                      </Select>
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