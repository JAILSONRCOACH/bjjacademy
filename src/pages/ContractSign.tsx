import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useContractByToken } from '@/hooks/useContracts';
import { ContractViewer } from '@/components/contracts/ContractViewer';
import { SignContractModal } from '@/components/contracts/SignContractModal';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, FileCheck, AlertCircle, CheckCircle, Printer, FileSignature } from 'lucide-react';
import { useEffect } from 'react';

export default function ContractSign() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { data: contract, isLoading, error } = useContractByToken(token || null);
  const [showSignModal, setShowSignModal] = useState(false);

  // Auto-print if ?print=1
  useEffect(() => {
    if (searchParams.get('print') === '1' && contract) {
      setTimeout(() => window.print(), 500);
    }
  }, [searchParams, contract]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card py-4">
          <div className="container flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BJJ Academy Pro</span>
          </div>
        </header>
        <main className="container py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </main>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card py-4">
          <div className="container flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BJJ Academy Pro</span>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h1 className="text-xl font-bold mb-2">Contrato não encontrado</h1>
              <p className="text-muted-foreground">
                O link pode estar expirado ou inválido. Entre em contato com a academia.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isSigned = ['signed', 'manual_signed'].includes(contract.status);
  const isVoid = contract.status === 'void';
  const canSign = contract.status === 'sent';

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <header className="border-b border-border bg-card py-4 print:hidden">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BJJ Academy Pro</span>
          </div>
          <ContractStatusBadge status={contract.status} />
        </div>
      </header>

      <main className="container py-8 space-y-6 print:py-0">
        {/* Status Banner */}
        {isSigned && (
          <Card className="border-green-500/50 bg-green-500/10 print:hidden">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium text-green-600">Contrato Assinado</p>
                <p className="text-sm text-muted-foreground">
                  Este contrato foi assinado e está válido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isVoid && (
          <Card className="border-destructive/50 bg-destructive/10 print:hidden">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Contrato Cancelado</p>
                <p className="text-sm text-muted-foreground">
                  Este contrato foi cancelado e não é mais válido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Viewer */}
        <ContractViewer contract={contract} showActions={false} />

        {/* Actions */}
        <div className="flex gap-4 justify-center print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
          
          {canSign && (
            <Button onClick={() => setShowSignModal(true)}>
              <FileSignature className="h-4 w-4 mr-2" />
              Assinar Digitalmente
            </Button>
          )}
        </div>
      </main>

      {/* Sign Modal */}
      <SignContractModal
        open={showSignModal}
        onOpenChange={setShowSignModal}
        contract={contract}
      />
    </div>
  );
}
