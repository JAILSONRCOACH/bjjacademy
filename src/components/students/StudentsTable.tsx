import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BeltBadge } from './BeltBadge';
import { StatusBadge } from './StatusBadge';
import { Student, BeltRule, calculateClassesToNextStripe } from '@/hooks/useStudents';
import { CreateSubscriptionModal } from '@/components/finance/CreateSubscriptionModal';
import { EditStudentModal } from './EditStudentModal';
import { MoreHorizontal, CreditCard, Pencil, Trash2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentsTableProps {
  students: Student[];
  beltRules: BeltRule[];
  loading?: boolean;
  showActions?: boolean;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-lg">Nenhum aluno encontrado</p>
      <p className="text-muted-foreground text-sm mt-1">
        Tente ajustar os filtros ou adicione um novo aluno
      </p>
    </div>
  );
}

export function StudentsTable({ students, beltRules, loading, showActions = false }: StudentsTableProps) {
  const [subscriptionStudent, setSubscriptionStudent] = useState<{ id: string; name: string } | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Aluno excluído com sucesso' });
      setDeletingStudent(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleResendCredentials = async (student: Student) => {
    try {
      toast({
        title: 'Enviando credenciais...',
        description: 'Por favor aguarde.',
      });

      // Validate session first. If token is stale, try a refresh and fail fast when invalid.
      const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
      if (currentUserError || !currentUser?.user) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshed?.session?.access_token) {
          throw new Error('Sessão expirada. Faça login novamente e tente de novo.');
        }
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('Sessão expirada. Faça login novamente e tente de novo.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/resend-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          student_id: student.profile_id || student.id,
          login_url: window.location.origin + '/login',
        }),
      });

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseBody?.error || `Erro ${response.status} ao reenviar credenciais`);
      }

      const data = responseBody;
      if (!data.ok) throw new Error(data.error || 'Erro desconhecido');

      const targetEmail = student.email || '(sem email cadastrado)';
      const emailError = data.email_error ? ` Motivo: ${data.email_error}` : '';

      toast({
        title: 'Credenciais enviadas!',
        description: data.email_sent
          ? `Email enviado para ${targetEmail}. SENHA: ${data.debug_password}`
          : `AVISO: Email não enviado para ${targetEmail}. SENHA: ${data.debug_password}.${emailError}`,
        variant: data.email_sent ? 'default' : 'destructive',
        duration: 10000,
      });

    } catch (error: any) {
      toast({
        title: 'Erro ao reenviar credenciais',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  if (students.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Faixa</TableHead>
              <TableHead className="font-semibold text-center">Graus</TableHead>
              <TableHead className="font-semibold text-center">Total Aulas</TableHead>
              <TableHead className="font-semibold text-center">Aulas no Ciclo</TableHead>
              <TableHead className="font-semibold text-center">P/ Próx. Grau</TableHead>
              <TableHead className="font-semibold">Financeiro</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Instrutor</TableHead>
              {showActions && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  <BeltBadge belt={student.belt_current} showStripes={false} />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-0.5">
                    {student.stripes_cached > 0 ? (
                      Array.from({ length: student.stripes_cached }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-5 bg-foreground/70 rounded-sm"
                        />
                      ))
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">{student.total_classes}</TableCell>
                <TableCell className="text-center">{student.belt_cycle_classes}</TableCell>
                <TableCell className="text-center font-medium">
                  {calculateClassesToNextStripe(student.belt_current, student.belt_cycle_classes, beltRules)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={student.financial_status} type="financial" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={student.status} type="student" />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.instructor?.name || '-'}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => setEditingStudent(student)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSubscriptionStudent({ id: student.id, name: student.name })}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Criar Assinatura
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingStudent(student)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleResendCredentials(student)}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reenviar Credenciais
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {subscriptionStudent && (
        <CreateSubscriptionModal
          open={!!subscriptionStudent}
          onClose={() => setSubscriptionStudent(null)}
          studentId={subscriptionStudent.id}
          studentName={subscriptionStudent.name}
        />
      )}

      <EditStudentModal
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
      />

      <AlertDialog open={!!deletingStudent} onOpenChange={() => setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno "{deletingStudent?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingStudent && deleteMutation.mutate(deletingStudent.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
