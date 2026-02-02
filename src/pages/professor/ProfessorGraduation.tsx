import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useEligibleStudents, usePromotionQueue, EligibleStudent } from '@/hooks/useGraduation';
import { GraduationEligibility } from '@/components/graduation/GraduationEligibility';
import { PromotionCard } from '@/components/graduation/PromotionCard';
import { PromoteBeltModal } from '@/components/graduation/PromoteBeltModal';
import { StudentHistoryPanel } from '@/components/graduation/StudentHistoryPanel';
import { Award, TrendingUp } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Student = Tables<'students'>;

type FilterType = 'all' | 'belts' | 'stripes';

export default function ProfessorGraduation() {
  const { data: eligibleStudents, isLoading: loadingEligible } = useEligibleStudents();
  const { data: queueItems, isLoading: loadingQueue } = usePromotionQueue();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [studentToPromote, setStudentToPromote] = useState<Student | null>(null);

  // Calculate eligibility stats
  const eligibilityStats = useMemo(() => {
    const students = eligibleStudents || [];
    // Belt promotions: students with >= 4 stripes (or stripes_to_promote)
    const beltPromotions = students.filter(s => s.stripes_cached >= 4 && s.belt_current !== 'black');
    // Stripe/degree eligible: students with < 4 stripes but eligible for promotion
    const stripeEligible = students.filter(s => s.stripes_cached < 4 || s.belt_current === 'black');
    return {
      beltPromotionCount: beltPromotions.length,
      stripeEligibleCount: stripeEligible.length,
      totalEligible: students.length
    };
  }, [eligibleStudents]);

  // Combine eligible students and queue items for display
  const promotionQueue = useMemo(() => {
    const eligible = eligibleStudents || [];
    const queue = queueItems || [];
    
    const queueStudentIds = new Set(queue.map(q => q.student_id));
    
    const queueWithStudents = queue
      .filter(q => q.student)
      .map(q => ({
        student: q.student as Student,
        type: 'belt' as const,
        fromQueue: true,
        queueId: q.id
      }));
    
    const eligibleNotInQueue = eligible
      .filter(s => !queueStudentIds.has(s.id))
      .map(s => ({
        student: s,
        type: 'belt' as const,
        fromQueue: false,
        queueId: null
      }));
    
    return [...queueWithStudents, ...eligibleNotInQueue];
  }, [eligibleStudents, queueItems]);

  // Filter promotion queue
  const filteredQueue = useMemo(() => {
    if (filter === 'all') return promotionQueue;
    if (filter === 'belts') return promotionQueue.filter(item => item.student.stripes_cached >= 4);
    if (filter === 'stripes') return promotionQueue.filter(item => item.student.stripes_cached < 4);
    return promotionQueue;
  }, [promotionQueue, filter]);

  const handleViewHistory = (student: Student | EligibleStudent) => {
    setSelectedStudent(student as Student);
    setHistoryOpen(true);
  };

  const handlePromote = (student: Student | EligibleStudent) => {
    setStudentToPromote(student as Student);
    setPromoteOpen(true);
  };

  const isLoading = loadingEligible || loadingQueue;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Painel de Graduação</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie promoções dos seus alunos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GraduationEligibility 
            beltPromotionCount={eligibilityStats.beltPromotionCount}
            stripeEligibleCount={eligibilityStats.stripeEligibleCount}
            totalEligible={eligibilityStats.totalEligible}
          />

          <Card className="flex flex-col items-center justify-center p-6">
            <div className="text-5xl font-bold text-primary mb-2">
              {eligibilityStats.totalEligible}
            </div>
            <p className="text-muted-foreground text-center">
              Alunos elegíveis para promoção
            </p>
          </Card>
        </div>

        {/* Promotion Queue */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Fila de Promoção</h2>
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="belts">Faixas</TabsTrigger>
                <TabsTrigger value="stripes">Graus</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredQueue.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <Award className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhum aluno na fila</h3>
                <p className="text-muted-foreground">
                  Seus alunos elegíveis para promoção aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQueue.map((item) => (
                <PromotionCard
                  key={item.student.id}
                  student={item.student}
                  type={item.student.stripes_cached >= 4 ? 'belt' : 'stripe'}
                  onPromote={() => handlePromote(item.student)}
                  onViewHistory={() => handleViewHistory(item.student)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <StudentHistoryPanel
        student={selectedStudent}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      <PromoteBeltModal
        student={studentToPromote}
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
      />
    </DashboardLayout>
  );
}
