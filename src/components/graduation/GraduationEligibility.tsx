import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp } from 'lucide-react';

interface GraduationEligibilityProps {
  beltPromotionCount: number;
  stripeEligibleCount: number;
  totalEligible: number;
}

export function GraduationEligibility({ 
  beltPromotionCount, 
  stripeEligibleCount,
  totalEligible 
}: GraduationEligibilityProps) {
  const maxCount = Math.max(beltPromotionCount, stripeEligibleCount, 1);

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span className="font-semibold">Elegibilidade Atual</span>
          </div>
          <span className="text-3xl font-bold text-primary">{totalEligible}</span>
        </div>

        <div className="space-y-5">
          {/* Belt Promotion */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Troca de Faixa</span>
              <span className="font-medium">{beltPromotionCount}</span>
            </div>
            <Progress 
              value={(beltPromotionCount / maxCount) * 100} 
              className="h-3 bg-muted"
            />
          </div>

          {/* New Stripe */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Novo Grau</span>
              <span className="font-medium">{stripeEligibleCount}</span>
            </div>
            <Progress 
              value={(stripeEligibleCount / maxCount) * 100} 
              className="h-3 bg-muted"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
