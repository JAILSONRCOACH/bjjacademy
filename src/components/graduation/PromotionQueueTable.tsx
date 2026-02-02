import { BeltBadge } from '@/components/students/BeltBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useIgnoreQueue } from '@/hooks/useGraduation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Award, Eye, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tables } from '@/integrations/supabase/types';

type Student = Tables<'students'>;

interface QueueItem {
  id: string;
  student_id: string;
  eligible_at: string;
  status: string;
  notes: string | null;
  student: Student | null;
}

interface PromotionQueueTableProps {
  items: QueueItem[];
  onSelectStudent: (student: Student) => void;
  onPromote: (student: Student) => void;
}

export function PromotionQueueTable({ items, onSelectStudent, onPromote }: PromotionQueueTableProps) {
  const { toast } = useToast();
  const ignoreQueue = useIgnoreQueue();

  const handleIgnore = async (queueId: string) => {
    try {
      await ignoreQueue.mutateAsync({ queueId });
      toast({
        title: 'Item ignorado',
        description: 'O aluno foi removido da fila de promoção.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
        <p>Fila de promoção vazia.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Faixa Atual</TableHead>
          <TableHead className="text-center">Graus</TableHead>
          <TableHead>Apto desde</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          if (!item.student) return null;
          
          return (
            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">{item.student.name}</TableCell>
              <TableCell>
                <BeltBadge belt={item.student.belt_current} stripes={item.student.stripes_cached} />
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{item.student.stripes_cached}/4</Badge>
              </TableCell>
              <TableCell>
                {format(new Date(item.eligible_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectStudent(item.student!)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIgnore(item.id)}
                    disabled={ignoreQueue.isPending}
                  >
                    {ignoreQueue.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPromote(item.student!)}
                  >
                    <Award className="h-4 w-4 mr-1" />
                    Promover
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
