import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentInvoices, useCreatePaymentLink, Invoice } from '@/hooks/usePayments';
import { Loader2, CreditCard, CheckCircle, AlertTriangle, Clock, ExternalLink, Ban, QrCode, Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export default function StudentPayments() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useStudentInvoices();
  const createPaymentLink = useCreatePaymentLink();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleGenerateCharge = async (invoiceId: string) => {
    try {
      await createPaymentLink.mutateAsync(invoiceId);
      refetch();
      toast({
        title: 'Cobrança gerada!',
        description: 'O PIX está pronto para pagamento.',
      });
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
      description: 'Cole no app do seu banco para pagar.',
    });
  };

  const handleDownloadQR = (base64: string, invoiceId: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `pix-qr-${invoiceId.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'QR Code baixado!' });
  };

  const handleOpenCheckout = (url: string) => {
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Mensalidade">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const invoices = data?.invoices || [];
  const student = data?.student;
  const isSuspended = student?.status === 'suspended';

  const openInvoices = invoices.filter((inv) => inv.status === 'open' || inv.status === 'overdue');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');

  const hasPixData = (invoice: Invoice) => Boolean(invoice.pix_copiaecola || invoice.pix_qr_base64);
  const isPixExpired = (invoice: Invoice) => {
    if (!invoice.pix_expires_at) return false;
    return new Date(invoice.pix_expires_at) < new Date();
  };

  return (
    <DashboardLayout title="Mensalidade">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minha Mensalidade</h1>
          <p className="text-muted-foreground">
            Acompanhe suas faturas e pagamentos
          </p>
        </div>

        {/* Suspension Alert */}
        {isSuspended && (
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Acesso Suspenso</AlertTitle>
            <AlertDescription>
              {student.suspended_reason || 'Seu acesso está suspenso por inadimplência.'}
              {' '}Regularize sua situação para continuar usando os serviços da academia.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Card */}
        <Card className={isSuspended ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Financeiro</CardTitle>
            {isSuspended ? (
              <Ban className="h-5 w-5 text-destructive" />
            ) : openInvoices.length === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <Badge 
              variant={isSuspended ? 'destructive' : openInvoices.length === 0 ? 'default' : 'secondary'} 
              className="text-lg px-4 py-1"
            >
              {isSuspended ? 'Suspenso' : openInvoices.length === 0 ? 'Em dia' : 'Pendente'}
            </Badge>
          </CardContent>
        </Card>

        {/* Open Invoices */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Faturas em Aberto
          </h2>
          
          {openInvoices.length > 0 ? (
            <div className="grid gap-4">
              {openInvoices.map((invoice) => (
                <Card key={invoice.id} className={invoice.status === 'overdue' ? 'border-destructive' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Vencimento</p>
                        <p className="font-medium">
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={statusVariants[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* PIX Section */}
                    {hasPixData(invoice) && !isPixExpired(invoice) ? (
                      <div className="space-y-4">
                        {invoice.pix_qr_base64 && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src={`data:image/png;base64,${invoice.pix_qr_base64}`} 
                              alt="QR Code PIX" 
                              className="w-40 h-40 border rounded-lg"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadQR(invoice.pix_qr_base64!, invoice.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar QR
                            </Button>
                          </div>
                        )}
                        
                        {invoice.pix_copiaecola && (
                          <Button 
                            className="w-full" 
                            onClick={() => handleCopyPix(invoice.pix_copiaecola!)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar PIX Copia e Cola
                          </Button>
                        )}

                        {invoice.checkout_url && (
                          <Button 
                            variant="outline"
                            className="w-full" 
                            onClick={() => handleOpenCheckout(invoice.checkout_url!)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Pagar com Cartão ou Outros
                          </Button>
                        )}

                        {invoice.pix_expires_at && (
                          <p className="text-xs text-muted-foreground text-center">
                            PIX válido até: {format(new Date(invoice.pix_expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleGenerateCharge(invoice.id)}
                        disabled={createPaymentLink.isPending}
                      >
                        {createPaymentLink.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4 mr-2" />
                        )}
                        {isPixExpired(invoice) ? 'Gerar Novo PIX' : 'Gerar PIX para Pagamento'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Você não tem faturas em aberto!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h2>
          
          {paidInvoices.length > 0 ? (
            <div className="rounded-md border">
              <div className="divide-y">
                {paidInvoices.slice(0, 10).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {format(new Date(invoice.due_date), 'MMMM yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pago em {invoice.paid_at ? format(new Date(invoice.paid_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                      <Badge variant="default">Pago</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Nenhum pagamento registrado ainda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
