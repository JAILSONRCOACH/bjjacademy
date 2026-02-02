import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentProgress, useMyHistory } from '@/hooks/useGraduation';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Award, TrendingUp, Target, ArrowUp, BookOpen } from 'lucide-react';
import { BELT_LABELS } from '@/lib/beltSystem';

export default function StudentEvolution() {
  const { data: progress, isLoading: loadingProgress } = useStudentProgress();
  const { data: history, isLoading: loadingHistory } = useMyHistory();

  const classesPerStripe = progress?.rule?.classes_per_stripe || 30;
  const progressPercentage = progress?.student 
    ? ((progress.student.belt_cycle_classes % classesPerStripe) / classesPerStripe) * 100 
    : 0;

  if (loadingProgress) {
    return (
      <DashboardLayout title="Minha Evolução">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!progress?.student) {
    return (
      <DashboardLayout title="Minha Evolução">
        <div className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
          <p className="text-muted-foreground">
            Você ainda não está vinculado a um registro de aluno.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { student, remainingToStripe, isEligible } = progress;

  return (
    <DashboardLayout title="Minha Evolução">
      <div className="space-y-6">
        {/* Current Status */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faixa Atual</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <BeltBadge belt={student.belt_current} stripes={student.stripes_cached} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graus</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.stripes_cached}/4</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.total_classes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Grau</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {student.belt_current === 'black' ? 'N/A' : `${remainingToStripe} aulas`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Eligible Badge */}
        {isEligible && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="flex items-center justify-center py-6">
              <Badge className="text-lg px-6 py-2 bg-primary text-primary-foreground">
                <Award className="h-5 w-5 mr-2" />
                Apto para troca de faixa!
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Progress to next stripe */}
        {student.belt_current !== 'black' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso para o próximo grau</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{student.belt_cycle_classes % classesPerStripe} aulas completadas</span>
                <span>{classesPerStripe} aulas necessárias</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stripe Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Histórico de Graus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : history?.stripeEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum grau registrado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {history?.stripeEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {event.previous_stripes} → {event.new_stripes} graus
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Faixa {BELT_LABELS[event.belt]}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Belt Promotions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Promoções de Faixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : history?.beltPromotions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma promoção de faixa registrada.
                </p>
              ) : (
                <div className="space-y-2">
                  {history?.beltPromotions.map((promotion) => (
                    <div key={promotion.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BeltBadge belt={promotion.from_belt} stripes={promotion.from_stripes} />
                          <span className="text-muted-foreground">→</span>
                          <BeltBadge belt={promotion.to_belt} stripes={0} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(promotion.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                      {promotion.reason && (
                        <p className="text-xs text-muted-foreground">{promotion.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
