import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Invoice, useMarkInvoicePaid } from '@/hooks/useFinance';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

export function MarkPaidModal({ invoice, onClose }: Props) {
  const [method, setMethod] = useState('pix');
  const { toast } = useToast();
  const markPaid = useMarkInvoicePaid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice) return;

    markPaid.mutate(
      {
        invoiceId: invoice.id,
        method,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Fatura baixada',
            description: 'Fatura marcada como paga com sucesso.',
          });
          onClose();
        },
        onError: (error) => {
          toast({
            title: 'Erro ao baixar fatura',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar Fatura como Paga</DialogTitle>
        </DialogHeader>

        {invoice && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Aluno:</span>{' '}
                <span className="font-medium">{invoice.student?.name}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Vencimento:</span>{' '}
                <span className="font-medium">
                  {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Valor:</span>{' '}
                <span className="font-medium text-lg">{formatCurrency(invoice.amount)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método de Pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={markPaid.isPending}>
                {markPaid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
