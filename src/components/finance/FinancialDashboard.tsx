import { useState, useMemo } from 'react';
import { useFinancialDashboard } from '@/hooks/useFinance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
    DollarSign,
    TrendingDown,
    Activity,
    CalendarDays,
    Loader2,
    PiggyBank,
    BarChart3,
    AlertTriangle
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type PeriodFilter = 'today' | '7days' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'lastYear';

interface DateRange {
    startDate: string;
    endDate: string;
    label: string;
    chartMonths: number;
}

function getDateRange(period: PeriodFilter): DateRange {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (period) {
        case 'today':
            return { startDate: today, endDate: today, label: 'Hoje', chartMonths: 1 };

        case '7days': {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            return {
                startDate: sevenDaysAgo.toISOString().split('T')[0],
                endDate: today,
                label: 'Últimos 7 dias',
                chartMonths: 1
            };
        }

        case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: startOfMonth.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                label: 'Este Mês',
                chartMonths: 1
            };
        }

        case 'lastMonth': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                startDate: startOfLastMonth.toISOString().split('T')[0],
                endDate: endOfLastMonth.toISOString().split('T')[0],
                label: 'Mês Anterior',
                chartMonths: 1
            };
        }

        case 'quarter': {
            const startOfQuarter = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: startOfQuarter.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                label: 'Últimos 3 meses',
                chartMonths: 3
            };
        }

        case 'year': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            return {
                startDate: startOfYear.toISOString().split('T')[0],
                endDate: endOfYear.toISOString().split('T')[0],
                label: 'Este Ano',
                chartMonths: 12
            };
        }

        case 'lastYear': {
            const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
            return {
                startDate: startOfLastYear.toISOString().split('T')[0],
                endDate: endOfLastYear.toISOString().split('T')[0],
                label: 'Ano Anterior',
                chartMonths: 12
            };
        }

        default:
            return { startDate: today, endDate: today, label: 'Hoje', chartMonths: 1 };
    }
}

// Hook to get ALL overdue items (not filtered by period)
function useOverdueGlobal() {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['overdue-global', profile?.academy_id],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];

            // Fetch overdue invoices
            const { data: overdueInvoices, error: invError } = await supabase
                .from('invoices')
                .select('amount')
                .in('status', ['overdue', 'open'])
                .lt('due_date', today);

            if (invError) throw invError;

            // Fetch overdue expenses
            const { data: overdueExpenses, error: expError } = await supabase
                .from('expenses')
                .select('amount')
                .is('paid_at', null)
                .lt('due_date', today);

            if (expError) throw expError;

            return {
                overdueInvoicesCount: overdueInvoices?.length || 0,
                overdueExpensesCount: overdueExpenses?.length || 0,
                overdueInvoicesAmount: overdueInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
                overdueExpensesAmount: overdueExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0,
            };
        },
        enabled: !!profile?.academy_id,
        refetchInterval: 60000,
    });
}

// Hook for chart data based on date range
function useChartData(startDate: string, endDate: string) {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['financial-chart', profile?.academy_id, startDate, endDate],
        queryFn: async () => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const result: { month: string; revenue: number; expenses: number }[] = [];

            // Calculate months between start and end
            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

            while (current <= endMonth) {
                const startOfMonth = current.toISOString().split('T')[0];
                const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).toISOString().split('T')[0];
                const monthLabel = current.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

                // Fetch revenue
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('amount')
                    .eq('status', 'paid')
                    .gte('paid_at', `${startOfMonth}T00:00:00`)
                    .lte('paid_at', `${endOfMonth}T23:59:59`);

                // Fetch expenses
                const { data: expenses } = await supabase
                    .from('expenses')
                    .select('amount')
                    .not('paid_at', 'is', null)
                    .gte('paid_at', `${startOfMonth}T00:00:00`)
                    .lte('paid_at', `${endOfMonth}T23:59:59`);

                result.push({
                    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                    revenue: invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
                    expenses: expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0,
                });

                current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            }

            return result;
        },
        enabled: !!profile?.academy_id,
        staleTime: 2 * 60 * 1000,
    });
}

const chartConfig = {
    revenue: { label: 'Receita', color: '#22c55e' },
    expenses: { label: 'Despesas', color: '#ef4444' },
};

