import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useCreateExpense, useExpenseCategories, useCreateExpenseCategory } from '@/hooks/useFinance';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateExpenseModal({ open, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'fixed' | 'variable'>('variable');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState<number>(1);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const { data: categories, refetch: refetchCategories } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const createCategory = useCreateExpenseCategory();
  const { toast } = useToast();

  // Refetch categories quando o modal abrir
  useEffect(() => {
    if (open) {
      refetchCategories();
    }
  }, [open, refetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createExpense.mutateAsync({
        description,
        category_id: categoryId || null,
        type,
        amount: parseFloat(amount),
        due_date: dueDate || null,
        recurring,
        recurrence_rule: null,
        recurrence_months: recurring ? recurrenceMonths : null,
        payment_method: null,
        paid_at: null,
      });
      toast({ title: 'Despesa criada com sucesso' });
      resetForm();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar despesa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const created = await createCategory.mutateAsync(newCategory);
      setCategoryId(created.id);
      setNewCategory('');
      setShowNewCategory(false);
      toast({ title: 'Categoria criada' });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setDescription('');
    setCategoryId('');
    setType('variable');
    setAmount('');
    setDueDate('');
    setRecurring(false);
    setRecurrenceMonths(1);
    setNewCategory('');
    setShowNewCategory(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel do espaço"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categoria</Label>
              {!showNewCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCategory(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              )}
            </div>
            
            {showNewCategory ? (
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nome da nova categoria"
                />
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Criar'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategory('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma categoria. Clique em "+ Nova" para criar.
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'fixed' | 'variable')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixa</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">Despesa recorrente</Label>
              <Switch
                id="recurring"
                checked={recurring}
                onCheckedChange={setRecurring}
              />
            </div>
            
            {recurring && (
              <Select 
                value={recurrenceMonths.toString()} 
                onValueChange={(v) => setRecurrenceMonths(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mensal</SelectItem>
                  <SelectItem value="2">Bimestral</SelectItem>
                  <SelectItem value="3">Trimestral</SelectItem>
                  <SelectItem value="6">Semestral</SelectItem>
                  <SelectItem value="12">Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Despesa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
