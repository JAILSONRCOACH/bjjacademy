import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Filter,
  Award,
  UserX,
  CreditCard,
  BarChart3,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useInvoices, useExpenses, useInvoiceStats, useExpenseStats } from '@/hooks/useFinance';
import { useBeltRules } from '@/hooks/useGraduation';
import { useAuth } from '@/contexts/AuthContext';
import { BeltBadge } from '@/components/students/BeltBadge';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  exportStudentsToExcel,
  exportStudentsToPDF,
  exportFinancialToExcel,
  exportFinancialToPDF,
  exportOverdueStudentsToExcel,
  exportOverdueStudentsToPDF
} from '@/lib/exportUtils';

const BELT_OPTIONS = [
  { value: 'all', label: 'Todas as Faixas' },
  { value: 'white', label: 'Branca' },
  { value: 'grey_white', label: 'Cinza e Branca' },
  { value: 'grey', label: 'Cinza' },
  { value: 'grey_black', label: 'Cinza e Preta' },
  { value: 'yellow_white', label: 'Amarela e Branca' },
  { value: 'yellow', label: 'Amarela' },
  { value: 'yellow_black', label: 'Amarela e Preta' },
  { value: 'orange_white', label: 'Laranja e Branca' },
  { value: 'orange', label: 'Laranja' },
  { value: 'orange_black', label: 'Laranja e Preta' },
  { value: 'green_white', label: 'Verde e Branca' },
  { value: 'green', label: 'Verde' },
  { value: 'green_black', label: 'Verde e Preta' },
  { value: 'blue', label: 'Azul' },
  { value: 'purple', label: 'Roxa' },
  { value: 'brown', label: 'Marrom' },
  { value: 'black', label: 'Preta' },
];

