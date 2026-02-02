import { useState, useMemo } from 'react';
import { useFinancialDashboard } from '@/hooks/useFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    CalendarDays,
    Loader2,
    PiggyBank,
    Wallet
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type PeriodFilter = 'today' | '7days' | 'month' | 'lastMonth' | 'year' | 'lastYear';

function getDateRange(period: PeriodFilter): { startDate: string; endDate: string; label: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (period) {
        case 'today':
            return { startDate: today, endDate: today, label: 'Hoje' };

        case '7days': {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            return {
                startDate: sevenDaysAgo.toISOString().split('T')[0],
                endDate: today,
                label: 'Últimos 7 dias'
            };
        }

        case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                startDate: startOfMonth.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                label: 'Este Mês'
            };
        }

        case 'lastMonth': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                startDate: startOfLastMonth.toISOString().split('T')[0],
                endDate: endOfLastMonth.toISOString().split('T')[0],
                label: 'Mês Anterior'
            };
        }

        case 'year': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            return {
                startDate: startOfYear.toISOString().split('T')[0],
                endDate: endOfYear.toISOString().split('T')[0],
                label: 'Este Ano'
            };
        }

        case 'lastYear': {
            const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
            return {
                startDate: startOfLastYear.toISOString().split('T')[0],
                endDate: endOfLastYear.toISOString().split('T')[0],
                label: 'Ano Anterior'
            };
        }

        default:
            return { startDate: today, endDate: today, label: 'Hoje' };
    }
}

export function FinancialSummary() {
    const [period, setPeriod] = useState<PeriodFilter>('month');

    const dateRange = useMemo(() => getDateRange(period), [period]);

    const { data: stats, isLoading } = useFinancialDashboard({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

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
                        <SelectItem value="year">📈 Este Ano</SelectItem>
                        <SelectItem value="lastYear">⏮️ Ano Anterior</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Receita */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Recebida</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(receivedRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dateRange.label}
                        </p>
                    </CardContent>
                </Card>

                {/* Despesas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                            {formatCurrency(paidExpenses)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Fixas: {formatCurrency(stats?.fixedExpenses || 0)} | Variáveis: {formatCurrency(stats?.variableExpenses || 0)}
                        </p>
                    </CardContent>
                </Card>

                {/* Lucro Bruto */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            {formatCurrency(grossProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Receita - Custos Variáveis
                        </p>
                    </CardContent>
                </Card>

                {/* Lucro Líquido */}
                <Card className={netProfit >= 0 ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                        <Activity className={netProfit >= 0 ? "h-4 w-4 text-green-600" : "h-4 w-4 text-red-600"} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(netProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Margem: {netMargin.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">A Receber</span>
                            <span className="font-semibold text-orange-600">
                                {formatCurrency(stats?.openRevenue || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">A Pagar</span>
                            <span className="font-semibold text-orange-600">
                                {formatCurrency(stats?.unpaidExpenses || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Projeção Líquida</span>
                            <span className={`font-semibold ${(stats?.projectedNetProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats?.projectedNetProfit || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Overdue Alerts */}
            {((stats?.overdueInvoicesCount || 0) > 0 || (stats?.overdueExpensesCount || 0) > 0) && (
                <Card className="border-red-300 bg-red-50/50">
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-red-600 font-medium">⚠️ Contas Vencidas:</span>
                            </div>
                            <div className="flex flex-wrap gap-6">
                                {(stats?.overdueInvoicesCount || 0) > 0 && (
                                    <div className="text-center">
                                        <span className="text-lg font-bold text-red-700">{stats?.overdueInvoicesCount}</span>
                                        <span className="text-xs text-red-600 ml-1">faturas ({formatCurrency(stats?.overdueInvoicesAmount || 0)})</span>
                                    </div>
                                )}
                                {(stats?.overdueExpensesCount || 0) > 0 && (
                                    <div className="text-center">
                                        <span className="text-lg font-bold text-red-700">{stats?.overdueExpensesCount}</span>
                                        <span className="text-xs text-red-600 ml-1">despesas ({formatCurrency(stats?.overdueExpensesAmount || 0)})</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
