
import React, { useState } from 'react';
import { restaurantService, customerService } from "@/services/api.service";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export default function AddCustomerDialog() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_whatsapp: '',
    email: '',
    birth_date: '', // Added birth_date field
    notes: ''
  });

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantService.list(),
    initialData: [],
  });

  // Ensure restaurant exists before accessing its properties.
  // In a real application, you might want to handle the case where no restaurants are found,
  // or prompt the user to create one, or select from a list if multiple exist.
  // For now, assuming at least one restaurant exists for simplicity based on the original code's implied logic.
  const restaurant = restaurants && restaurants.length > 0 ? restaurants[0] : null;

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!restaurant) {
        throw new Error("No restaurant available to associate with the customer.");
      }

      // Converter birth_date para ISO-8601 completo se fornecido
      const customerData = {
        ...data,
        restaurant_id: restaurant.id,
        birth_date: data.birth_date ? new Date(data.birth_date).toISOString() : null
      };

      return customerService.create(customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsOpen(false);
      // Reset formData including the new birth_date field
      setFormData({ full_name: '', phone_whatsapp: '', email: '', birth_date: '', notes: '' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!restaurant) {
      alert("No restaurant selected or available. Cannot create customer.");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#FA7318] to-[#f59e0c] hover:from-[#e66610] hover:to-[#dc8c08] text-white h-10 shadow-sm" disabled={!restaurant}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="João da Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_whatsapp">WhatsApp *</Label>
            <Input
              id="phone_whatsapp"
              value={formData.phone_whatsapp}
              onChange={(e) => setFormData({...formData, phone_whatsapp: e.target.value})}
              placeholder="(11) 98765-4321"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="joao@example.com"
            />
          </div>

          {/* New field for birth_date */}
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Preferências, restrições, etc."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !restaurant}>
              {createMutation.isPending ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