const GENDER_OPTIONS = [
  { value: 'all', label: 'Todos os Sexos' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
];

const FINANCIAL_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'ok', label: 'Em dia' },
  { value: 'pending', label: 'Pendente' },
  { value: 'overdue', label: 'Inadimplente' },
  { value: 'blocked', label: 'Bloqueado' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'suspended', label: 'Suspensos' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch {
    return null;
  }
}

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1">
          {trend && trendValue && (
            <>
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                {trendValue}
              </span>
            </>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentsReport() {
  const { data: students = [], isLoading } = useStudents();
  const { data: beltRules = [] } = useBeltRules();
  const { data: invoices = [] } = useInvoices();

  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [financialFilter, setFinancialFilter] = useState('all');
  const [reportType, setReportType] = useState('all');

  // Calculate eligible students locally
  const { eligibleForBeltList, eligibleForStripeList } = useMemo(() => {
    const rulesMap = new Map(beltRules.map(r => [r.belt, r]));

    const eligibleBelt: typeof students = [];
    const eligibleStripe: typeof students = [];

    students.forEach(student => {
      const rule = rulesMap.get(student.belt_current);
      const classesPerStripe = rule?.classes_per_stripe || 30;
      const stripesToPromote = rule?.stripes_to_promote || 4;

      // Eligible for BELT change: has enough stripes AND not black belt
      if (student.stripes_cached >= stripesToPromote && student.belt_current !== 'black') {
        eligibleBelt.push(student);
      }
      // Eligible for STRIPE/DEGREE: completed enough classes in cycle AND has room for more stripes
      else if (student.belt_cycle_classes >= classesPerStripe && student.stripes_cached < stripesToPromote) {
        eligibleStripe.push(student);
      }
    });

    return { eligibleForBeltList: eligibleBelt, eligibleForStripeList: eligibleStripe };
  }, [students, beltRules]);

  const filteredStudents = useMemo(() => {
    let result = students;

    // Report type filter
    if (reportType === 'eligible-belt') {
      const eligibleIds = new Set(eligibleForBeltList.map(s => s.id));
      result = result.filter(s => eligibleIds.has(s.id));
    } else if (reportType === 'eligible-stripe') {
      const eligibleIds = new Set(eligibleForStripeList.map(s => s.id));
      result = result.filter(s => eligibleIds.has(s.id));
    } else if (reportType === 'overdue') {
      result = result.filter(s => s.financial_status === 'overdue');
    } else if (reportType === 'inactive') {
      result = result.filter(s => s.status === 'inactive' || s.status === 'suspended');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      );
    }

    // Belt filter
    if (beltFilter !== 'all') {
      result = result.filter(s => s.belt_current === beltFilter);
    }

    // Gender filter
    if (genderFilter !== 'all') {
      result = result.filter(s => s.gender === genderFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Financial filter
    if (financialFilter !== 'all') {
      result = result.filter(s => s.financial_status === financialFilter);
    }

    return result;
  }, [students, searchQuery, beltFilter, genderFilter, statusFilter, financialFilter, reportType, eligibleForBeltList, eligibleForStripeList]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const inactive = students.filter(s => s.status === 'inactive' || s.status === 'suspended').length;

    // Calculate overdue from actual invoices, not from financial_status field
    const today = new Date().toISOString().split('T')[0];
    const studentsWithOverdueInvoices = new Set(
      invoices
        .filter(inv => inv.status === 'overdue' || (inv.status === 'open' && inv.due_date && inv.due_date < today))
        .map(inv => inv.student_id)
    );
    const overdue = studentsWithOverdueInvoices.size;

    const eligibleBelt = eligibleForBeltList.length;
    const eligibleStripe = eligibleForStripeList.length;
    const male = students.filter(s => s.gender === 'male').length;
    const female = students.filter(s => s.gender === 'female').length;

    return {
      total,
      active,
      inactive,
      overdue,
      eligibleBelt,
      eligibleStripe,
      male,
      female,
      activePercentage: total > 0 ? ((active / total) * 100).toFixed(1) : '0',
      overduePercentage: total > 0 ? ((overdue / total) * 100).toFixed(1) : '0',
    };
  }, [students, invoices, eligibleForBeltList, eligibleForStripeList]);

  // Belt distribution
  const beltDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    students.forEach(s => {
      const belt = s.belt_current || 'white';
      distribution[belt] = (distribution[belt] || 0) + 1;
    });
    return distribution;
  }, [students]);

  // Get report title based on filter
  const getReportTitle = () => {
    switch (reportType) {
      case 'eligible-belt': return 'Alunos Aptos para Faixa';
      case 'eligible-stripe': return 'Alunos Aptos para Grau';
      case 'overdue': return 'Alunos Inadimplentes';
      case 'inactive': return 'Alunos Inativos';
      default: return 'Relatório de Alunos';
    }
  };

  // Prepare students data for export
  const prepareStudentsForExport = () => {
    return filteredStudents.map(s => ({
      ...s,
      age: calculateAge(s.birth_date),
    }));
  };

  const handleExportExcel = () => {
    exportStudentsToExcel(prepareStudentsForExport(), getReportTitle());
  };

  const handleExportPDF = () => {
    exportStudentsToPDF(prepareStudentsForExport(), getReportTitle());
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Alunos"
          value={kpis.total}
          description={`${kpis.activePercentage}% ativos`}
          icon={Users}
        />
        <KPICard
          title="Alunos Ativos"
          value={kpis.active}
          icon={Users}
        />
        <KPICard
          title="Inativos/Suspensos"
          value={kpis.inactive}
          icon={UserX}
        />
        <KPICard
          title="Inadimplentes"
          value={kpis.overdue}
          description={`${kpis.overduePercentage}% do total`}
          icon={AlertTriangle}
        />
        <KPICard
          title="Aptos p/ Faixa"
          value={kpis.eligibleBelt}
          icon={Award}
        />
        <KPICard
          title="Aptos p/ Grau"
          value={kpis.eligibleStripe}
          icon={Award}
        />
        <KPICard
          title="Masculino"
          value={kpis.male}
          icon={Users}
        />
        <KPICard
          title="Feminino"
          value={kpis.female}
          icon={Users}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Alunos</SelectItem>
                <SelectItem value="eligible-belt">Aptos p/ Faixa</SelectItem>
                <SelectItem value="eligible-stripe">Aptos p/ Grau</SelectItem>
                <SelectItem value="overdue">Inadimplentes</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={beltFilter} onValueChange={setBeltFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Faixa" />
              </SelectTrigger>
              <SelectContent>
                {BELT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sexo" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Select value={financialFilter} onValueChange={setFinancialFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status Financeiro" />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredStudents.length} alunos</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado do Relatório</CardTitle>
          <CardDescription>
            {filteredStudents.length} aluno(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Graus</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Financeiro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Nenhum aluno encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.slice(0, 100).map((student) => {
                    const age = calculateAge(student.birth_date);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.phone || '-'}</TableCell>
                        <TableCell>{student.email || '-'}</TableCell>
                        <TableCell>
                          <BeltBadge belt={student.belt_current || 'white'} stripes={student.stripes_cached} />
                        </TableCell>
                        <TableCell>{student.stripes_cached}</TableCell>
                        <TableCell>{age !== null ? `${age} anos` : '-'}</TableCell>
                        <TableCell>{student.category || '-'}</TableCell>
                        <TableCell>
                          {student.gender === 'male' ? 'M' : student.gender === 'female' ? 'F' : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.financial_status === 'ok' ? 'default' :
                                student.financial_status === 'overdue' ? 'destructive' :
                                  'secondary'
                            }
                          >
                            {student.financial_status === 'ok' ? 'Ok' :
                              student.financial_status === 'pending' ? 'Pendente' :
                                student.financial_status === 'overdue' ? 'Vencido' : 'Bloqueado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredStudents.length > 100 && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando 100 de {filteredStudents.length} alunos. Exporte o CSV para ver todos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialReport() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // useExpenses and useExpenseStats expect 0-indexed months (0=Jan), but selectedMonth is 1-indexed (1=Jan)
  const queryMonth = selectedMonth === -1 ? -1 : selectedMonth - 1;

  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses({ month: queryMonth, year: selectedYear });
  const { data: invoiceStats } = useInvoiceStats();
  const { data: expenseStats } = useExpenseStats({ month: queryMonth, year: selectedYear });

  // Helper to check if invoice is effectively overdue
  const isOverdue = (inv: any) => {
    if (inv.status === 'overdue') return true;
    if (inv.status === 'open' && inv.due_date) {
      const today = new Date().toISOString().split('T')[0];
      return inv.due_date < today;
    }
    return false;
  };

  const monthlyData = useMemo(() => {
    // Filter invoices for selected month (or year if -1)
    const filteredInvoices = invoices.filter(inv => {
      // Append T12:00:00 to prevent timezone shift
      const invDate = new Date(inv.due_date + 'T12:00:00');
      if (selectedMonth === -1) {
        return invDate.getFullYear() === selectedYear;
      }
      return invDate.getMonth() + 1 === selectedMonth && invDate.getFullYear() === selectedYear;
    });

    // A Receber = ALL unpaid invoices (open + overdue)
    const totalReceivable = filteredInvoices
      .filter(i => i.status === 'open' || i.status === 'overdue' || isOverdue(i))
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const totalReceived = filteredInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const totalOverdue = filteredInvoices
      .filter(i => isOverdue(i))
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const paidExpenses = expenses
      .filter(e => e.paid_at)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Pending expenses (not paid yet, but not overdue)
    const today = new Date().toISOString().split('T')[0];
    const pendingExpenses = expenses
      .filter(e => !e.paid_at && (!e.due_date || e.due_date >= today))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingExpensesCount = expenses.filter(e => !e.paid_at && (!e.due_date || e.due_date >= today)).length;

    // Overdue expenses (not paid and past due date)
    const overdueExpenses = expenses
      .filter(e => !e.paid_at && e.due_date && e.due_date < today)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const overdueExpensesCount = expenses.filter(e => !e.paid_at && e.due_date && e.due_date < today).length;

    return {
      totalReceivable,
      totalReceived,
      totalOverdue,
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      pendingExpensesCount,
      overdueExpenses,
      overdueExpensesCount,
      netIncome: totalReceived - paidExpenses,
      openInvoices: filteredInvoices.filter(i => i.status === 'open' || i.status === 'overdue' || isOverdue(i)).length,
      paidInvoices: filteredInvoices.filter(i => i.status === 'paid').length,
      overdueInvoices: filteredInvoices.filter(i => isOverdue(i)).length,
    };
  }, [invoices, expenses, selectedMonth, selectedYear]);

  // Get overdue students
  const overdueStudents = useMemo(() => {
    return invoices
      .filter(i => isOverdue(i))
      .reduce((acc, inv) => {
        const existing = acc.find(s => s.studentId === inv.student_id);
        if (existing) {
          existing.totalOwed += Number(inv.amount);
          existing.invoiceCount += 1;
        } else {
          acc.push({
            studentId: inv.student_id,
            studentName: inv.student?.name || 'Desconhecido',
            totalOwed: Number(inv.amount),
            invoiceCount: 1,
            oldestDueDate: inv.due_date,
          });
        }
        return acc;
      }, [] as Array<{ studentId: string; studentName: string; totalOwed: number; invoiceCount: number; oldestDueDate: string }>)
      .sort((a, b) => b.totalOwed - a.totalOwed);
  }, [invoices]);

  // Get filtered invoices for selected period
  const filteredInvoicesForPeriod = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = new Date(inv.due_date + 'T12:00:00');
      if (selectedMonth === -1) {
        return invDate.getFullYear() === selectedYear;
      }
      return invDate.getMonth() + 1 === selectedMonth && invDate.getFullYear() === selectedYear;
    });
  }, [invoices, selectedMonth, selectedYear]);

  // Summary for export
  const exportSummary = useMemo(() => ({
    received: monthlyData.totalReceived,
    receivable: monthlyData.totalReceivable,
    overdue: monthlyData.totalOverdue,
    expenses: monthlyData.totalExpenses,
    net: monthlyData.netIncome,
  }), [monthlyData]);

  const handleExportOverdueExcel = () => {
    exportOverdueStudentsToExcel(overdueStudents);
  };

  const handleExportOverduePDF = () => {
    exportOverdueStudentsToPDF(overdueStudents);
  };

  const handleExportFinancialExcel = () => {
    exportFinancialToExcel(filteredInvoicesForPeriod, expenses, selectedMonth, selectedYear, exportSummary);
  };

  const handleExportFinancialPDF = () => {
    exportFinancialToPDF(filteredInvoicesForPeriod, expenses, selectedMonth, selectedYear, exportSummary);
  };

  // ... (handlers unchanged) ...

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Período do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">📅 Ano Completo</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={now.getFullYear() - 2 + i} value={(now.getFullYear() - 2 + i).toString()}>
                    {now.getFullYear() - 2 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportFinancialExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportFinancialPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>


      {/* RECEITAS (Revenue) Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Receitas (Faturas)
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            title="Receita Recebida"
            value={formatCurrency(monthlyData.totalReceived)}
            description={`${monthlyData.paidInvoices} faturas pagas`}
            icon={TrendingUp}
          />
          <KPICard
            title="A Receber"
            value={formatCurrency(monthlyData.totalReceivable)}
            description={`${monthlyData.openInvoices} faturas em aberto`}
            icon={DollarSign}
          />
          <KPICard
            title="Receitas Vencidas"
            value={formatCurrency(monthlyData.totalOverdue)}
            description={`${monthlyData.overdueInvoices} faturas vencidas`}
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* DESPESAS (Expenses) Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-500" />
          Despesas
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Despesas Pagas"
            value={formatCurrency(monthlyData.paidExpenses)}
            icon={CreditCard}
          />
          <KPICard
            title="A Pagar"
            value={formatCurrency(monthlyData.pendingExpenses)}
            description={`${monthlyData.pendingExpensesCount} despesas pendentes`}
            icon={DollarSign}
          />
          <KPICard
            title="Despesas Vencidas"
            value={formatCurrency(monthlyData.overdueExpenses)}
            description={`${monthlyData.overdueExpensesCount} despesas atrasadas`}
            icon={AlertTriangle}
          />
          <KPICard
            title="Total Despesas"
            value={formatCurrency(monthlyData.totalExpenses)}
            icon={TrendingDown}
          />
        </div>
      </div>

      {/* Resultado Líquido */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <KPICard
          title="Resultado Líquido"
          value={formatCurrency(monthlyData.netIncome)}
          description={monthlyData.netIncome >= 0 ? 'Positivo' : 'Negativo'}
          icon={BarChart3}
          trend={monthlyData.netIncome >= 0 ? 'up' : 'down'}
          trendValue={monthlyData.netIncome >= 0 ? 'Lucro' : 'Prejuízo'}
        />
      </div>


      {/* Overdue Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alunos Inadimplentes
            </CardTitle>
            <CardDescription>
              {overdueStudents.length} aluno(s) com faturas vencidas
            </CardDescription>
          </div>
          {overdueStudents.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportOverdueExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportOverduePDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Faturas Vencidas</TableHead>
                  <TableHead>Total Devido</TableHead>
                  <TableHead>Vencimento Mais Antigo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum aluno inadimplente 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{student.invoiceCount}</TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {formatCurrency(student.totalOwed)}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(student.oldestDueDate), 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas do Período</CardTitle>
          <CardDescription>
            {expenses.length} despesa(s) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma despesa no período
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.slice(0, 50).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{expense.category?.name || '-'}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        {expense.due_date ? format(parseISO(expense.due_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expense.paid_at ? 'default' : 'secondary'}>
                          {expense.paid_at ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminReports() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Relatórios gerenciais e análises da academia
          </p>
        </div>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsReport />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialReport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
