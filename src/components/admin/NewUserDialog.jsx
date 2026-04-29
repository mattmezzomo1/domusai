import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { functionsService } from "@/services/api.service";
import { Mail, User, Copy, Check } from "lucide-react";

export default function NewUserDialog({ open, onOpenChange, onSuccess }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setCreatedAccount(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!email || !fullName) {
      alert("Preencha o e-mail e o nome completo");
      return;
    }

    setIsCreating(true);

    try {
      const result = await functionsService.invoke('create-freetrial-account', {
        email,
        full_name: fullName,
      });

      setCreatedAccount({
        email,
        fullName,
        temporaryPassword: result?.temporaryPassword || result?.data?.temporaryPassword,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Erro ao criar usuário: ' + (error?.message || 'erro desconhecido'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!createdAccount?.temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(createdAccount.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdAccount ? 'Usuário criado com sucesso' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {createdAccount
              ? 'A conta foi criada com 14 dias de trial. Compartilhe a senha temporária com o usuário.'
              : 'Crie uma nova conta com 14 dias de trial. Uma senha temporária será gerada.'}
          </DialogDescription>
        </DialogHeader>

        {createdAccount ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-gray-50 space-y-1 text-sm">
              <p><span className="font-medium text-gray-700">Nome:</span> {createdAccount.fullName}</p>
              <p><span className="font-medium text-gray-700">E-mail:</span> {createdAccount.email}</p>
            </div>

            {createdAccount.temporaryPassword && (
              <div className="space-y-2">
                <Label>Senha temporária</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={createdAccount.temporaryPassword}
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyPassword}>
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Salve esta senha agora — ela não será exibida novamente.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newuser-name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="newuser-name"
                  placeholder="Maria Silva"
                  className="pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newuser-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="newuser-email"
                  type="email"
                  placeholder="maria@exemplo.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-600 to-purple-700"
              >
                {isCreating ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
