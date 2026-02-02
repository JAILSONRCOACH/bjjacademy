import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useCreateProfessorDirect } from '@/hooks/useWebhooks';
import { maskCPF, maskPhone, unmask, isValidCPF } from '@/lib/masks';
import { Check, Copy } from 'lucide-react';

interface CreateProfessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProfessorModal({ open, onOpenChange }: CreateProfessorModalProps) {
  const { toast } = useToast();
  const directMutation = useCreateProfessorDirect();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
  });

  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password?: string;
  } | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
    });
    setCreatedCredentials(null);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: maskCPF(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do professor.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, informe o email do professor.',
        variant: 'destructive',
      });
      return;
    }

    const cpfDigits = unmask(formData.cpf);
    if (cpfDigits && !isValidCPF(cpfDigits)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, informe um CPF válido.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      cpf: cpfDigits || undefined,
      phone: unmask(formData.phone) || undefined,
    };

    directMutation.mutate(payload, {
      onSuccess: (data) => {
        // Instead of closing immediately, show credentials
        if (data.credentials) {
          setCreatedCredentials(data.credentials);
        } else {
          // Fallback if no credentials returned (unlikely with current backend)
          onOpenChange(false);
          resetForm();
        }
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Tiny delay to reset form after modal closes
    setTimeout(resetForm, 300);
  };

  const isPending = directMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{createdCredentials ? 'Professor Criado!' : 'Novo Professor'}</DialogTitle>
        </DialogHeader>

        {createdCredentials ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">Sucesso!</h3>
              <p className="text-sm text-green-700">
                O professor foi cadastrado com sucesso.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
              <p className="text-sm text-blue-700">
                📧 As credenciais de acesso foram enviadas para:
              </p>
              <p className="font-medium text-blue-800 mt-1">{createdCredentials.email}</p>
            </div>

            <Button className="w-full" onClick={handleClose}>
              Concluir
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="professor@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Professor
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
