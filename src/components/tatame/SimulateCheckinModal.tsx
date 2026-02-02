import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BeltBadge } from '@/components/students/BeltBadge';
import { useStudents, Student } from '@/hooks/useStudents';
import { useSimulateCheckin } from '@/hooks/useTatameOnline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2 } from 'lucide-react';

interface SimulateCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulateCheckinModal({ open, onOpenChange }: SimulateCheckinModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const simulateMutation = useSimulateCheckin();

  const filteredStudents = students.filter(s => 
    s.status === 'active' && 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSimulate = async () => {
    if (!selectedStudent || !profile?.academy_id) return;

    try {
      // Use the profile_id if available, otherwise use the student id
      const studentIdForAttendance = selectedStudent.profile_id || selectedStudent.id;
      
      await simulateMutation.mutateAsync({
        studentId: studentIdForAttendance,
        academyId: profile.academy_id,
      });

      toast({
        title: 'Check-in simulado',
        description: `${selectedStudent.name} entrou no tatame!`,
      });

      setSelectedStudent(null);
      setSearch('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao simular',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simular App Aluno</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione um aluno para simular a entrada no tatame como se ele estivesse usando o app.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[250px] border rounded-lg">
            {loadingStudents ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum aluno encontrado
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <BeltBadge belt={student.belt_current} stripes={student.stripes_cached} size="sm" />
                    <span className="font-medium">{student.name}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSimulate}
              disabled={!selectedStudent || simulateMutation.isPending}
              className="flex-1"
            >
              {simulateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Simular Check-in
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
