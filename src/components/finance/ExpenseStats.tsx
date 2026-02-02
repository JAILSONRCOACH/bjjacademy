import { useExpenseStats } from '@/hooks/useFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface ExpenseStatsProps {
  month?: number;
  year?: number;
}

export function ExpenseStats({ month, year }: ExpenseStatsProps) {
  const { data: stats } = useExpenseStats({ month, year });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total (Mês)</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.totalMonth || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Despesas do mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recorrentes</CardTitle>
          <RefreshCw className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats?.totalRecurring || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Despesas fixas mensais
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.totalPaid || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Já quitadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats?.totalOverdue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.countOverdue || 0} despesas atrasadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A Vencer</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats?.totalPending || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.countPending || 0} despesas pendentes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
