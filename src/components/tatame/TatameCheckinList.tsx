import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TatameCheckin } from '@/hooks/useTatameOnline';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Ban, AlertTriangle, Check, X, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TatameCheckinListProps {
  checkins: TatameCheckin[];
  loading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-lg">Nenhum aluno no tatame</p>
      <p className="text-muted-foreground text-sm mt-1">
        Aguardando check-ins de alunos
      </p>
    </div>
  );
}

export function TatameCheckinList({ checkins, loading, onApprove, onReject }: TatameCheckinListProps) {
  if (loading) {
    return <ListSkeleton />;
  }

  if (checkins.length === 0) {
    return <EmptyState />;
  }

  // Separate pending and approved
  const pendingCheckins = checkins.filter(c => c.status === 'pending');
  const approvedCheckins = checkins.filter(c => c.status === 'approved');

  // Count blocked and overdue students (from pending only)
  const blockedCount = pendingCheckins.filter(c => c.studentRecord?.financial_status === 'blocked').length;
  const overdueCount = pendingCheckins.filter(c => c.studentRecord?.financial_status === 'overdue').length;

  const renderCheckinCard = (checkin: TatameCheckin) => {
    const name = checkin.studentRecord?.name || checkin.profile?.name || 'Aluno';
    const belt = checkin.studentRecord?.belt_current || checkin.profile?.belt || 'white';
    const stripes = checkin.studentRecord?.stripes_cached || checkin.profile?.stripes || 0;
    const time = format(new Date(checkin.checked_in_at), 'HH:mm', { locale: ptBR });
    const financialStatus = checkin.studentRecord?.financial_status || 'ok';
    const isBlocked = financialStatus === 'blocked';
    const isOverdue = financialStatus === 'overdue';
    const isApproved = checkin.status === 'approved';

    return (
      <Card 
        key={checkin.id} 
        className={cn(
          "p-4 border-l-4 transition-colors",
          isApproved
            ? "border-l-green-500 bg-green-500/5"
            : isBlocked 
              ? "border-l-destructive bg-destructive/5 opacity-75" 
              : isOverdue
                ? "border-l-status-pending hover:bg-muted/50"
                : "border-l-primary hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-4">
          <Avatar className={cn(
            "h-12 w-12",
            isApproved ? "bg-green-500/10" : isBlocked ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <AvatarFallback className={cn(
              "font-medium",
              isApproved
                ? "bg-green-500 text-white"
                : isBlocked 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-primary text-primary-foreground"
            )}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("font-semibold truncate", isBlocked && "line-through opacity-70")}>
                {name}
              </span>
              {isApproved && (
                <Badge className="gap-1 text-xs bg-green-500 hover:bg-green-600">
                  <UserCheck className="h-3 w-3" />
                  NO TATAME
                </Badge>
              )}
              {isBlocked && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <Ban className="h-3 w-3" />
                        BLOQUEADO
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aluno bloqueado por inadimplência</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isOverdue && !isBlocked && !isApproved && (
                <Badge variant="outline" className="gap-1 text-xs border-status-pending text-status-pending">
                  <AlertTriangle className="h-3 w-3" />
                  ATRASADO
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <BeltBadge belt={belt} stripes={stripes} size="sm" />
              <span className="text-sm text-muted-foreground">• {time}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-700 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Presença confirmada
              </span>
            ) : isBlocked ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive flex items-center gap-1">
                <Ban className="h-3 w-3" />
                Presença bloqueada
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onReject?.(checkin.id)}
                >
                  <X className="h-4 w-4" />
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => onApprove?.(checkin.id)}
                >
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner for blocked/overdue students */}
      {(blockedCount > 0 || overdueCount > 0) && (
        <div className="flex gap-2 flex-wrap">
          {blockedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Ban className="h-3 w-3" />
              {blockedCount} bloqueado{blockedCount > 1 ? 's' : ''}
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge variant="outline" className="gap-1 border-status-pending text-status-pending">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} em atraso
            </Badge>
          )}
        </div>
      )}

      {/* Pending check-ins section */}
      {pendingCheckins.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Aguardando Aprovação ({pendingCheckins.length})
          </h3>
          <div className="space-y-3">
            {pendingCheckins.map(renderCheckinCard)}
          </div>
        </div>
      )}

      {/* Approved check-ins section */}
      {approvedCheckins.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            No Tatame ({approvedCheckins.length})
          </h3>
          <div className="space-y-3">
            {approvedCheckins.map(renderCheckinCard)}
          </div>
        </div>
      )}
    </div>
  );
}
