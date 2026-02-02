import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BeltBadge } from '@/components/students/BeltBadge';
import { Attendance } from '@/hooks/useAttendance';
import { Check, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceTableProps {
  attendance: Attendance[];
  loading?: boolean;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewStudent?: (attendance: Attendance) => void;
  approvingId?: string;
  rejectingId?: string;
}

const statusConfig = {
  pending: { label: 'Pendente', className: 'bg-status-pending/20 text-status-pending' },
  approved: { label: 'Aprovada', className: 'bg-status-ok/20 text-status-ok' },
  rejected: { label: 'Rejeitada', className: 'bg-status-overdue/20 text-status-overdue' },
};

const sourceLabels = {
  app: 'App',
  manual: 'Manual',
  qrcode: 'QR Code',
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-lg">Nenhuma presença encontrada</p>
      <p className="text-muted-foreground text-sm mt-1">
        Ajuste os filtros ou aguarde novos check-ins
      </p>
    </div>
  );
}

export function AttendanceTable({
  attendance,
  loading,
  showActions = false,
  onApprove,
  onReject,
  onViewStudent,
  approvingId,
  rejectingId,
}: AttendanceTableProps) {
  if (loading) {
    return <TableSkeleton />;
  }

  if (attendance.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Aluno</TableHead>
            <TableHead className="font-semibold">Faixa</TableHead>
            <TableHead className="font-semibold">Check-in</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Origem</TableHead>
            <TableHead className="font-semibold">Validado por</TableHead>
            {showActions && <TableHead className="font-semibold text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.map((item) => (
            <TableRow 
              key={item.id} 
              className={cn(
                "transition-colors",
                item.status === 'pending' && "hover:bg-status-pending/5"
              )}
            >
              <TableCell className="font-medium">
                <button
                  onClick={() => onViewStudent?.(item)}
                  className="hover:underline text-left flex items-center gap-2"
                >
                  {item.student?.name || 'Aluno não encontrado'}
                  {onViewStudent && (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </TableCell>
              <TableCell>
                {item.student && (
                  <BeltBadge 
                    belt={item.student.belt} 
                    stripes={item.student.stripes}
                    size="sm"
                  />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(item.checked_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <span className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium",
                  statusConfig[item.status].className
                )}>
                  {statusConfig[item.status].label}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sourceLabels[item.source]}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.validator?.name || '-'}
                {item.validated_at && (
                  <span className="block text-xs">
                    {format(new Date(item.validated_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                )}
              </TableCell>
              {showActions && item.status === 'pending' && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-status-ok border-status-ok/30 hover:bg-status-ok/10"
                      onClick={() => onApprove?.(item.id)}
                      disabled={approvingId === item.id || rejectingId === item.id}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-status-overdue border-status-overdue/30 hover:bg-status-overdue/10"
                      onClick={() => onReject?.(item.id)}
                      disabled={approvingId === item.id || rejectingId === item.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
              {showActions && item.status !== 'pending' && (
                <TableCell />
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
