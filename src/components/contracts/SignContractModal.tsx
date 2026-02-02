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
import { Checkbox } from '@/components/ui/checkbox';
import { SignaturePad } from './SignaturePad';
import { useSignContract, Contract, ContractTemplate } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileCheck } from 'lucide-react';
import { applyCpfMask } from '@/lib/masks';

interface SignContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: (Contract & { template: ContractTemplate; student: { name: string; cpf: string | null } }) | null;
}

export function SignContractModal({ open, onOpenChange, contract }: SignContractModalProps) {
  const { toast } = useToast();
  const signMutation = useSignContract();
  
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const handleSign = async () => {
    if (!contract || !signature) return;

    try {
      await signMutation.mutateAsync({
        contractId: contract.id,
        signerName,
        signerDocument: signerDocument.replace(/\D/g, ''),
        signatureSvg: signature,
      });

      toast({
        title: 'Contrato assinado!',
        description: 'Sua assinatura foi registrada com sucesso.',
      });

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erro ao assinar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setSignerName('');
    setSignerDocument('');
    setSignature(null);
    setAccepted(false);
  };

  const isValid = signerName.trim().length >= 3 && 
                  signerDocument.replace(/\D/g, '').length === 11 && 
                  signature && 
                  accepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Assinar Contrato
          </DialogTitle>
          <DialogDescription>
            Preencha seus dados e desenhe sua assinatura para confirmar o contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signerName">Nome Completo</Label>
            <Input
              id="signerName"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signerDocument">CPF</Label>
            <Input
              id="signerDocument"
              value={signerDocument}
              onChange={(e) => setSignerDocument(applyCpfMask(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label>Assinatura Digital</Label>
            <SignaturePad onSignatureChange={setSignature} />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="accept"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <label
              htmlFor="accept"
              className="text-sm text-muted-foreground leading-tight cursor-pointer"
            >
              Li e aceito todos os termos e condições do contrato de matrícula apresentado.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSign}
            disabled={!isValid || signMutation.isPending}
          >
            {signMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assinar Contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
