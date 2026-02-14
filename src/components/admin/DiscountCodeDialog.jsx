import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Percent, Calendar } from "lucide-react";

export default function DiscountCodeDialog({ open, onOpenChange, onSuccess }) {
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!code || !discountPercent) {
      alert("Preencha o código e a porcentagem de desconto");
      return;
    }

    setIsCreating(true);

    try {
      const response = await base44.functions.invoke('admin-create-discount-code', {
        code: code,
        discountPercent: parseInt(discountPercent),
        durationMonths: durationMonths ? parseInt(durationMonths) : null
      });

      if (response.data.success) {
        alert(response.data.message);
        setCode("");
        setDiscountPercent("");
        setDurationMonths("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      alert('Erro ao criar código de desconto: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Código de Desconto</DialogTitle>
          <DialogDescription>
            Crie um código promocional para oferecer descontos aos usuários
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código Promocional</Label>
            <Input
              id="code"
              placeholder="PROMOCAO2024"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Porcentagem de Desconto (%)</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                placeholder="50"
                className="pl-10"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (meses - opcional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="Deixe vazio para desconto único"
                className="pl-10"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              Se não especificar, o desconto será aplicado apenas na primeira cobrança
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              {isCreating ? 'Criando...' : 'Criar Código'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}