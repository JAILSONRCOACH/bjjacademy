import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';

interface MonthlyData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

function useMonthlyFinancialData(months: number = 6) {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['monthly-financial-chart', profile?.academy_id, months],
        queryFn: async (): Promise<MonthlyData[]> => {
            const now = new Date();
            const result: MonthlyData[] = [];

            // Get data for the last N months
            for (let i = months - 1; i >= 0; i--) {
                const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const startOfMonth = targetDate.toISOString().split('T')[0];
                const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];

                const monthLabel = targetDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

                // Fetch revenue (paid invoices)
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('amount')
                    .eq('status', 'paid')
                    .gte('paid_at', `${startOfMonth}T00:00:00`)
                    .lte('paid_at', `${endOfMonth}T23:59:59`);

                // Fetch expenses (paid)
                const { data: expenses } = await supabase
                    .from('expenses')
                    .select('amount')
                    .not('paid_at', 'is', null)
                    .gte('paid_at', `${startOfMonth}T00:00:00`)
                    .lte('paid_at', `${endOfMonth}T23:59:59`);

                const revenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
                const expenseTotal = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

                result.push({
                    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                    revenue,
                    expenses: expenseTotal,
                    profit: revenue - expenseTotal,
                });
            }

            return result;
        },
        enabled: !!profile?.academy_id,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
}

const chartConfig = {
    revenue: {
        label: 'Receita',
        color: '#22c55e', // green-500
    },
    expenses: {
        label: 'Despesas',
        color: '#ef4444', // red-500
    },
    profit: {
        label: 'Lucro',
        color: '#3b82f6', // blue-500
    },
};

export function RevenueExpenseChart() {
    const { data, isLoading } = useMonthlyFinancialData(6);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Evolução Financeira
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Evolução Financeira (Últimos 6 meses)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10 }}
                            width={80}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => (
                                        <span className="font-semibold">
                                            {formatCurrency(Number(value))}
                                        </span>
                                    )}
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="revenue"
                            fill="var(--color-revenue)"
                            radius={[4, 4, 0, 0]}
                            name="revenue"
                        />
                        <Bar
                            dataKey="expenses"
                            fill="var(--color-expenses)"
                            radius={[4, 4, 0, 0]}
                            name="expenses"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
