import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building2, DollarSign, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function SaasDashboard() {

    const { data: stats, isLoading } = useQuery({
        queryKey: ['saas-dashboard-stats'],
        queryFn: async () => {
            // 1. Total Academies (Active)
            const { count: activeAcademies } = await supabase
                .from('saas_subscriptions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active');

            // 2. MRR (Approximate based on plans)
            // This is a rough calculation. Ideally calculate from actual payments.
            const { data: subs } = await supabase
                .from('saas_subscriptions')
                .select('plan_id, status')
                .eq('status', 'active');

            let mrr = 0;
            if (subs && subs.length > 0) {
                // Fetch plans prices to sum up
                // Optimization: Could do a join or cache prices
                const planIds = subs.map(s => s.plan_id).filter(Boolean);
                if (planIds.length > 0) {
                    const { data: plans } = await supabase
                        .from('saas_plans')
                        .select('id, price')
                        .in('id', planIds as string[]);

                    if (plans) {
                        const priceMap = new Map(plans.map(p => [p.id, p.price]));
                        subs.forEach(s => {
                            if (s.plan_id && priceMap.has(s.plan_id)) {
                                mrr += priceMap.get(s.plan_id) || 0;
                            }
                        });
                    }
                }
            }

            // 3. Recent Active Subscriptions
            const { data: recentActive } = await supabase
                .from('saas_subscriptions')
                .select(`
            id, 
            status, 
            academies:academy_id (name, phone)
        `)
                .eq('status', 'active')
                .order('updated_at', { ascending: false })
                .limit(5);

            return {
                activeAcademies: activeAcademies || 0,
                mrr: mrr, // in cents
                recentActive: recentActive || []
            };
        }
    });

    return (
        <DashboardLayout title="Gestão SaaS">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Academias Ativas</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-20" /> : (
                                <div className="text-2xl font-bold">{stats?.activeAcademies}</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Assinantes pagantes
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Recorrente (MRR)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-32" /> : (
                                <div className="text-2xl font-bold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((stats?.mrr || 0) / 100)}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Estimativa mensal
                            </p>
                        </CardContent>
                    </Card>
                    {/* Total Students Card Removed */}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Active Subscriptions List */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Assinaturas Ativas Recentemente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[200px] w-full" />
                            ) : (
                                <div className="space-y-4">
                                    {stats?.recentActive?.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa encontrada.</p>
                                    ) : (
                                        stats?.recentActive?.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-sm">{sub.academies?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{sub.academies?.phone || 'Sem telefone'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full inline-block">
                                                        Ativo
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Ações Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <Button asChild className="w-full">
                                    <Link to="/saas/assinaturas">Gerenciar Assinaturas</Link>
                                </Button>
                                <Button variant="outline" asChild className="w-full">
                                    <Link to="/saas/planos">Gerenciar Planos</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
