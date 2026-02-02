import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { maskCPF, maskPhone, unmask, isValidCPF } from '@/lib/masks';

interface Professor {
  id: string;
  name: string;
  email: string | null;
  cpf: string | null;
  phone: string | null;
}

interface EditProfessorModalProps {
  professor: Professor | null;
  onClose: () => void;
}

export function EditProfessorModal({ professor, onClose }: EditProfessorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
  });

  useEffect(() => {
    if (professor) {
      setFormData({
        name: professor.name,
        email: professor.email || '',
        cpf: professor.cpf ? maskCPF(professor.cpf) : '',
        phone: professor.phone ? maskPhone(professor.phone) : '',
      });
    }
  }, [professor]);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: maskCPF(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!professor) throw new Error('Professor não encontrado');

      const cpfDigits = unmask(data.cpf);
      if (cpfDigits && !isValidCPF(cpfDigits)) {
        throw new Error('CPF inválido');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email || null,
          cpf: cpfDigits || null,
          phone: unmask(data.phone) || null,
        })
        .eq('id', professor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast({
        title: 'Professor atualizado',
        description: 'Os dados do professor foram atualizados.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar professor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={!!professor} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Professor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="professor@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cpf">CPF</Label>
            <Input
              id="edit-cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
