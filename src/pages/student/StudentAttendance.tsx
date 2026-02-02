import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentByProfileId } from '@/hooks/useStudents';
import { useStudentAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Clock, XCircle, Ban, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, className: 'text-status-pending' },
  approved: { label: 'Aprovada', icon: CheckCircle, className: 'text-status-ok' },
  rejected: { label: 'Rejeitada', icon: XCircle, className: 'text-status-overdue' },
};

export default function StudentAttendance() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const { data: student, isLoading: studentLoading } = useStudentByProfileId(profile?.id);
  const attendanceStudentId = student?.profile_id || profile?.id;
  const { data: attendance = [], isLoading: attendanceLoading } = useStudentAttendance(attendanceStudentId);

  const isBlocked = student?.financial_status === 'blocked';
  const isOverdue = student?.financial_status === 'overdue';

  const isLoading = studentLoading || attendanceLoading;

  if (!studentLoading && !student) {
    return (
      <DashboardLayout title="Minhas Presenças">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Registro não encontrado</p>
            <p className="text-muted-foreground mt-2">
              Seu registro de aluno ainda não foi criado. Entre em contato com a academia.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Minhas Presenças">
      <div className="space-y-6">
        {/* Blocked Alert Banner */}
        {isBlocked && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <Ban className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Acesso bloqueado</p>
                  <p className="text-sm opacity-90">Regularize sua mensalidade para voltar a treinar.</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-auto"
                  onClick={() => navigate('/student/payments')}
                >
                  Ver mensalidades
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue Warning Banner */}
        {isOverdue && !isBlocked && (
          <Card className="border-status-pending bg-status-pending/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-status-pending">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Mensalidade em atraso</p>
                  <p className="text-sm opacity-90">Regularize para evitar bloqueio.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto border-status-pending text-status-pending hover:bg-status-pending/20"
                  onClick={() => navigate('/student/payments')}
                >
                  Ver mensalidades
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Presenças</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma presença registrada ainda
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((item) => {
                  const StatusIcon = statusConfig[item.status].icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <StatusIcon className={cn("h-5 w-5", statusConfig[item.status].className)} />
                        <div>
                          <p className="font-medium">
                            {format(new Date(item.checked_in_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.checked_in_at), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        item.status === 'pending' && "bg-status-pending/20 text-status-pending",
                        item.status === 'approved' && "bg-status-ok/20 text-status-ok",
                        item.status === 'rejected' && "bg-status-overdue/20 text-status-overdue"
                      )}>
                        {statusConfig[item.status].label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
