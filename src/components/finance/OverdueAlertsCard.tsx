import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Hook to get ALL overdue items (not filtered by period)
function useOverdueItems() {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['overdue-items', profile?.academy_id],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];

            // Fetch overdue invoices (status = overdue OR past due date and still open)
            const { data: overdueInvoices, error: invError } = await supabase
                .from('invoices')
                .select('amount')
                .in('status', ['overdue', 'open'])
                .lt('due_date', today);

            if (invError) throw invError;

            // Fetch overdue expenses (unpaid and past due date)
            const { data: overdueExpenses, error: expError } = await supabase
                .from('expenses')
                .select('amount')
                .is('paid_at', null)
                .lt('due_date', today);

            if (expError) throw expError;

            const overdueInvoicesCount = overdueInvoices?.length || 0;
            const overdueInvoicesAmount = overdueInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

            const overdueExpensesCount = overdueExpenses?.length || 0;
            const overdueExpensesAmount = overdueExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

            return {
                overdueInvoicesCount,
                overdueInvoicesAmount,
                overdueExpensesCount,
                overdueExpensesAmount,
            };
        },
        enabled: !!profile?.academy_id,
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function OverdueAlertsCard() {
    const { data: stats, isLoading } = useOverdueItems();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const totalOverdue = (stats?.overdueInvoicesCount || 0) + (stats?.overdueExpensesCount || 0);
    const totalOverdueAmount = (stats?.overdueInvoicesAmount || 0) + (stats?.overdueExpensesAmount || 0);

    if (isLoading) {
        return (
            <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                </CardContent>
            </Card>
        );
    }

    // Don't show if nothing is overdue
    if (totalOverdue === 0) {
        return null;
    }

    return (
        <Card className="border-red-300 bg-red-50 shadow-md dark:bg-red-900/20 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300">Atenção Necessária</span>
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40">
                    <Link to="/admin/financeiro">
                        Ver Detalhes
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Faturas (Receitas) */}
                    {(stats?.overdueInvoicesCount || 0) > 0 && (
                        <div className="flex flex-col border-l-4 border-orange-500 pl-3">
                            <span className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-400">
                                A Receber (Atrasado)
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {stats?.overdueInvoicesCount}
                                </span>
                                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                    faturas
                                </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Valor: {formatCurrency(stats?.overdueInvoicesAmount || 0)}
                            </span>
                        </div>
                    )}

                    {/* Despesas (Pagamentos) */}
                    {(stats?.overdueExpensesCount || 0) > 0 && (
                        <div className="flex flex-col border-l-4 border-red-500 pl-3">
                            <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
                                A Pagar (Atrasado)
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {stats?.overdueExpensesCount}
                                </span>
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    despesas
                                </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Valor: {formatCurrency(stats?.overdueExpensesAmount || 0)}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
