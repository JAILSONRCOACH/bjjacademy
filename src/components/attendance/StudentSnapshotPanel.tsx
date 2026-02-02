import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Attendance } from '@/hooks/useAttendance';
import { BeltRule, calculateClassesToNextStripe } from '@/hooks/useStudents';
import { Award, BookOpen, Target, Trophy } from 'lucide-react';

interface StudentSnapshotPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance | null;
  beltRules: BeltRule[];
}

export function StudentSnapshotPanel({
  open,
  onOpenChange,
  attendance,
  beltRules,
}: StudentSnapshotPanelProps) {
  const student = attendance?.student;

  if (!student) return null;

  const classesToNextStripe = calculateClassesToNextStripe(
    student.belt,
    student.classes_since_last_stripe,
    beltRules
  );

  const currentRule = beltRules.find(r => r.belt === student.belt);
  const isReadyForPromotion = currentRule && student.stripes >= currentRule.stripes_to_promote;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {student.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isReadyForPromotion && (
            <Card className="border-status-ok bg-status-ok/10">
              <CardContent className="flex items-center gap-3 py-4">
                <Trophy className="h-5 w-5 text-status-ok" />
                <div>
                  <p className="font-semibold text-status-ok text-sm">Apto para troca de faixa!</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Faixa Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <BeltBadge 
                belt={student.belt} 
                stripes={student.stripes}
                size="lg"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Aulas no Ciclo
                </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{student.classes_since_last_stripe}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  P/ Próx. Grau
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{classesToNextStripe}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total de Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{student.total_classes}</p>
                <Badge variant="outline">{student.total_classes} treinos</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Graus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {student.stripes > 0 ? (
                  <>
                    {Array.from({ length: student.stripes }).map((_, i) => (
                      <div key={i} className="w-2 h-6 bg-foreground/70 rounded-sm" />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {student.stripes} de {currentRule?.stripes_to_promote || 4}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Nenhum grau ainda</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
