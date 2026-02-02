import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentByProfileId, useBeltRules, calculateClassesToNextStripe } from '@/hooks/useStudents';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Award, BookOpen, Target, Trophy } from 'lucide-react';

function ProgressSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function StudentProgress() {
  const { profile } = useAuth();
  const { data: student, isLoading, error } = useStudentByProfileId(profile?.id);
  const { data: beltRules = [] } = useBeltRules(profile?.academy_id);

  if (error) {
    return (
      <DashboardLayout title="Meu Progresso">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Erro ao carregar progresso: {error.message}</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Meu Progresso">
        <ProgressSkeleton />
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Meu Progresso">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Registro não encontrado</p>
            <p className="text-muted-foreground mt-2">
              Seu registro de aluno ainda não foi criado. Entre em contato com a academia.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const classesToNextStripe = calculateClassesToNextStripe(
    student.belt_current,
    student.belt_cycle_classes,
    beltRules
  );

  const currentRule = beltRules.find(r => r.belt === student.belt_current);
  const isReadyForPromotion = currentRule && student.stripes_cached >= currentRule.stripes_to_promote;

  return (
    <DashboardLayout title="Meu Progresso">
      <div className="space-y-6">
        {isReadyForPromotion && (
          <Card className="border-status-ok bg-status-ok/10">
            <CardContent className="flex items-center gap-3 py-4">
              <Trophy className="h-6 w-6 text-status-ok" />
              <div>
                <p className="font-semibold text-status-ok">Apto para troca de faixa!</p>
                <p className="text-sm text-muted-foreground">
                  Parabéns! Você completou os requisitos para a próxima faixa.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faixa Atual
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <BeltBadge 
                belt={student.belt_current} 
                stripes={student.stripes_cached}
                size="lg"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Graus
              </CardTitle>
              <div className="flex gap-0.5">
                {student.stripes_cached > 0 ? (
                  Array.from({ length: student.stripes_cached }).map((_, i) => (
                    <div key={i} className="w-1 h-4 bg-foreground/50 rounded-sm" />
                  ))
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{student.stripes_cached}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {currentRule?.stripes_to_promote || 4} para promoção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aulas no Ciclo
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{student.belt_cycle_classes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                desde o último grau
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Para Próximo Grau
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classesToNextStripe}</div>
              {classesToNextStripe !== 'N/A' && (
                <p className="text-xs text-muted-foreground mt-1">
                  aulas restantes
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Aulas</p>
                <p className="text-2xl font-bold">{student.total_classes}</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {student.total_classes} treinos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
