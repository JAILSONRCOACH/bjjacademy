import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TatameCheckinList } from '@/components/tatame/TatameCheckinList';
import { TatameStats } from '@/components/tatame/TatameStats';
import { useTatameOnline } from '@/hooks/useTatameOnline';
import { useApproveAttendance, useRejectAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Radio, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAttendance() {
  const { profile } = useAuth();
  const { checkins, stats, isLoading, error } = useTatameOnline();
  const approveMutation = useApproveAttendance();
  const rejectMutation = useRejectAttendance();

  const handleApprove = async (attendanceId: string) => {
    if (!profile?.id) return;
    try {
      await approveMutation.mutateAsync({ attendanceId, validatorId: profile.id });
      toast.success('Presença aprovada!');
    } catch (err) {
      toast.error('Erro ao aprovar presença');
    }
  };

  const handleReject = async (attendanceId: string) => {
    if (!profile?.id) return;
    try {
      await rejectMutation.mutateAsync({ attendanceId, validatorId: profile.id });
      toast.success('Presença rejeitada');
    } catch (err) {
      toast.error('Erro ao rejeitar presença');
    }
  };

  if (error) {
    return (
      <DashboardLayout title="Tatame Online">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Erro ao carregar dados: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h1 className="text-3xl font-bold">Tatame Online</h1>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Monitoramento em tempo real
            </p>
          </div>

          {stats.lastEventTime && (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Último evento:</span>
              <span className="font-medium">
                {format(new Date(stats.lastEventTime), 'HH:mm:ss', { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main list - 2 columns */}
          <div className="lg:col-span-2">
            <TatameCheckinList 
              checkins={checkins} 
              loading={isLoading}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <TatameStats stats={stats} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
