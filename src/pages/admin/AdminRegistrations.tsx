import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Check, X, Link2, Copy, Loader2, Mail, Send } from 'lucide-react';
import { useStudentRegistrations, useApproveRegistration, useRejectRegistration, useCreateRegistrationLink, useSendInvite } from '@/hooks/useStudentRegistrations';
import { DAY_NAMES } from '@/hooks/useClassSlots';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovado', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
};

export default function AdminRegistrations() {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: registrations, isLoading } = useStudentRegistrations(activeTab as 'pending' | 'approved' | 'rejected');

  const approveRegistration = useApproveRegistration();
  const rejectRegistration = useRejectRegistration();
  const createLink = useCreateRegistrationLink();
  const sendInvite = useSendInvite();

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string>('');

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [linkTab, setLinkTab] = useState('link'); // 'link' | 'email'

  const { toast } = useToast();

  const handleApprove = async () => {
    if (selectedId) {
      await approveRegistration.mutateAsync(selectedId);
      setIsApproveOpen(false);
      setSelectedId(null);
    }
  };

  const handleReject = async () => {
    if (selectedId && rejectReason.trim()) {
      await rejectRegistration.mutateAsync({ registrationId: selectedId, reason: rejectReason });
      setIsRejectOpen(false);
      setSelectedId(null);
      setRejectReason('');
    }
  };

  const generateLink = () => {
    createLink.mutate({}, {
      onSuccess: (data) => {
        setGeneratedLink(data.url);
      }
    });
  };

  const handleSendInvite = async () => {
    if (!inviteName || !inviteEmail) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    // 1. Generate Link
    createLink.mutate({}, {
      onSuccess: async (dataLink) => {
        // 2. Send Email
        try {
          await sendInvite.mutateAsync({
            name: inviteName,
            email: inviteEmail,
            invite_url: dataLink.url
          });
          setInviteName('');
          setInviteEmail('');
          setIsLinkOpen(false);
        } catch (error) {
          // Error handled by mutation
        }
      }
    });
  };

  return (
    <DashboardLayout title="Cadastros Pendentes">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setGeneratedLink('');
              setInviteName('');
              setInviteEmail('');
              setLinkTab('link');
              setIsLinkOpen(true);
              generateLink(); // Auto generate link for the "Link" tab
            }}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Link de Cadastro
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cadastros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="approved">Aprovados</TabsTrigger>
                <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations?.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {reg.email && <div>{reg.email}</div>}
                              {reg.phone && <div>{reg.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {reg.birth_date ? format(new Date(reg.birth_date), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>{reg.computed_category || '-'}</TableCell>
                          <TableCell>{reg.modality?.name || '-'}</TableCell>
                          <TableCell>
                            {reg.class_slot ? (
                              <span className="text-xs">
                                {DAY_NAMES[reg.class_slot.day_of_week]} {reg.class_slot.start_time}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{reg.plan?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{reg.source === 'link' ? 'Link' : 'Manual'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_LABELS[reg.status].variant}>
                              {STATUS_LABELS[reg.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reg.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-green-500"
                                  onClick={() => {
                                    setSelectedId(reg.id);
                                    setIsApproveOpen(true);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedId(reg.id);
                                    setIsRejectOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {reg.status === 'rejected' && reg.rejection_reason && (
                              <span className="text-xs text-muted-foreground" title={reg.rejection_reason}>
                                Ver motivo
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {registrations?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            Nenhum cadastro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Approve Confirmation */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Cadastro?</DialogTitle>
            <DialogDescription>
              O aluno será ativado e poderá acessar o portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={approveRegistration.isPending}>
              {approveRegistration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectRegistration.isPending}
            >
              {rejectRegistration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link / Invite Modal */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link de Cadastro</DialogTitle>
            <DialogDescription>
              Compartilhe o link para novos alunos.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={linkTab} onValueChange={setLinkTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Link Rápido</TabsTrigger>
              <TabsTrigger value="email">Enviar por Email</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg break-all text-sm">
                {createLink.isPending ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando...
                  </div>
                ) : (
                  generatedLink || 'Clique em gerar para criar um novo link'
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={generateLink}
                  disabled={createLink.isPending}
                >
                  Gerar Novo
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (generatedLink) {
                      navigator.clipboard.writeText(generatedLink);
                      toast({ title: 'Link copiado!' });
                    }
                  }}
                  disabled={!generatedLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Aluno</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: joao@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendInvite}
                disabled={createLink.isPending || sendInvite.isPending || !inviteName || !inviteEmail}
              >
                {(createLink.isPending || sendInvite.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Convite
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
