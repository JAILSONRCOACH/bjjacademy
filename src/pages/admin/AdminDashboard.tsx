import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingDown,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FinancialDashboard } from '@/components/finance/FinancialDashboard';
import { OverdueAlertsCard } from '@/components/finance/OverdueAlertsCard';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalProfessors: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  pendingPromotions: number;
  todayAttendance: number;
}

function useDashboardStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin-dashboard-stats', profile?.academy_id],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        studentsResult,
        professorsResult,
        monthlyInvoicesResult, // Renamed to emphasize it's for monthly stats
        monthlyExpensesResult,
        promotionsResult,
        attendanceResult,
        // New global queries
        globalOpenInvoicesResult,
        globalOverdueInvoicesResult
      ] = await Promise.all([
        supabase.from('students').select('id, status'),
        supabase.from('profiles').select('id').eq('role', 'professor'),
        // Monthly financial data for Revenue/Expense cards
        supabase.from('invoices').select('status, amount, paid_at').gte('paid_at', `${startOfMonth}T00:00:00`),
        supabase.from('expenses').select('amount, paid_at').gte('paid_at', `${startOfMonth}T00:00:00`),

        supabase.from('promotion_queue').select('id').eq('status', 'open'),
        supabase.from('attendance').select('id').gte('checked_in_at', `${today}T00:00:00`),

        // Global counts for "Abertas" and "Vencidas" cards
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['overdue', 'open']).lt('due_date', today),
      ]);

      const students = studentsResult.data || [];
      const professors = professorsResult.data || [];
      const monthlyInvoicesData = monthlyInvoicesResult.data || [];
      const monthlyExpensesData = monthlyExpensesResult.data || [];
      const promotions = promotionsResult.data || [];
      const attendance = attendanceResult.data || [];

      // Calculate stats
      const totalStudents = students.length;
      const activeStudents = students.filter(s => s.status === 'active').length;
      const totalProfessors = professors.length;

      // Use the global counts from the count queries
      const pendingInvoices = globalOpenInvoicesResult.count || 0;
      const overdueInvoices = globalOverdueInvoicesResult.count || 0;

      const monthlyRevenue = monthlyInvoicesData
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const monthlyExpenses = monthlyExpensesData
        .filter(e => e.paid_at) // Redundant check if query filters by paid_at but good for safety
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        totalStudents,
        activeStudents,
        totalProfessors,
        pendingInvoices,
        overdueInvoices,
        monthlyRevenue,
        monthlyExpenses,
        pendingPromotions: promotions.length,
        todayAttendance: attendance.length,
      };
    },
    enabled: !!profile?.academy_id,
  });
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  href
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua academia
          </p>
        </div>

        {/* Overdue Alerts - Always visible at top */}
        <OverdueAlertsCard />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total de Alunos"
                value={stats?.totalStudents || 0}
                subtitle={`${stats?.activeStudents || 0} ativos`}
                icon={Users}
                iconColor="text-blue-500"
                href="/admin/alunos"
              />
              <StatCard
                title="Professores"
                value={stats?.totalProfessors || 0}
                subtitle="Cadastrados"
                icon={UserCheck}
                iconColor="text-purple-500"
                href="/admin/professores"
              />
              <StatCard
                title="Presenças Hoje"
                value={stats?.todayAttendance || 0}
                subtitle="Check-ins do dia"
                icon={Calendar}
                iconColor="text-green-500"
                href="/admin/presencas"
              />
              <StatCard
                title="Promoções Pendentes"
                value={stats?.pendingPromotions || 0}
                subtitle="Aguardando aprovação"
                icon={Award}
                iconColor="text-yellow-500"
                href="/admin/graduacao"
              />
            </div>

            {/* Financial Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Receita do Mês"
                value={formatCurrency(stats?.monthlyRevenue || 0)}
                subtitle="Faturas pagas"
                icon={DollarSign}
                iconColor="text-green-500"
                href="/admin/financeiro"
              />
              <StatCard
                title="Despesas do Mês"
                value={formatCurrency(stats?.monthlyExpenses || 0)}
                subtitle="Despesas pagas"
                icon={TrendingDown}
                iconColor="text-red-500"
                href="/admin/despesas"
              />
              <StatCard
                title="Faturas Abertas"
                value={stats?.pendingInvoices || 0}
                subtitle="Aguardando pagamento"
                icon={CheckCircle}
                iconColor="text-orange-500"
                href="/admin/financeiro"
              />
              <StatCard
                title="Faturas Vencidas"
                value={stats?.overdueInvoices || 0}
                subtitle="Requer atenção"
                icon={AlertTriangle}
                iconColor="text-red-500"
                href="/admin/financeiro"
              />
            </div>

            {/* Financial Dashboard with Filters and Chart */}
            <FinancialDashboard />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to="/admin/alunos">
                      <Users className="h-4 w-4 mr-2" />
                      Novo Aluno
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/presencas">
                      <Calendar className="h-4 w-4 mr-2" />
                      Registrar Presença
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/financeiro">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Gerenciar Faturas
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/graduacao">
                      <Award className="h-4 w-4 mr-2" />
                      Graduações
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
