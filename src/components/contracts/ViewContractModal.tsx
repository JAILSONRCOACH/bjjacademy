import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ContractViewer } from './ContractViewer';
import { Contract, ContractTemplate, useContractSignatures } from '@/hooks/useContracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileSignature, User, Calendar } from 'lucide-react';

interface ViewContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
}

export function ViewContractModal({ open, onOpenChange, contract }: ViewContractModalProps) {
  const { data: signatures = [] } = useContractSignatures(contract?.id);

  if (!contract || !contract.template || !contract.student) {
    return null;
  }

  // Cast to expected type
  const contractWithDetails = contract as Contract & {
    template: ContractTemplate;
    student: {
      name: string;
      email: string | null;
      cpf: string | null;
      birth_date: string | null;
      guardian_name: string | null;
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Contrato - {contract.student?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <ContractViewer contract={contractWithDetails} />

          {/* Signatures */}
          {signatures.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Assinaturas
              </h3>
              <div className="space-y-4">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{sig.signer_name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({sig.signer_document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sig.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        <span className="text-xs px-2 py-0.5 bg-background rounded">
                          {sig.method === 'digital' ? 'Digital' : 'Manual'}
                        </span>
                      </div>
                    </div>
                    {sig.signature_svg && (
                      <div className="w-32 h-16 border rounded bg-white overflow-hidden">
                        <img
                          src={sig.signature_svg}
                          alt="Assinatura"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
