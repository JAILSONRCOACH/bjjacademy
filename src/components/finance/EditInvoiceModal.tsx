import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/hooks/useFinance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function EditInvoiceModal({ invoice, onClose }: EditInvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    due_date: '',
    amount: 0,
    status: 'open' as 'open' | 'paid' | 'overdue' | 'canceled',
    notes: '',
    paid_at: '',
    payment_method: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        due_date: invoice.due_date,
        amount: invoice.amount,
        status: invoice.status,
        notes: invoice.notes || '',
        paid_at: invoice.paid_at ? invoice.paid_at.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: invoice.payment_method || '',
      });
    }
  }, [invoice]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!invoice) throw new Error('Fatura não encontrada');

      const { error } = await supabase
        .from('invoices')
        .update({
          due_date: data.due_date,
          amount: data.amount,
          status: data.status,
          notes: data.notes || null,
          paid_at: data.status === 'paid' ? new Date(data.paid_at).toISOString() : null,
          payment_method: data.status === 'paid' ? data.payment_method : null,
        })
        .eq('id', invoice.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Fatura atualizada',
        description: 'A fatura foi atualizada com sucesso.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar fatura',
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
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Fatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Aluno: <span className="font-medium text-foreground">{invoice?.student?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Em aberto</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'paid' && (
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="paid_at">Data Pagamento *</Label>
                <Input
                  id="paid_at"
                  type="date"
                  value={formData.paid_at}
                  onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma Pagto *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro 💵</SelectItem>
                    <SelectItem value="pix">Pix (Manual) 💠</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito 💳</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito 💳</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária 🏦</SelectItem>
                    <SelectItem value="boleto">Boleto (Externo) 📄</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a fatura..."
              rows={3}
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
