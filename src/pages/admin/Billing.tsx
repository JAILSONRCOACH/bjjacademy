import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2, CreditCard } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSaasSubscription } from '@/hooks/useSaasSubscription';
import { useAcademy } from '@/hooks/useAcademy';

interface SaasPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  active: boolean;
}

export default function AdminBilling() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subscription } = useSaasSubscription();
  const { data: academy } = useAcademy();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [cardToken, setCardToken] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['saas-plans-public-checkout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_plans')
        .select('id, name, price, interval, active')
        .eq('active', true)
        .order('price', { ascending: true });
      if (error) throw error;
      return (data || []) as SaasPlan[];
    },
  });

  const selectedPlan = useMemo(
    () => plans?.find((plan) => plan.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  const formatCurrency = (valueInCents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueInCents / 100);

  const statusLabel = useMemo(() => {
    if (!subscription?.status) return 'Sem assinatura';
    if (subscription.status === 'trial') return 'Em teste';
    if (subscription.status === 'active') return 'Ativa';
    if (subscription.status === 'past_due') return 'Pagamento pendente';
    if (subscription.status === 'canceled') return 'Cancelada';
    if (subscription.status === 'lifetime') return 'Vitalícia';
    return subscription.status;
  }, [subscription?.status]);

  const handleCheckout = async () => {
    if (!profile?.academy_id) return;
    if (!selectedPlanId) {
      toast({ title: 'Selecione um plano', variant: 'destructive' });
      return;
    }
    if (!cardToken.trim()) {
      toast({
        title: 'Token do cartão obrigatório',
        description: 'Informe o token gerado pelo checkout do Pagar.me.',
        variant: 'destructive',
      });
      return;
    }
    if (!document.trim() || !phone.trim()) {
      toast({
        title: 'Dados incompletos',
        description: 'Informe CPF/CNPJ e telefone para finalizar.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        plan_id: selectedPlanId,
        academy_id: profile.academy_id,
        card_token: cardToken.trim(),
        customer_data: {
          name: academy?.responsible_name || profile.name || 'Responsável',
          email: academy?.email || profile.email || '',
          document: document.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
        },
      };

      const { data, error } = await supabase.functions.invoke('pagarme-create-subscription', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['saas-subscription-status'] }),
        queryClient.invalidateQueries({ queryKey: ['saas-subscriptions'] }),
        refreshProfile(),
      ]);

      toast({
        title: 'Plano PRO ativado',
        description: 'Pagamento processado e assinatura atualizada com sucesso.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao processar pagamento.';
      toast({ title: 'Erro no checkout', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Assinatura PRO">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Status da sua assinatura
            </CardTitle>
            <CardDescription>Plano atual e período de acesso da sua academia.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Badge variant={subscription?.isPastDue ? 'destructive' : 'secondary'}>{statusLabel}</Badge>
            {subscription?.isTrial && (
              <p className="text-sm text-muted-foreground">
                Restam {subscription.daysRemainingTrial ?? 0} dia(s) no período de teste.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escolha seu plano PRO</CardTitle>
            <CardDescription>Depois de escolher, finalize no checkout para liberar acesso contínuo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPlans ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando planos...
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {plans?.map((plan) => {
                  const selected = plan.id === selectedPlanId;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                      }`}
                    >
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-lg font-bold mt-1">{formatCurrency(plan.price)}</p>
                      <p className="text-xs text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CPF/CNPJ do responsável</Label>
                <Input
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="Somente números ou formatado"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone (com DDD)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (83) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Token do cartão (Pagar.me)</Label>
              <Input
                value={cardToken}
                onChange={(e) => setCardToken(e.target.value)}
                placeholder="card_..."
              />
              <p className="text-xs text-muted-foreground">
                Use o token gerado no checkout seguro do Pagar.me para concluir a assinatura.
              </p>
            </div>

            <Button onClick={handleCheckout} disabled={submitting || !selectedPlan || !profile?.academy_id}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {selectedPlan ? `Pagar ${formatCurrency(selectedPlan.price)} e ativar PRO` : 'Selecionar plano para continuar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

