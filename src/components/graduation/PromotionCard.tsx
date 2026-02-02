import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Award, TrendingUp, Eye } from 'lucide-react';
import { EligibleStudent } from '@/hooks/useGraduation';
import { Tables } from '@/integrations/supabase/types';
import { BeltType, BELT_LABELS, getNextBelt } from '@/lib/beltSystem';
import { differenceInYears } from 'date-fns';

type Student = Tables<'students'>;

interface PromotionCardProps {
  student: EligibleStudent | Student;
  type: 'belt' | 'stripe';
  targetBelt?: BeltType;
  targetStripe?: number;
  classesInCycle?: number;
  totalClasses?: number;
  onPromote: () => void;
  onViewHistory: () => void;
}

export function PromotionCard({
  student,
  type,
  targetBelt,
  targetStripe,
  classesInCycle,
  totalClasses,
  onPromote,
  onViewHistory
}: PromotionCardProps) {
  const currentBelt = ('belt_current' in student ? student.belt_current : 'white') as BeltType;
  const stripes = 'stripes_cached' in student ? student.stripes_cached : 0;
  const cycleClasses = classesInCycle ?? ('belt_cycle_classes' in student ? student.belt_cycle_classes : 0);
  const total = totalClasses ?? ('total_classes' in student ? student.total_classes : 0);

  // Calculate student age to determine correct belt progression
  const birthDate = 'birth_date' in student && student.birth_date ? new Date(student.birth_date) : null;
  const studentAge = birthDate ? differenceInYears(new Date(), birthDate) : 18; // Default to adult if no birth date

  const nextBelt = targetBelt || getNextBelt(currentBelt, studentAge) || currentBelt;
  const isBeltPromotion = type === 'belt' || stripes >= 4;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{student.name}</h3>
            <p className="text-xs text-muted-foreground">ID: #{student.id.slice(0, 8)}</p>
          </div>
          <Badge
            variant={isBeltPromotion ? "default" : "secondary"}
            className={isBeltPromotion ? "bg-primary text-primary-foreground" : ""}
          >
            {isBeltPromotion ? 'NOVA FAIXA' : `+${(targetStripe || stripes + 1) - stripes} GRAU`}
          </Badge>
        </div>

        {/* Belt with stripes */}
        <div className="mb-4">
          <BeltBadge belt={currentBelt} stripes={stripes} size="md" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Aulas no Ciclo</p>
            <p className="font-bold text-lg">
              <span className="text-primary">{cycleClasses}</span>
              <span className="text-muted-foreground text-sm">/120</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Frequência Total</p>
            <p className="font-bold text-lg">{total}</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className="w-full gap-2"
          onClick={onPromote}
          variant={isBeltPromotion ? "default" : "outline"}
        >
          {isBeltPromotion ? (
            <>
              <Award className="h-4 w-4" />
              Graduar para {BELT_LABELS[nextBelt as BeltType] || nextBelt}
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Aplicar {targetStripe || stripes + 1}º Grau
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
