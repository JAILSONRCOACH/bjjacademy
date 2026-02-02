import { EligibleStudent, useAddToQueue } from '@/hooks/useGraduation';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Award, Eye } from 'lucide-react';

interface EligibleStudentsTableProps {
  students: EligibleStudent[];
  onSelectStudent: (student: EligibleStudent) => void;
  onPromote: (student: EligibleStudent) => void;
}

export function EligibleStudentsTable({ students, onSelectStudent, onPromote }: EligibleStudentsTableProps) {
  const { toast } = useToast();
  const addToQueue = useAddToQueue();

  const handleAddToQueue = async (student: EligibleStudent) => {
    try {
      await addToQueue.mutateAsync(student.id);
      toast({
        title: 'Adicionado à fila',
        description: `${student.name} foi adicionado à fila de promoção.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Award className="h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum aluno apto para promoção ainda.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Faixa</TableHead>
          <TableHead className="text-center">Graus</TableHead>
          <TableHead className="text-center">Aulas Ciclo</TableHead>
          <TableHead className="text-center">Total Aulas</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>
              <BeltBadge belt={student.belt_current} stripes={student.stripes_cached} />
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="secondary">{student.stripes_cached}/4</Badge>
            </TableCell>
            <TableCell className="text-center">{student.belt_cycle_classes}</TableCell>
            <TableCell className="text-center">{student.total_classes}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectStudent(student)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                {!student.in_queue && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToQueue(student)}
                    disabled={addToQueue.isPending}
                  >
                    {addToQueue.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Fila
                  </Button>
                )}
                
                {student.in_queue && (
                  <Badge variant="outline">Na fila</Badge>
                )}
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onPromote(student)}
                >
                  <Award className="h-4 w-4 mr-1" />
                  Promover
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
