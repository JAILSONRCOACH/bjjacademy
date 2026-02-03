import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CreditCard, Check, ShieldCheck, Zap, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function LockScreen() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    // Fetch Active Plans
    const { data: plans, isLoading: loadingPlans } = useQuery({
        queryKey: ['saas-plans-public'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('saas_plans')
                .select('*')
                .eq('active', true)
                .order('price', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const handleSubscribe = (planId: string) => {
        // This will be implemented when Pagar.me is integrated
        // For now, redirect to billing or show alert
        if (profile?.role === 'admin') {
            navigate('/admin/billing');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background elements for aesthetic */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-5xl z-10 space-y-8">
                <div className="text-center space-y-4">
                    <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                        <Lock className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        Seu período de teste <span className="text-destructive underline decoration-dotted">terminou</span>.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Escolha um plano para continuar evoluindo sua academia com o melhor sistema de gestão de BJJ.
                    </p>
                </div>

                {profile?.role === 'admin' ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {loadingPlans ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="animate-pulse bg-muted h-[400px]" />
                            ))
                        ) : (
                            plans?.map((plan) => (
                                <Card key={plan.id} className={`relative flex flex-col border-2 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 ${plan.name.toLowerCase().includes('pro') ? 'border-primary scale-105 z-20' : ''}`}>
                                    {plan.name.toLowerCase().includes('pro') && (
                                        <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-center py-1 text-xs font-bold rounded-t-sm">
                                            RECOMENDADO
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex justify-between items-center mb-2">
                                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                            {plan.name.toLowerCase().includes('elite') ? <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" /> :
                                                plan.name.toLowerCase().includes('pro') ? <Zap className="h-6 w-6 text-primary fill-primary" /> :
                                                    <ShieldCheck className="h-6 w-6 text-muted-foreground" />}
                                        </div>
                                        <CardDescription>
                                            Ideal para academias que buscam {plan.name.toLowerCase().includes('basic') ? 'o básico' : 'alta performance'}.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="mb-6">
                                            <span className="text-4xl font-extrabold">{formatCurrency(plan.price)}</span>
                                            <span className="text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                        </div>
                                        <ul className="space-y-3">
                                            <li className="flex items-center text-sm">
                                                <Check className="h-4 w-4 text-primary mr-2" />
                                                Gestão Completa de Alunos
                                            </li>
                                            <li className="flex items-center text-sm">
                                                <Check className="h-4 w-4 text-primary mr-2" />
                                                Controle de Presença (Check-in)
                                            </li>
                                            <li className="flex items-center text-sm">
                                                <Check className="h-4 w-4 text-primary mr-2" />
                                                Financeiro e Mensalidades
                                            </li>
                                            {plan.name.toLowerCase().includes('pro') && (
                                                <>
                                                    <li className="flex items-center text-sm">
                                                        <Check className="h-4 w-4 text-primary mr-2" />
                                                        Relatórios Avançados
                                                    </li>
                                                    <li className="flex items-center text-sm">
                                                        <Check className="h-4 w-4 text-primary mr-2" />
                                                        Suporte Prioritário
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="pt-4 border-t">
                                        <Button onClick={() => handleSubscribe(plan.id)} className="w-full font-bold" variant={plan.name.toLowerCase().includes('pro') ? 'default' : 'outline'}>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Assinar {plan.name}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    <Card className="max-w-md mx-auto border-destructive">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-destructive">Acesso Restrito</CardTitle>
                            <CardDescription>
                                Somente o administrador da academia pode gerenciar a assinatura.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                O período de uso deste sistema expirou. Entre em contato com o responsável para regularizar o acesso.
                            </p>
                            <Button variant="outline" onClick={() => signOut()} className="w-full">
                                Sair da Conta
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-center gap-4 text-sm text-muted-foreground pt-8">
                    <button onClick={() => signOut()} className="hover:text-foreground underline">Sair e entrar em outra conta</button>
                    <span>•</span>
                    <a href="#" className="hover:text-foreground underline">Suporte Técnico</a>
                </div>
            </div>
        </div>
    );
}
