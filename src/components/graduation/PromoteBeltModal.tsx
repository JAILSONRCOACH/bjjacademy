import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePromoteBelt } from '@/hooks/useGraduation';
import { useToast } from '@/hooks/use-toast';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Loader2, ArrowRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { BeltType, BELT_LABELS, BELT_ORDER, ADULT_BELTS, CHILDREN_BELTS } from '@/lib/beltSystem';

type Student = Tables<'students'>;

interface PromoteBeltModalProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoteBeltModal({ student, open, onOpenChange }: PromoteBeltModalProps) {
  const { toast } = useToast();
  const promoteBelt = usePromoteBelt();
  
  const [selectedBelt, setSelectedBelt] = useState<BeltType | ''>('');
  const [reason, setReason] = useState('');

  // Get available belts for promotion based on current belt
  const getAvailableBelts = (): BeltType[] => {
    if (!student) return [];
    
    const currentBelt = student.belt_current as BeltType;
    const currentIndex = BELT_ORDER.indexOf(currentBelt);
    
    // Calculate age if birth_date exists
    let age = 18; // Default to adult
    if (student.birth_date) {
      const today = new Date();
      const birth = new Date(student.birth_date);
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }
    
    // For adults (16+), return adult belts after current position
    if (age >= 16) {
      return ADULT_BELTS.filter(belt => {
        const beltIndex = BELT_ORDER.indexOf(belt);
        return beltIndex > currentIndex;
      });
    }
    
    // For children, return children belts after current position
    return CHILDREN_BELTS.filter(belt => {
      const beltIndex = BELT_ORDER.indexOf(belt);
      return beltIndex > currentIndex;
    });
  };

  const availableBelts = getAvailableBelts();
  const nextBelt = availableBelts.length > 0 ? availableBelts[0] : null;

  // Reset state when modal opens
  useEffect(() => {
    if (open && nextBelt) {
      setSelectedBelt(nextBelt);
    } else if (!open) {
      setSelectedBelt('');
      setReason('');
    }
  }, [open, nextBelt]);

  const handlePromote = async () => {
    if (!student || !selectedBelt) return;
    
    try {
      await promoteBelt.mutateAsync({
        studentId: student.id,
        toBelt: selectedBelt,
        reason: reason || undefined
      });
      
      toast({
        title: 'Faixa promovida!',
        description: `${student.name} foi promovido para faixa ${BELT_LABELS[selectedBelt]}.`
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao promover',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promover Faixa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">{student.name}</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Atual</p>
                <BeltBadge belt={student.belt_current} stripes={student.stripes_cached} />
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Nova</p>
                {selectedBelt ? (
                  <BeltBadge belt={selectedBelt} stripes={0} />
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="belt">Nova Faixa</Label>
            <Select value={selectedBelt} onValueChange={(v) => setSelectedBelt(v as BeltType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                {availableBelts.map((belt) => (
                  <SelectItem key={belt} value={belt}>
                    {BELT_LABELS[belt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Excelente desempenho, aprovado em exame..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePromote} 
            disabled={!selectedBelt || promoteBelt.isPending}
          >
            {promoteBelt.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Promoção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
