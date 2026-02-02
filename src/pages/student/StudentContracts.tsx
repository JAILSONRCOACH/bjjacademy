import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { SignContractModal } from '@/components/contracts/SignContractModal';
import { useStudentContracts, Contract, ContractTemplate } from '@/hooks/useContracts';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, FileSignature, Printer, CheckCircle, Clock } from 'lucide-react';

export default function StudentContracts() {
  const { data: contracts = [], isLoading } = useStudentContracts();
  const [signingContract, setSigningContract] = useState<(Contract & { template: ContractTemplate }) | null>(null);

  const handlePrint = (contract: Contract) => {
    if (contract.contract_token) {
      window.open(`/contrato/${contract.contract_token}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Meus Contratos">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const pendingContracts = contracts.filter((c) => c.status === 'sent');
  const signedContracts = contracts.filter((c) => ['signed', 'manual_signed'].includes(c.status));

  return (
    <DashboardLayout title="Meus Contratos">
      <div className="space-y-8">
        {/* Pending Contracts */}
        {pendingContracts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Aguardando Assinatura
            </h2>
            {pendingContracts.map((contract) => (
              <Card key={contract.id} className="border-amber-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {contract.template.title}
                  </CardTitle>
                  <ContractStatusBadge status={contract.status} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enviado em {format(new Date(contract.sent_at!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handlePrint(contract)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button onClick={() => setSigningContract(contract as any)}>
                      <FileSignature className="h-4 w-4 mr-2" />
                      Assinar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Signed Contracts */}
        {signedContracts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Contratos Assinados
            </h2>
            {signedContracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {contract.template.title}
                  </CardTitle>
                  <ContractStatusBadge status={contract.status} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Assinado em {format(new Date(contract.signed_at!), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <Button variant="outline" onClick={() => handlePrint(contract)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Visualizar / Imprimir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Contracts */}
        {contracts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum contrato</p>
              <p className="text-muted-foreground">
                Você ainda não possui contratos vinculados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sign Modal */}
      <SignContractModal
        open={!!signingContract}
        onOpenChange={(open) => !open && setSigningContract(null)}
        contract={signingContract as any}
      />
    </DashboardLayout>
  );
}
