import { Badge } from '@/components/ui/badge';
import { ContractStatus } from '@/hooks/useContracts';
import { cn } from '@/lib/utils';

const statusConfig: Record<ContractStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  sent: { label: 'Enviado', variant: 'outline' },
  signed: { label: 'Assinado', variant: 'default' },
  manual_signed: { label: 'Assinado (Manual)', variant: 'default' },
  void: { label: 'Cancelado', variant: 'destructive' },
};

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        status === 'signed' && 'bg-green-600 hover:bg-green-700',
        status === 'manual_signed' && 'bg-green-600 hover:bg-green-700',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
