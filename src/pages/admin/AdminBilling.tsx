import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInvoices, useCreatePaymentLink, useMarkInvoicePaid, Invoice } from '@/hooks/usePayments';
import { Loader2, Search, Link, Copy, CheckCircle, DollarSign, AlertTriangle, Ban, QrCode, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const statusLabels: Record<string, string> = {
  open: 'Em Aberto',
  paid: 'Pago',
  overdue: 'Atrasado',
  canceled: 'Cancelado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  canceled: 'outline',
};

export default function AdminBilling() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [markPaidModal, setMarkPaidModal] = useState<{ open: boolean; invoiceId: string | null }>({
    open: false,
    invoiceId: null,
  });
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [pixModal, setPixModal] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null,
  });

  const { data: invoices, isLoading } = useInvoices({ status: statusFilter });
  const createPaymentLink = useCreatePaymentLink();
  const markPaid = useMarkInvoicePaid();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleGenerateCharge = async (invoiceId: string) => {
    try {
      const result = await createPaymentLink.mutateAsync(invoiceId);
      if (result.pix_copiaecola) {
        await navigator.clipboard.writeText(result.pix_copiaecola);
        toast({
          title: 'Cobrança gerada!',
          description: 'PIX copia e cola copiado para a área de transferência.',
        });
      } else if (result.checkout_url) {
        await navigator.clipboard.writeText(result.checkout_url);
        toast({
          title: 'Cobrança gerada!',
          description: 'Link de pagamento copiado.',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar cobrança';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyPix = async (pix: string) => {
    await navigator.clipboard.writeText(pix);
    toast({
      title: 'PIX copiado!',
      description: 'Código copia e cola copiado para a área de transferência.',
    });
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: 'Link de pagamento copiado.',
    });
  };

  const handleDownloadQR = (base64: string, invoiceId: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `pix-qr-${invoiceId.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'QR Code baixado!',
    });
  };

  const handleMarkPaid = async () => {
    if (!markPaidModal.invoiceId) return;

    try {
      await markPaid.mutateAsync({ invoiceId: markPaidModal.invoiceId, method: paymentMethod });
      toast({
        title: 'Fatura marcada como paga!',
        description: 'O status do aluno será atualizado automaticamente.',
      });
      setMarkPaidModal({ open: false, invoiceId: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao marcar como pago';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const filteredInvoices = invoices?.filter((inv) => {
    if (!search) return true;
    return inv.student?.name.toLowerCase().includes(search.toLowerCase());
  });

  // Stats
  const totalOpen = invoices?.filter((i) => i.status === 'open').reduce((sum, i) => sum + i.amount, 0) || 0;
  const totalOverdue = invoices?.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0) || 0;
  const suspendedCount = invoices?.filter((i) => i.student?.status === 'suspended').length || 0;

  const hasPixData = (invoice: Invoice) => Boolean(invoice.pix_copiaecola || invoice.pix_qr_base64);

  return (
    <DashboardLayout title="Cobranças">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalOpen)}</div>
              <p className="text-xs text-muted-foreground">Faturas a receber</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</div>
              <p className="text-xs text-muted-foreground">Faturas vencidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspensos</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suspendedCount}</div>
              <p className="text-xs text-muted-foreground">Alunos por inadimplência</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Faturas</CardTitle>
            <CardDescription>Gerencie cobranças e links de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Em Aberto</SelectItem>
                  <SelectItem value="overdue">Atrasadas</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.student?.name}</p>
                            {invoice.student?.status === 'suspended' && (
                              <Badge variant="destructive" className="text-xs">Suspenso</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[invoice.status]}>
                            {statusLabels[invoice.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {invoice.status !== 'paid' && (
                              <>
                                {hasPixData(invoice) ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setPixModal({ open: true, invoice })}
                                      title="Ver PIX"
                                    >
                                      <QrCode className="h-4 w-4" />
                                    </Button>
                                    {invoice.pix_copiaecola && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopyPix(invoice.pix_copiaecola!)}
                                        title="Copiar PIX"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {invoice.checkout_url && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopyLink(invoice.checkout_url!)}
                                        title="Copiar Link"
                                      >
                                        <Link className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateCharge(invoice.id)}
                                    disabled={createPaymentLink.isPending}
                                    title="Gerar Cobrança"
                                  >
                                    {createPaymentLink.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <QrCode className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => setMarkPaidModal({ open: true, invoiceId: invoice.id })}
                                  title="Marcar Pago"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mark Paid Modal */}
      <Dialog open={markPaidModal.open} onOpenChange={(open) => setMarkPaidModal({ open, invoiceId: open ? markPaidModal.invoiceId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Marque a fatura como paga manualmente. O status do aluno será atualizado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidModal({ open: false, invoiceId: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPaid} disabled={markPaid.isPending}>
              {markPaid.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIX Modal */}
      <Dialog open={pixModal.open} onOpenChange={(open) => setPixModal({ open, invoice: open ? pixModal.invoice : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dados do PIX</DialogTitle>
            <DialogDescription>
              {pixModal.invoice?.student?.name} - {formatCurrency(pixModal.invoice?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pixModal.invoice?.pix_qr_base64 && (
              <div className="flex flex-col items-center gap-4">
                <img 
                  src={`data:image/png;base64,${pixModal.invoice.pix_qr_base64}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 border rounded-lg"
                />
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadQR(pixModal.invoice!.pix_qr_base64!, pixModal.invoice!.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
              </div>
            )}
            {pixModal.invoice?.pix_copiaecola && (
              <div className="space-y-2">
                <Label>PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input 
                    value={pixModal.invoice.pix_copiaecola} 
                    readOnly 
                    className="text-xs font-mono"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleCopyPix(pixModal.invoice!.pix_copiaecola!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {pixModal.invoice?.checkout_url && (
              <div className="space-y-2">
                <Label>Link de Pagamento</Label>
                <div className="flex gap-2">
                  <Input 
                    value={pixModal.invoice.checkout_url} 
                    readOnly 
                    className="text-xs"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleCopyLink(pixModal.invoice!.checkout_url!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {pixModal.invoice?.pix_expires_at && (
              <p className="text-xs text-muted-foreground text-center">
                Expira em: {format(new Date(pixModal.invoice.pix_expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
