import { cn } from '@/lib/utils';

type StudentStatus = 'active' | 'inactive' | 'suspended';
type FinancialStatus = 'ok' | 'pending' | 'overdue' | 'blocked';

interface StatusBadgeProps {
  status: StudentStatus | FinancialStatus;
  type: 'student' | 'financial';
}

const studentStatusConfig: Record<StudentStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-status-active/20 text-status-active' },
  inactive: { label: 'Inativo', className: 'bg-status-inactive/20 text-status-inactive' },
  suspended: { label: 'Suspenso', className: 'bg-status-suspended/20 text-status-suspended' },
};

const financialStatusConfig: Record<FinancialStatus, { label: string; className: string }> = {
  ok: { label: 'Em dia', className: 'bg-status-ok/20 text-status-ok' },
  pending: { label: 'Pendente', className: 'bg-status-pending/20 text-status-pending' },
  overdue: { label: 'Atrasado', className: 'bg-status-overdue/20 text-status-overdue' },
  blocked: { label: 'Bloqueado', className: 'bg-destructive/20 text-destructive' },
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = type === 'student' 
    ? studentStatusConfig[status as StudentStatus]
    : financialStatusConfig[status as FinancialStatus];

  return (
    <span
      className={cn(
        'px-2 py-1 rounded-md text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
