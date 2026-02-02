import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExpenses, useMarkExpensePaid, Expense } from '@/hooks/useFinance';
import { Plus, Check, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateExpenseModal } from './CreateExpenseModal';
import { EditExpenseModal } from './EditExpenseModal';
import { MarkExpensePaidModal } from './MarkExpensePaidModal';

interface ExpensesTableProps {
  month?: number;
  year?: number;
}

export function ExpensesTable({ month, year }: ExpensesTableProps) {
  const { data: expenses, isLoading } = useExpenses({ month, year });
  const markPaid = useMarkExpensePaid();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Despesa excluída com sucesso' });
      setDeletingExpense(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir despesa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleMarkPaid = async (data: { payment_method: string; paid_at: string }) => {
    if (!payingExpense) return;
    
    try {
      await markPaid.mutateAsync({
        expenseId: payingExpense.id,
        payment_method: data.payment_method,
        paid_at: data.paid_at,
      });
      toast({ title: 'Despesa marcada como paga' });
      setPayingExpense(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao marcar despesa como paga',
        description: message,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {expenses && expenses.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{expense.description}</span>
                      <div className="flex gap-1">
                        {(expense.recurring || (expense.recurrence_rule && expense.recurrence_months)) && (
                          <Badge variant="outline" className="text-xs">
                            {expense.recurrence_months === 1 ? 'Mensal' :
                              expense.recurrence_months === 2 ? 'Bimestral' :
                              expense.recurrence_months === 3 ? 'Trimestral' :
                              expense.recurrence_months === 6 ? 'Semestral' :
                              expense.recurrence_months === 12 ? 'Anual' : 'Recorrente'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{expense.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={expense.type === 'fixed' ? 'secondary' : 'outline'}>
                      {expense.type === 'fixed' ? 'Fixa' : 'Variável'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    {expense.due_date
                      ? format(new Date(expense.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {expense.paid_at ? (
                      <div className="flex flex-col gap-1">
                        <Badge variant="default" className="bg-green-600">Pago</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(expense.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
                          {expense.payment_method && ` • ${
                            expense.payment_method === 'pix' ? 'PIX' :
                            expense.payment_method === 'dinheiro' ? 'Dinheiro' :
                            expense.payment_method === 'cartao_debito' ? 'Débito' :
                            expense.payment_method === 'cartao_credito' ? 'Crédito' :
                            expense.payment_method === 'boleto' ? 'Boleto' :
                            expense.payment_method === 'transferencia' ? 'Transf.' :
                            expense.payment_method === 'cheque' ? 'Cheque' :
                            expense.payment_method
                          }`}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-600 text-white">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!expense.paid_at && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Marcar como pago"
                          onClick={() => setPayingExpense(expense)}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => setEditingExpense(expense)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingExpense(expense)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma despesa cadastrada ainda.
        </div>
      )}

      <CreateExpenseModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <EditExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
      />

      <MarkExpensePaidModal
        expense={payingExpense}
        onClose={() => setPayingExpense(null)}
        onConfirm={handleMarkPaid}
        isPending={markPaid.isPending}
      />

      <AlertDialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa "{deletingExpense?.description}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
