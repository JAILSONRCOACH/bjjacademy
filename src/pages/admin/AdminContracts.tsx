import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { GenerateContractModal } from '@/components/contracts/GenerateContractModal';
import { ViewContractModal } from '@/components/contracts/ViewContractModal';
import { MarkManualSignedModal } from '@/components/contracts/MarkManualSignedModal';
import { EditContractContentModal } from '@/components/contracts/EditContractContentModal';
import {
  useContracts,
  useSendContract,
  useVoidContract,
  Contract,
  getContractUrl,
  prepareContractWebhookPayload,
  useContractTemplates,
  useCreateTemplate
} from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Plus,
  MoreHorizontal,
  Send,
  Eye,
  Copy,
  XCircle,
  Printer,
  FileSignature,
  Search,
  CheckCircle,
  Edit,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminContracts() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [manualSignContract, setManualSignContract] = useState<Contract | null>(null);

  const { data: contracts = [], isLoading } = useContracts({ status: statusFilter });
  const { data: templates = [] } = useContractTemplates();
  const createTemplate = useCreateTemplate();
  const sendMutation = useSendContract();
  const voidMutation = useVoidContract();

  // Auto-create default template if none exists
  useEffect(() => {
    const initTemplate = async () => {
      if (!isLoading && templates.length === 0) {
        try {
          // Check if we already have a pending creation to avoid double calls
          // For now just try to create if empty
          await createTemplate.mutateAsync({
            title: 'Contrato Padrão',
            body_html: '<div>Template padrão do sistema</div>', // Legacy content, we use local TS now
          });
        } catch (e) {
          console.error("Auto-creation of template failed or already exists", e);
        }
      }
    };
    initTemplate();
  }, [templates.length, isLoading]);

  const filteredContracts = contracts.filter((contract) =>
    contract.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendContract = async (contract: Contract) => {
    try {
      const result = await sendMutation.mutateAsync(contract.id);
      const payload = prepareContractWebhookPayload(result as any);
      console.log('Webhook payload:', payload);

      toast({
        title: 'Contrato enviado!',
        description: 'Link do contrato gerado. Copie e envie ao aluno.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = (contract: Contract) => {
    if (!contract.contract_token) return;
    const url = getContractUrl(contract.contract_token);
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: 'Cole no WhatsApp ou e-mail do aluno.' });
  };

  const handleVoidContract = async (contract: Contract) => {
    try {
      await voidMutation.mutateAsync({ contractId: contract.id, reason: 'Cancelado pelo administrador' });
      toast({ title: 'Contrato cancelado', description: 'O contrato foi marcado como cancelado.' });
    } catch (error: any) {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
    }
  };

  const handlePrint = (contract: Contract) => {
    if (contract.contract_token) {
      window.open(`/contrato/${contract.contract_token}?print=1`, '_blank');
    }
  };

  return (
    <DashboardLayout title="Contratos">
      <div className="space-y-6">
        {/* Stats - Simplificado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold">{contracts.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold text-yellow-600">{contracts.filter((c) => c.status === 'draft').length}</p>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold text-blue-600">{contracts.filter((c) => c.status === 'sent').length}</p>
              <p className="text-sm text-muted-foreground">Enviados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold text-green-600">
                {contracts.filter((c) => ['signed', 'manual_signed'].includes(c.status)).length}
              </p>
              <p className="text-sm text-muted-foreground">Assinados</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="signed">Assinado</SelectItem>
                <SelectItem value="manual_signed">Manual</SelectItem>
                <SelectItem value="void">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowGenerateModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        {/* Contracts Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredContracts.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Assinado em</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.student?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {contract.signed_at
                        ? format(new Date(contract.signed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingContract(contract)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(contract)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </DropdownMenuItem>
                          {['draft', 'sent'].includes(contract.status) && (
                            <DropdownMenuItem onClick={() => setEditingContract(contract)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Conteúdo
                            </DropdownMenuItem>
                          )}
                          {contract.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleSendContract(contract)}>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar para Assinatura
                            </DropdownMenuItem>
                          )}
                          {['draft', 'sent'].includes(contract.status) && (
                            <>
                              <DropdownMenuItem onClick={() => handleCopyLink(contract)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setManualSignContract(contract)}>
                                <FileSignature className="h-4 w-4 mr-2" />
                                Marcar Assinado Manual
                              </DropdownMenuItem>
                            </>
                          )}
                          {!['void', 'signed', 'manual_signed'].includes(contract.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleVoidContract(contract)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar Contrato
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum contrato encontrado.</p>
              <Button onClick={() => setShowGenerateModal(true)} variant="link" className="mt-2">
                Criar o primeiro contrato
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <GenerateContractModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
      />

      <ViewContractModal
        open={!!viewingContract}
        onOpenChange={(open) => !open && setViewingContract(null)}
        contract={viewingContract}
      />

      <MarkManualSignedModal
        open={!!manualSignContract}
        onOpenChange={(open) => !open && setManualSignContract(null)}
        contract={manualSignContract}
      />

      <EditContractContentModal
        open={!!editingContract}
        onOpenChange={(open) => !open && setEditingContract(null)}
        contract={editingContract}
      />
    </DashboardLayout>
  );
}
