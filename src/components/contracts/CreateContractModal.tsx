import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudents } from '@/hooks/useStudents';
import { useActiveTemplate, useCreateContract } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText } from 'lucide-react';

interface CreateContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContractModal({ open, onOpenChange }: CreateContractModalProps) {
  const { toast } = useToast();
  const { data: students = [] } = useStudents();
  const { data: activeTemplate } = useActiveTemplate();
  const createMutation = useCreateContract();
  
  const [selectedStudent, setSelectedStudent] = useState('');

  const handleCreate = async () => {
    if (!selectedStudent || !activeTemplate) return;

    try {
      await createMutation.mutateAsync({
        studentId: selectedStudent,
        templateId: activeTemplate.id,
      });

      toast({
        title: 'Contrato criado!',
        description: 'O contrato foi criado como rascunho.',
      });

      onOpenChange(false);
      setSelectedStudent('');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar contrato',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Contrato
          </DialogTitle>
          <DialogDescription>
            Selecione o aluno para gerar um novo contrato usando o template ativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {activeTemplate && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Template: {activeTemplate.title}</p>
              <p className="text-xs text-muted-foreground">Versão {activeTemplate.version}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Aluno</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedStudent || !activeTemplate || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
