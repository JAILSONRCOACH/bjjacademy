import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentByProfileId, useBeltRules } from '@/hooks/useStudents';
import { useStudentAttendance, useCheckIn, useStudentEnrolledSlots } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, CheckCircle, Clock, XCircle, Loader2, Ban, 
  Wifi, Trophy, Target, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { SelectClassSlotModal } from '@/components/students/SelectClassSlotModal';
import { BELT_LABELS } from '@/lib/beltSystem';

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, className: 'text-status-pending' },
  approved: { label: 'Aprovada', icon: CheckCircle, className: 'text-status-ok' },
  rejected: { label: 'Rejeitada', icon: XCircle, className: 'text-status-overdue' },
};

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  
  const { data: student, isLoading: studentLoading } = useStudentByProfileId(profile?.id);
  const { data: beltRules = [] } = useBeltRules(profile?.academy_id);
  const attendanceStudentId = student?.profile_id || profile?.id;
  const { data: attendance = [], isLoading: attendanceLoading } = useStudentAttendance(attendanceStudentId);
  // Get only the class slots the student is enrolled in
  const { data: enrolledSlots = [], isLoading: slotsLoading } = useStudentEnrolledSlots(student?.id, profile?.academy_id);
  const checkInMutation = useCheckIn();

  const isBlocked = student?.financial_status === 'blocked';
  const isOverdue = student?.financial_status === 'overdue';

  // Get current belt rule
  const currentRule = beltRules.find(r => r.belt === student?.belt_current);
  const classesPerStripe = currentRule?.classes_per_stripe || 30;
  const stripesToPromote = currentRule?.stripes_to_promote || 4;
  
  // Calculate progress
  const classesInCycle = student?.belt_cycle_classes || 0;
  const totalClasses = student?.total_classes || 0;
  const currentStripes = student?.stripes_cached || 0;
  
  // Total classes needed to next belt (all stripes)
  const totalClassesForBelt = classesPerStripe * stripesToPromote;
  const classesInBeltCycle = classesInCycle % totalClassesForBelt;
  
  // Progress to next stripe
  const classesToNextStripe = classesPerStripe - (classesInCycle % classesPerStripe);
  const progressToStripe = ((classesInCycle % classesPerStripe) / classesPerStripe) * 100;
  
  // Next objective
  const nextStripe = currentStripes + 1;
  const isEligibleForBelt = currentStripes >= 4 && student?.belt_current !== 'black';

  // Approved classes count
  const approvedClasses = attendance.filter(a => a.status === 'approved').length;

  const handleOpenSlotModal = () => {
    if (!student || !profile?.academy_id) {
      toast({
        title: 'Erro',
        description: 'Registro de aluno não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    if (isBlocked) {
      setShowBlockedModal(true);
      return;
    }

    setShowSlotModal(true);
  };

  const handleCheckIn = async (classSlotId: string) => {
    if (!student || !profile?.academy_id) return;

    try {
      const studentIdForAttendance = student.profile_id || profile.id;
      await checkInMutation.mutateAsync({
        studentId: studentIdForAttendance,
        academyId: profile.academy_id,
        classSlotId,
      });
      setShowSlotModal(false);
      toast({
        title: 'Check-in realizado!',
        description: 'Aguarde a aprovação do instrutor.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no check-in',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isLoading = studentLoading || attendanceLoading;

  if (studentLoading) {
    return (
      <DashboardLayout title="Meu Painel">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Meu Painel">
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
    <DashboardLayout title="Meu Painel">
      <div className="space-y-6">
        {/* Profile Card with gradient */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-violet-500 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <p className="text-white/80">
                  Faixa {BELT_LABELS[student.belt_current]} • {currentStripes} Grau{currentStripes !== 1 ? 's' : ''}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-white/60" />
            </div>
            
            <div className="grid grid-cols-2 gap-8 mt-6">
              <div>
                <p className="text-white/70 text-sm uppercase tracking-wide">Aulas no Ciclo</p>
                <p className="text-4xl font-bold">
                  {classesInCycle}
                  <span className="text-lg font-normal text-white/70">/{totalClassesForBelt}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm uppercase tracking-wide">Frequência Total</p>
                <p className="text-4xl font-bold">{totalClasses}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Check-in Card */}
        <Card className={cn(
          "border-primary/20",
          isBlocked ? "border-destructive/30" : ""
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Presença
            </CardTitle>
            <Badge variant="outline" className="bg-status-ok/20 text-status-ok border-status-ok/30">
              <span className="w-2 h-2 rounded-full bg-status-ok mr-2" />
              Tatame Aberto
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              size="lg"
              onClick={handleOpenSlotModal}
              disabled={isBlocked}
              variant={isBlocked ? "destructive" : "default"}
              className="w-full py-6 text-lg"
            >
              {isBlocked && <Ban className="mr-2 h-5 w-5" />}
              <Wifi className="mr-2 h-5 w-5" />
              {isBlocked ? "Bloqueado" : "Confirmar Presença"}
            </Button>
            {!isBlocked && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                Selecione o horário da aula que você vai treinar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evolution Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Minha Evolução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso Atual</span>
                <span className="font-medium">{Math.round(progressToStripe)}%</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "h-2 flex-1 rounded",
                      i < Math.ceil(progressToStripe / 20) ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Próximo Objetivo</p>
                <p className="text-lg font-semibold">
                  {isEligibleForBelt ? 'Troca de Faixa' : `${nextStripe}º Grau`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Faltam</p>
                <p className="text-lg font-semibold">
                  {student.belt_current === 'black' ? 'N/A' : `${classesToNextStripe} aulas`}
                </p>
              </div>
            </div>

            {isEligibleForBelt && (
              <Badge className="w-full justify-center py-2 bg-primary text-primary-foreground">
                <Trophy className="h-4 w-4 mr-2" />
                Apto para troca de faixa!
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Últimas Presenças
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/aluno/presencas')}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma presença registrada ainda
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.slice(0, 5).map((item) => {
                  const StatusIcon = statusConfig[item.status].icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={cn("h-5 w-5", statusConfig[item.status].className)} />
                        <div>
                          <p className="font-medium text-sm">
                            {format(new Date(item.checked_in_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.checked_in_at), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
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

      {/* Blocked Modal */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Acesso bloqueado
            </DialogTitle>
            <DialogDescription>
              Sua mensalidade está pendente. Regularize para voltar a treinar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBlockedModal(false)}>
              Fechar
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                setShowBlockedModal(false);
                navigate('/aluno/mensalidade');
              }}
            >
              Ver mensalidades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Select Class Slot Modal */}
      <SelectClassSlotModal
        open={showSlotModal}
        onOpenChange={setShowSlotModal}
        slots={enrolledSlots}
        isLoading={slotsLoading}
        onSelect={handleCheckIn}
        isPending={checkInMutation.isPending}
      />
    </DashboardLayout>
  );
}
