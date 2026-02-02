
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Invoice } from '@/hooks/useFinance';

interface ConfirmPaymentModalProps {
    invoice: Invoice | null;
    onClose: () => void;
}

export function ConfirmPaymentModal({ invoice, onClose }: ConfirmPaymentModalProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const payMutation = useMutation({
        mutationFn: async () => {
            if (!invoice) return;

            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'paid',
                    paid_at: new Date(date).toISOString(),
                    payment_method: method,
                    provider_status: 'paid_manual'
                })
                .eq('id', invoice.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['student-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });

            toast({ title: 'Pagamento confirmado com sucesso!' });
            onClose();
        },
        onError: (error) => {
            toast({
                title: 'Erro ao confirmar pagamento',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleConfirm = () => {
        if (!method) {
            toast({
                title: 'Selecione a forma de pagamento',
                variant: 'destructive',
            });
            return;
        }
        payMutation.mutate();
    };

    return (
        <Dialog open={!!invoice} onOpenChange={() => onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Pagamento</DialogTitle>
                    <DialogDescription>
                        Informe os detalhes do pagamento manual para {invoice?.student?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Data do Pagamento</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="method">Forma de Pagamento</Label>
                        <Select value={method} onValueChange={setMethod}>
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

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={payMutation.isPending}>
                        {payMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Confirmar Pagamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
