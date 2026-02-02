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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSubscription, usePlans } from '@/hooks/useFinance';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function CreateSubscriptionModal({ open, onClose, studentId, studentName }: Props) {
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [graceDays, setGraceDays] = useState('3');

  const { data: plans } = usePlans();
  const createSubscription = useCreateSubscription();
  const { toast } = useToast();

  const activePlans = plans?.filter((p) => p.is_active) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSubscription.mutateAsync({
        studentId,
        planId,
        startDate,
        graceDays: parseInt(graceDays),
      });
      toast({ title: 'Assinatura criada com sucesso!' });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const selectedPlan = plans?.find((p) => p.id === planId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Assinatura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Aluno</p>
            <p className="font-medium">{studentName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plano</Label>
            <Select value={planId} onValueChange={setPlanId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {formatCurrency(plan.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <div className="bg-primary/10 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{selectedPlan.name}</p>
              <p className="text-2xl font-bold">{formatCurrency(selectedPlan.price)}</p>
              {selectedPlan.description && (
                <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graceDays">Dias de Tolerância</Label>
              <Input
                id="graceDays"
                type="number"
                min="0"
                max="30"
                value={graceDays}
                onChange={(e) => setGraceDays(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSubscription.isPending || !planId}>
              {createSubscription.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Assinatura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
