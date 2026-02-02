import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStudentHistory, useBeltRules } from '@/hooks/useGraduation';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Award, TrendingUp, Calendar, Target, ArrowUp } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { BELT_LABELS } from '@/lib/beltSystem';

type Student = Tables<'students'>;

interface StudentHistoryPanelProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentHistoryPanel({ student, open, onOpenChange }: StudentHistoryPanelProps) {
  const { data: history, isLoading } = useStudentHistory(student?.id || null);
  const { data: rules } = useBeltRules();

  const currentRule = rules?.find(r => r.belt === student?.belt_current);
  const classesPerStripe = currentRule?.classes_per_stripe || 30;
  const stripesToPromote = currentRule?.stripes_to_promote || 4;
  const remaining = student ? classesPerStripe - (student.belt_cycle_classes % classesPerStripe) : 0;
  const isEligible = student ? student.stripes_cached >= stripesToPromote && student.belt_current !== 'black' : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Histórico do Aluno</SheetTitle>
        </SheetHeader>
        
        {!student ? (
          <p className="text-muted-foreground mt-4">Nenhum aluno selecionado</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="space-y-6 pr-4">
              {/* Current Status */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Status Atual
                </h3>
                
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Faixa</span>
                    <BeltBadge belt={student.belt_current} stripes={student.stripes_cached} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Graus</span>
                    <Badge variant="secondary">{student.stripes_cached}/4</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Aulas no ciclo</span>
                    <span>{student.belt_cycle_classes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de aulas</span>
                    <span>{student.total_classes}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Próximo grau em</span>
                    <span className="font-medium">
                      {student.belt_current === 'black' ? 'N/A' : `${remaining} aulas`}
                    </span>
                  </div>
                  
                  {isEligible && (
                    <Badge className="w-full justify-center py-2 bg-primary/20 text-primary border-primary">
                      <Award className="h-4 w-4 mr-2" />
                      Apto para troca de faixa
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Stripe Events */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Histórico de Graus
                </h3>
                
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : history?.stripeEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum grau registrado ainda.</p>
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
                              Faixa {BELT_LABELS[event.belt]} • {event.source === 'attendance' ? 'Presença' : 'Manual'}
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
              </div>
              
              <Separator />
              
              {/* Belt Promotions */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Promoções de Faixa
                </h3>
                
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : history?.beltPromotions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma promoção de faixa registrada.</p>
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
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
