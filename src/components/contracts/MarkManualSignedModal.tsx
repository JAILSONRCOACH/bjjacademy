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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarkContractManualSigned, Contract } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSignature } from 'lucide-react';
import { applyCpfMask } from '@/lib/masks';

interface MarkManualSignedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
}

export function MarkManualSignedModal({ open, onOpenChange, contract }: MarkManualSignedModalProps) {
  const { toast } = useToast();
  const markMutation = useMarkContractManualSigned();

  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');

  const handleMark = async () => {
    if (!contract) return;

    try {
      await markMutation.mutateAsync({
        contractId: contract.id,
        signerName,
        signerDocument: signerDocument.replace(/\D/g, ''),
      });

      toast({
        title: 'Contrato marcado como assinado',
        description: 'A assinatura manual foi registrada.',
      });

      onOpenChange(false);
      setSignerName('');
      setSignerDocument('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isValid = signerName.trim().length >= 3 && signerDocument.replace(/\D/g, '').length === 11;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Marcar Assinado Manualmente
          </DialogTitle>
          <DialogDescription>
            Registre a assinatura física do contrato. Use quando o aluno assinou uma cópia impressa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signerName">Nome do Assinante</Label>
            <Input
              id="signerName"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signerDocument">CPF do Assinante</Label>
            <Input
              id="signerDocument"
              value={signerDocument}
              onChange={(e) => setSignerDocument(applyCpfMask(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleMark} disabled={!isValid || markMutation.isPending}>
            {markMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
