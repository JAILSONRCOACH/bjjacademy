import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowRight, Building2, CreditCard, Calendar, Users, GraduationCap, Dumbbell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Imported Content
import { AcademyForm, AcademyFormRef } from '@/components/academy/AcademyForm';
import { PlansTable } from '@/components/finance/PlansTable';
import { AgendaManager } from '@/components/agenda/AgendaManager';
import { ProfessorsManager } from '@/components/professors/ProfessorsManager';
import { ModalitiesManager } from '@/components/modalities/ModalitiesManager';
import { useRef } from 'react';

export default function OnboardingWizard() {
    const { profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Refs
    const academyFormRef = useRef<AcademyFormRef>(null);

    useEffect(() => {
        async function checkStatus() {
            if (!profile?.academy_id) return;
            const { data } = await supabase.from('academies').select('onboarding_completed, onboarding_step').eq('id', profile.academy_id).single();
            if (data?.onboarding_completed) {
                // Do not redirect automatically, allow admin to edit
            } else if (data?.onboarding_step && data.onboarding_step > 1) {
                setCurrentStep(data.onboarding_step);
            }
        }
        checkStatus();
    }, [profile, navigate]);

    const steps = [
        { id: 1, label: 'Dados da Academia', icon: Building2, description: 'Preencha dados e conta bancária' },
        { id: 2, label: 'Planos de Aula', icon: CreditCard, description: 'Cadastre seus primeiros planos' },
        { id: 3, label: 'Modalidades', icon: Dumbbell, description: 'Cadastre as modalidades (Jiu-Jitsu, Muay Thai...)' },
        { id: 4, label: 'Horários', icon: Calendar, description: 'Defina a grade de aulas' },
        { id: 5, label: 'Professores', icon: Users, description: 'Cadastre sua equipe' },
        { id: 6, label: 'Conclusão', icon: GraduationCap, description: 'Pronto para começar!' },
    ];

    const handleNext = async () => {
        setLoading(true);
        try {
            // Special handling for Step 1 (Academy Form)
            if (currentStep === 1 && academyFormRef.current) {
                const success = await academyFormRef.current.submit();
                if (!success) {
                    setLoading(false);
                    return; // Stop if save failed
                }
            }

            const nextStep = currentStep + 1;

            if (nextStep > steps.length) {
                // Finish
                await supabase.from('academies').update({ onboarding_completed: true }).eq('id', profile?.academy_id);
                await refreshProfile();
                toast({ title: 'Parabéns!', description: 'Sua academia está configurada.' });
                navigate('/admin/dashboard');
                return;
            }

            // Update step in DB
            await supabase.from('academies').update({ onboarding_step: nextStep }).eq('id', profile?.academy_id);
            setCurrentStep(nextStep);
            window.scrollTo(0, 0);

        } catch (error) {
            toast({ title: 'Erro', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b h-16 flex items-center px-8 bg-card shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <Building2 className="h-6 w-6" />
                    Configuração Inicial
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden md:inline-block">Passo {currentStep} de {steps.length}</span>
                </div>
            </header>

            <div className="flex-1 container max-w-6xl py-8 mx-auto px-4">

                {/* Progress Bar */}
                <div className="mb-8 hidden md:block">
                    <div className="flex justify-between relative px-10">
                        <div className="absolute top-5 left-0 w-full h-1 bg-muted -z-10" />
                        <div
                            className="absolute top-5 left-0 h-1 bg-primary -z-10 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 z-0">
                                    <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                                ${isActive ? 'border-primary bg-primary text-primary-foreground' :
                                            isCompleted ? 'border-primary bg-primary text-primary-foreground' :
                                                'border-muted-foreground bg-card text-muted-foreground'}
                            `}>
                                        {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-5 w-5" />}
                                    </div>
                                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <Card className="min-h-[600px] flex flex-col shadow-lg border-muted">
                    <CardHeader className="text-center border-b bg-muted/20">
                        <CardTitle className="text-2xl">{steps[currentStep - 1].label}</CardTitle>
                        <CardDescription className="text-lg">{steps[currentStep - 1].description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 p-6">
                        {currentStep === 1 && (
                            <div className="space-y-4 max-w-4xl mx-auto">
                                <div className="text-sm text-purple-600 bg-purple-50 p-4 rounded-md border border-purple-100 mb-6">
                                    ℹ️ Preencha os dados da sua academia. <strong>Dados Bancários</strong> são obrigatórios apenas para cobrancas automáticas. Se você recebe por PIX/Dinheiro manualmente, é opcional.
                                </div>
                                <AcademyForm ref={academyFormRef} onSaveSuccess={() => { }} />
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 max-w-5xl mx-auto">
                                <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                                    ℹ️ Crie os planos que serão vendidos aos alunos (Mensal, Trimestral, Anual, etc).
                                </div>
                                <PlansTable />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 max-w-5xl mx-auto">
                                <div className="text-sm text-pink-600 bg-pink-50 p-4 rounded-md border border-pink-100 mb-6">
                                    ℹ️ Antes de criar horários, defina quais modalidades sua academia oferece (Ex: Jiu-Jitsu, Muay Thai, Boxe).
                                </div>
                                <ModalitiesManager />
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4 max-w-5xl mx-auto">
                                <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md border border-green-100 mb-6">
                                    ℹ️ Defina a grade de horários. Você precisará selecionar uma modalidade cadastrada no passo anterior.
                                </div>
                                <AgendaManager />
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-4 max-w-5xl mx-auto">
                                <div className="text-sm text-orange-600 bg-orange-50 p-4 rounded-md border border-orange-100 mb-6">
                                    ℹ️ Cadastre os professores que darão as aulas. Eles receberão acesso ao painel de professor.
                                </div>
                                <ProfessorsManager />
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="text-center py-20 max-w-2xl mx-auto">
                                <div className="mb-6 flex justify-center">
                                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-bold mb-4">Tudo Pronto!</h2>
                                <p className="text-xl text-muted-foreground mb-8">
                                    Sua academia foi configurada com sucesso. Agora você pode acessar o painel principal e começar a matricular seus alunos.
                                </p>
                                <div className="bg-muted p-6 rounded-lg text-left space-y-2">
                                    <p><strong>O que fazer agora?</strong></p>
                                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                        <li>Acesse o menu <strong>Alunos</strong> para cadastrar novos alunos.</li>
                                        <li>Compartilhe o link de matrícula (em breve).</li>
                                        <li>Acompanhe os pagamentos no menu <strong>Financeiro</strong>.</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between border-t bg-muted/10 p-6 sticky bottom-0 bg-background/95 backdrop-blur z-10">
                        <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1 || loading}>
                            Voltar
                        </Button>
                        <div className="flex gap-2">
                            {currentStep < steps.length && (
                                <Button variant="ghost" onClick={async () => {
                                    if (confirm('Tem certeza? Você poderá configurar o restante depois pelo menu lateral.')) {
                                        setLoading(true);
                                        await supabase.from('academies').update({ onboarding_completed: true }).eq('id', profile?.academy_id);
                                        toast({ title: 'Configuração Adiada', description: 'Você pode terminar de configurar pela barra lateral.' });
                                        navigate('/admin/dashboard');
                                    }
                                }}>
                                    Configurar Depois
                                </Button>
                            )}
                            <Button onClick={handleNext} className="gap-2 w-40" disabled={loading}>
                                {loading ? 'Processando...' : currentStep === steps.length ? 'Ir para Dashboard' : 'Próximo Passo'}
                                {!loading && <ArrowRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
