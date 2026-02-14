import React, { useState, useEffect } from 'react';
import { customerService } from "@/services/api.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EditCustomerDialog({ customer }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_whatsapp: '',
    email: '',
    birth_date: '',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name || '',
        phone_whatsapp: customer.phone_whatsapp || '',
        email: customer.email || '',
        birth_date: customer.birth_date || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      // Converter birth_date para ISO-8601 completo se fornecido
      const customerData = {
        ...data,
        birth_date: data.birth_date ? new Date(data.birth_date).toISOString() : null
      };
      return customerService.update(customer.id, customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.delete(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsOpen(false);
      navigate(createPageUrl('Customers'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#C47B3C] to-[#A56A38] hover:from-[#D48B4C] hover:to-[#B57A48]">
          <Pencil className="w-4 h-4 mr-2" />
          Editar Informações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4 p-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                <strong>⚠️ Atenção!</strong> Esta ação não pode ser desfeita. 
                Todas as reservas deste cliente permanecerão no sistema, mas ele será removido do CRM.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        ) : (
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

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Cliente
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}