export function FinancialDashboard() {
    const [period, setPeriod] = useState<PeriodFilter>('month');
    const dateRange = useMemo(() => getDateRange(period), [period]);

    const { data: stats, isLoading: statsLoading } = useFinancialDashboard({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    const { data: overdueStats } = useOverdueGlobal();

    const { data: chartData, isLoading: chartLoading } = useChartData(
        dateRange.startDate,
        dateRange.endDate
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatCurrencyShort = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const isLoading = statsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const receivedRevenue = stats?.receivedRevenue || 0;
    const paidExpenses = stats?.paidExpenses || 0;
    const grossProfit = stats?.grossProfit || 0;
    const netProfit = stats?.netProfit || 0;
    const netMargin = stats?.netMargin || 0;

    return (
        <div className="space-y-4">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-lg">Resumo Financeiro</span>
                </div>
                <Select value={period} onValueChange={(value: PeriodFilter) => setPeriod(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">📅 Hoje</SelectItem>
                        <SelectItem value="7days">📆 Últimos 7 dias</SelectItem>
                        <SelectItem value="month">📊 Este Mês</SelectItem>
                        <SelectItem value="lastMonth">⏪ Mês Anterior</SelectItem>
                        <SelectItem value="quarter">📈 Últimos 3 meses</SelectItem>
                        <SelectItem value="year">🗓️ Este Ano</SelectItem>
                        <SelectItem value="lastYear">⏮️ Ano Anterior</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Recebida</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-500">
                            {formatCurrency(receivedRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">{dateRange.label}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-500">
                            {formatCurrency(paidExpenses)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Fixas: {formatCurrency(stats?.fixedExpenses || 0)} | Var: {formatCurrency(stats?.variableExpenses || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
                            {formatCurrency(grossProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground">Receita - Variáveis</p>
                    </CardContent>
                </Card>

                <Card className={netProfit >= 0 ? "border-green-200 bg-green-50/50 dark:bg-green-900/20" : "border-red-200 bg-red-50/50 dark:bg-red-900/20"}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                        <Activity className={netProfit >= 0 ? "h-4 w-4 text-green-600" : "h-4 w-4 text-red-600"} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {formatCurrency(netProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground">Margem: {netMargin.toFixed(1)}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats + Chart */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Mini Stats */}
                <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-3">
                        <Card className="bg-muted/30">
                            <CardContent className="pt-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">A Receber</span>
                                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                                        {formatCurrency(stats?.openRevenue || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="pt-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">A Pagar</span>
                                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                                        {formatCurrency(stats?.unpaidExpenses || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="pt-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Projeção</span>
                                    <span className={`font-semibold ${(stats?.projectedNetProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(stats?.projectedNetProfit || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overdue Alerts within stats (using global overdue stats) */}
                    {/* Overdue Alerts within stats (using global overdue stats) */}
                    {(overdueStats?.overdueInvoicesCount || 0) > 0 && (
                        <Card className="border-orange-300 bg-orange-100 dark:bg-orange-900/30">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        <span className="text-orange-800 dark:text-orange-200 font-medium text-sm">A Receber (Atrasado)</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-orange-800 dark:text-orange-200">
                                            {formatCurrency(overdueStats?.overdueInvoicesAmount || 0)}
                                        </div>
                                        <div className="text-xs text-orange-700 dark:text-orange-300">
                                            {overdueStats?.overdueInvoicesCount} faturas
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {(overdueStats?.overdueExpensesCount || 0) > 0 && (
                        <Card className="border-red-300 bg-red-100 dark:bg-red-900/30">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <span className="text-red-800 dark:text-red-200 font-medium text-sm">A Pagar (Atrasado)</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-800 dark:text-red-200">
                                            {formatCurrency(overdueStats?.overdueExpensesAmount || 0)}
                                        </div>
                                        <div className="text-xs text-red-700 dark:text-red-300">
                                            {overdueStats?.overdueExpensesCount} despesas
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Receita vs Despesas ({dateRange.label})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartLoading ? (
                            <div className="flex items-center justify-center h-[200px]">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : chartData && chartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={70} />
                                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="revenue" />
                                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} name="expenses" />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                Sem dados para o período
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
