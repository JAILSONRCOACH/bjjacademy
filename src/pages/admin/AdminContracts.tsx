import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { CreateContractModal } from '@/components/contracts/CreateContractModal';
import { TemplateEditorModal } from '@/components/contracts/TemplateEditorModal';
import { ViewContractModal } from '@/components/contracts/ViewContractModal';
import { MarkManualSignedModal } from '@/components/contracts/MarkManualSignedModal';
import {
  useContracts,
  useContractTemplates,
  useSendContract,
  useVoidContract,
  Contract,
  ContractTemplate,
  getContractUrl,
  prepareContractWebhookPayload,
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
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminContracts() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [manualSignContract, setManualSignContract] = useState<Contract | null>(null);

  const { data: contracts = [], isLoading } = useContracts({ status: statusFilter });
  const { data: templates = [] } = useContractTemplates();
  const sendMutation = useSendContract();
  const voidMutation = useVoidContract();

  const filteredContracts = contracts.filter((contract) =>
    contract.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendContract = async (contract: Contract) => {
    try {
      const result = await sendMutation.mutateAsync(contract.id);
      
      // Prepare webhook payload for n8n
      const payload = prepareContractWebhookPayload(result as any);
      console.log('Webhook payload para n8n:', payload);
      
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
    toast({
      title: 'Link copiado!',
      description: 'Cole no WhatsApp ou e-mail do aluno.',
    });
  };

  const handleVoidContract = async (contract: Contract) => {
    try {
      await voidMutation.mutateAsync({ contractId: contract.id, reason: 'Cancelado pelo administrador' });
      toast({
        title: 'Contrato cancelado',
        description: 'O contrato foi marcado como cancelado.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePrint = (contract: Contract) => {
    if (contract.contract_token) {
      window.open(`/contrato/${contract.contract_token}?print=1`, '_blank');
    }
  };

  const activeTemplatesCount = templates.filter((t) => t.is_active).length;

  return (
    <DashboardLayout title="Contratos">
      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: contracts.length, icon: FileText },
              { label: 'Rascunhos', value: contracts.filter((c) => c.status === 'draft').length },
              { label: 'Enviados', value: contracts.filter((c) => c.status === 'sent').length },
              { label: 'Assinados', value: contracts.filter((c) => ['signed', 'manual_signed'].includes(c.status)).length, icon: CheckCircle },
              { label: 'Cancelados', value: contracts.filter((c) => c.status === 'void').length },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
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
            <Button onClick={() => setShowCreateModal(true)} disabled={activeTemplatesCount === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>

          {activeTemplatesCount === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum template ativo</p>
                <p className="text-muted-foreground mb-4">
                  Crie um template de contrato antes de gerar contratos para alunos.
                </p>
                <Button onClick={() => setShowTemplateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          )}

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
                    <TableHead>Template</TableHead>
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
                        {contract.template?.title || 'N/A'}
                        <span className="text-xs text-muted-foreground ml-1">
                          v{contract.template?.version}
                        </span>
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Templates de Contrato</h2>
              <p className="text-muted-foreground">
                Crie e gerencie modelos de contrato para sua academia.
              </p>
            </div>
            <Button onClick={() => {
              setEditingTemplate(null);
              setShowTemplateModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum template criado</p>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro modelo de contrato.
                </p>
                <Button onClick={() => setShowTemplateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Versão {template.version}
                      </p>
                    </div>
                    {template.is_active && (
                      <span className="px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded-full">
                        Ativo
                      </span>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Criado em {format(new Date(template.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateModal(true);
                      }}
                    >
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateContractModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
      
      <TemplateEditorModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        template={editingTemplate}
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
    </DashboardLayout>
  );
}
