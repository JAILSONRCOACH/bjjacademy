import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import {
    CheckCircle2,
    TrendingUp,
    Users,
    ShieldCheck,
    Calendar,
    Building2,
    Trophy,
    Star,
    Instagram,
    Mail,
    MessageCircle,
    Zap,
    Eye,
    Clock,
    DollarSign,
    FileText,
    AlertTriangle,
    Lock,
    Activity,
    UserCheck,
    Filter,
    BarChart3,
    Bell,
    Award,
    Target,
    Play,
    FileSignature,
    Link2,
    Smartphone,
    PenTool
} from "lucide-react";

export default function Landing() {
    const whatsappLink = "https://wa.me/5583991287155?text=Olá! Gostaria de saber mais sobre o BJJ Academy Pro.";

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            {/* Hero Section - Redesigned */}
            <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* Logo */}
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <img
                                    src="/logo.jpg"
                                    alt="BJJ Academy Pro"
                                    className="w-28 h-28 lg:w-36 lg:h-36 rounded-full object-cover shadow-2xl border-4 border-primary/30"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> AO VIVO
                                </div>
                            </div>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
                                Gestão 360 da sua academia
                            </span>
                            <br />
                            <span className="text-primary">com Tatami Online e Assinatura Digital</span>
                        </h1>

                        {/* Sub-headline */}
                        <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            Check-in com aprovação + visão ao vivo por faixa e turma + <strong>Financeiro e Contratos Digitais</strong>.
                            Professor faz chamada. Admin controla tudo. Aluno acompanha evolução no app.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                            <a href="#demo">
                                <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-105 transition-all group">
                                    <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                                    Ver Demonstração do Tatami
                                </Button>
                            </a>
                            <Link to="/signup">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg hover:bg-muted/50">
                                    Começar 7 Dias Grátis
                                </Button>
                            </Link>
                        </div>

                        <p className="text-sm text-muted-foreground pt-2">
                            <CheckCircle2 className="inline-block w-4 h-4 mr-1 text-green-500" /> Sem cartão de crédito para começar
                        </p>
                    </div>
                </div>
            </section>

            {/* Social Proof Bar */}
            <section className="py-6 border-y bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>+100 Academias</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>+5.000 Alunos Gerenciados</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>Nota 5.0 ⭐</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* TATAMI ONLINE Section - NEW */}
            <section id="tatami" className="py-24 bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-medium mb-4">
                                <Activity className="w-4 h-4" /> EXCLUSIVO
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-bold">Tatami Online em Tempo Real</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Quando o aluno faz check-in, o nome aparece <strong>na hora</strong> para aprovação do professor e do administrador.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Demo Visual - Mock */}
                            <div id="demo" className="relative">
                                <div className="bg-card border rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-green-500" /> Tatami Online
                                        </h3>
                                        <span className="text-sm text-muted-foreground">Sexta, 14:30</span>
                                    </div>

                                    {/* Live Stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-bold text-primary">18</p>
                                            <p className="text-xs text-muted-foreground">Treinando Agora</p>
                                        </div>
                                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-bold text-blue-500">14</p>
                                            <p className="text-xs text-muted-foreground">Masculino</p>
                                        </div>
                                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-bold text-pink-500">4</p>
                                            <p className="text-xs text-muted-foreground">Feminino</p>
                                        </div>
                                    </div>

                                    {/* Simulated List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AZ</div>
                                                <div>
                                                    <p className="font-medium text-sm">Carlos Silva</p>
                                                    <p className="text-xs text-muted-foreground">Faixa Azul • 2 graus</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">✓ Aprovado</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">BR</div>
                                                <div>
                                                    <p className="font-medium text-sm">Ana Rodrigues</p>
                                                    <p className="text-xs text-muted-foreground">Faixa Branca • 3 graus</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">⏳ Pendente</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">RX</div>
                                                <div>
                                                    <p className="font-medium text-sm">Pedro Santos</p>
                                                    <p className="text-xs text-muted-foreground">Faixa Roxa • 1 grau</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">✓ Aprovado</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative elements */}
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-green-500/20 rounded-full blur-2xl" />
                            </div>

                            {/* Features List */}
                            <div className="space-y-6">
                                <FeatureItem
                                    icon={<UserCheck className="w-6 h-6 text-green-500" />}
                                    title="Check-in com Aprovação"
                                    description="Professor ou admin aprova a entrada do aluno em tempo real. Sem fraudes."
                                />
                                <FeatureItem
                                    icon={<Eye className="w-6 h-6 text-blue-500" />}
                                    title="Lista ao Vivo por Faixa e Status"
                                    description="Veja quem está treinando agora, filtrado por faixa, sexo, turma e professor."
                                />
                                <FeatureItem
                                    icon={<Building2 className="w-6 h-6 text-purple-500" />}
                                    title="Visão por Unidade (Multi-Academia)"
                                    description="Se você tem mais de uma academia, veja a ocupação de cada tatame separadamente."
                                />
                                <FeatureItem
                                    icon={<Clock className="w-6 h-6 text-amber-500" />}
                                    title="Histórico e Auditoria de Presença"
                                    description="Saiba quem aprovou cada check-in e quando. Transparência total."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINANCEIRO 360 Section - NEW */}
            <section id="financeiro" className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-4">
                                <DollarSign className="w-4 h-4" /> ADMINISTRATIVO COMPLETO
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-bold">Financeiro 360° & Relatórios</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Despesas fixas e variáveis, recebimentos, inadimplência e fluxo de caixa — tudo num só lugar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FinanceCard
                                icon={<TrendingUp className="w-8 h-8 text-green-500" />}
                                title="Contas a Receber"
                                items={["Mensalidades automáticas", "Planos e recorrência", "Pendências em destaque"]}
                            />
                            <FinanceCard
                                icon={<FileText className="w-8 h-8 text-red-500" />}
                                title="Contas a Pagar"
                                items={["Despesas fixas e variáveis", "Vencimentos e alertas", "Fornecedores cadastrados"]}
                            />
                            <FinanceCard
                                icon={<BarChart3 className="w-8 h-8 text-blue-500" />}
                                title="Caixa e Fluxo"
                                items={["Entradas e saídas do mês", "Projeção de fluxo", "Alertas de saldo baixo"]}
                            />
                            <FinanceCard
                                icon={<FileText className="w-8 h-8 text-purple-500" />}
                                title="Relatórios Completos"
                                items={["Por categoria e período", "Por unidade e professor", "Exportação em Excel/PDF"]}
                            />
                            <FinanceCard
                                icon={<AlertTriangle className="w-8 h-8 text-amber-500" />}
                                title="Gestão de Inadimplência"
                                items={["Quem atrasou e há quantos dias", "Régua de cobrança automática", "Suspensão automática"]}
                            />
                            <FinanceCard
                                icon={<Lock className="w-8 h-8 text-slate-500" />}
                                title="Governança e Permissões"
                                items={["Professor não vê financeiro", "Permissões por perfil", "Auditoria de ações"]}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTRATOS DIGITAIS Section - NEW */}
            <section id="contratos" className="py-24 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 text-sm font-medium">
                                    <FileSignature className="w-4 h-4" /> ADEUS PAPELADA
                                </div>
                                <h2 className="text-3xl lg:text-5xl font-bold font-tight">
                                    Contratos Automáticos & <span className="text-blue-600">Assinatura Digital</span>
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Esqueça a impressora. O sistema gera o contrato com os dados do aluno automaticamente e libera para assinatura no aplicativo.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Geração em 1 Clique</h4>
                                            <p className="text-sm text-muted-foreground">O sistema puxa os dados do cadastro e cria o contrato em PDF na hora.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                            <Smartphone className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Assinatura pelo App</h4>
                                            <p className="text-sm text-muted-foreground">O aluno acessa pelo aplicativo e assina desenhando na tela. Simples e com validade jurídica.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Armazenamento Seguro</h4>
                                            <p className="text-sm text-muted-foreground">Contratos assinados ficam salvos na nuvem. Nunca mais perca um documento.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <a href="#demo">
                                        <Button className="h-12 px-6 rounded-full shadow-lg shadow-blue-500/20">
                                            Ver Demonstração
                                        </Button>
                                    </a>
                                </div>
                            </div>

                            <div className="relative">
                                {/* Visual Representation of Digital Contract */}
                                <div className="relative z-10 bg-white dark:bg-slate-900 border rounded-2xl shadow-2xl p-2 max-w-sm mx-auto rotate-2 hover:rotate-0 transition-all duration-500">
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-6 opacity-50">
                                            <div className="w-20 h-4 bg-slate-300 rounded" />
                                            <div className="w-8 h-8 rounded-full bg-slate-300" />
                                        </div>
                                        <div className="space-y-3 mb-8">
                                            <div className="h-2 bg-slate-200 rounded w-full" />
                                            <div className="h-2 bg-slate-200 rounded w-full" />
                                            <div className="h-2 bg-slate-200 rounded w-3/4" />
                                            <div className="h-2 bg-slate-200 rounded w-full" />
                                            <div className="h-2 bg-slate-200 rounded w-5/6" />
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800 text-center">
                                            <p className="text-xs font-bold text-blue-600 mb-2">Assinado Digitalmente por</p>
                                            <div className="h-8 mx-auto w-32 relative">
                                                <div className="absolute inset-x-0 top-1/2 h-px bg-blue-200" />
                                                <p className="font-script text-xl text-blue-800 relative z-10 -rotate-3">Carlos Silva</p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative Blobs */}
                                <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl -z-10" />
                                <div className="absolute bottom-10 left-10 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl -z-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GRADUAÇÃO AUTOMÁTICA Section - NEW */}
            <section id="graduacao" className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium mb-4">
                                <Trophy className="w-4 h-4" /> AUTOMAÇÃO DE VERDADE
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-bold">Graduação Automática</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Defina suas regras. O sistema sinaliza automaticamente quem está pronto para grau ou faixa.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="bg-card border rounded-2xl p-8 hover:border-amber-500/50 transition-all hover:shadow-xl group">
                                <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Target className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Regras por Turma/Faixa</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Configure mínimo de treinos, tempo mínimo na faixa, presença obrigatória. Cada faixa pode ter suas próprias regras.
                                </p>
                            </div>

                            <div className="bg-card border rounded-2xl p-8 hover:border-green-500/50 transition-all hover:shadow-xl group">
                                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Bell className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Sinalização Automática</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    "Pronto para grau", "Pronto para faixa", "Em atenção" — o sistema avisa você quando o aluno atinge os critérios.
                                </p>
                            </div>

                            <div className="bg-card border rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:shadow-xl group">
                                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Award className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Linha do Tempo do Aluno</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Histórico completo: graus, faixas, datas, frequência mensal. O aluno também vê no app dele.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* More Features Grid */}
            <section id="funcionalidades" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold">E muito mais...</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Tudo que você precisa para parar de usar planilhas e focar no tatame.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <FeatureCard
                            icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                            title="Isolamento Total"
                            description="Seus dados são só seus. Arquitetura multi-tenant com 100% de privacidade."
                        />
                        <FeatureCard
                            icon={<Users className="w-10 h-10 text-violet-500" />}
                            title="Portal do Aluno"
                            description="App dedicado para o aluno ver progresso, presenças e status de pagamento."
                        />
                        <FeatureCard
                            icon={<Building2 className="w-10 h-10 text-rose-500" />}
                            title="Multi-Instrutor"
                            description="Professores fazem chamada e graduação sem acesso ao financeiro."
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="depoimentos" className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold">Quem Usa, Recomenda</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Veja o que os mestres do Jiu-Jitsu estão dizendo sobre o BJJ Academy Pro.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <div className="bg-card border rounded-2xl p-8 lg:p-10 relative overflow-hidden">
                            <div className="absolute top-4 left-6 text-8xl text-primary/10 font-serif leading-none">"</div>

                            <div className="relative z-10">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>

                                <blockquote className="text-xl lg:text-2xl leading-relaxed mb-8 text-foreground/90">
                                    "O BJJ Academy Pro revolucionou a gestão da minha academia. Depois de mais de 33 anos no tatame, formando campeões e desenvolvendo atletas, eu precisava de uma ferramenta que acompanhasse minha experiência. Este sistema entrega exatamente isso: <strong>controle total, praticidade e profissionalismo</strong>. Recomendo para todo professor que quer elevar sua academia ao próximo nível. Nota mil!"
                                </blockquote>

                                <div className="flex items-center gap-4">
                                    <img
                                        src="/professor-joas.png"
                                        alt="Professor Joás Ramos"
                                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                                    />
                                    <div>
                                        <p className="font-bold text-lg">Professor Joás Ramos</p>
                                        <p className="text-muted-foreground">Faixa Preta 5º Grau • +33 anos de experiência</p>
                                        <p className="text-sm text-muted-foreground">Proprietário da Agremiação Brothers Ramos de Jiu-Jitsu</p>
                                    </div>
                                </div>

                                <a
                                    href="https://www.instagram.com/brothersramosjiujitsu"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"
                                >
                                    <Instagram className="w-5 h-5" />
                                    @brothersramosjiujitsu
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing / CTA Section */}
            <section id="precos" className="py-24 bg-gradient-to-b from-muted/30 to-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto bg-card border rounded-2xl p-8 lg:p-12 text-center shadow-2xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                        <h3 className="text-3xl font-bold mb-4">Comece sua jornada hoje</h3>
                        <p className="text-xl text-muted-foreground mb-8">
                            Junte-se a centenas de professores que modernizaram sua gestão.
                        </p>

                        <div className="flex justify-center items-end gap-2 mb-8">
                            <span className="text-5xl font-extrabold">7 Dias</span>
                            <span className="text-xl text-muted-foreground mb-2">Grátis</span>
                        </div>

                        <ul className="text-left max-w-xs mx-auto space-y-4 mb-10">
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Tatami Online em tempo real</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Financeiro 360° completo</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Graduação automática</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Suporte 24/7</span>
                            </li>
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="#demo">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                                    <Play className="w-5 h-5 mr-2" />
                                    Ver Demonstração
                                </Button>
                            </a>
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all">
                                    Criar Minha Conta Agora
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Cancele a qualquer momento pelo painel
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contato" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold">Fale Conosco</h2>
                        <p className="text-muted-foreground text-lg">
                            Tire suas dúvidas ou peça uma demonstração personalizada.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl border hover:border-green-500/50 hover:shadow-lg transition-all group"
                        >
                            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-7 h-7 text-green-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold">WhatsApp</p>
                                <p className="text-sm text-muted-foreground">+55 83 99128-7155</p>
                            </div>
                        </a>

                        <a
                            href="mailto:contato@academybjj.com.br"
                            className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl border hover:border-primary/50 hover:shadow-lg transition-all group"
                        >
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Mail className="w-7 h-7 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold">Contato</p>
                                <p className="text-sm text-muted-foreground">contato@academybjj.com.br</p>
                            </div>
                        </a>

                        <a
                            href="mailto:suporte@academybjj.com.br"
                            className="flex flex-col items-center gap-4 p-6 bg-background rounded-xl border hover:border-blue-500/50 hover:shadow-lg transition-all group"
                        >
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Mail className="w-7 h-7 text-blue-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold">Suporte</p>
                                <p className="text-sm text-muted-foreground">suporte@academybjj.com.br</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <div className="flex justify-center items-center gap-3 mb-6">
                        <img src="/logo.jpg" alt="BJJ Academy Pro" className="h-10 w-10 rounded-full" />
                        <span className="font-bold text-foreground">BJJ Academy Pro</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 mb-8">
                        <a href="#tatami" className="hover:text-foreground">Tatami Online</a>
                        <a href="#financeiro" className="hover:text-foreground">Financeiro 360</a>
                        <a href="#graduacao" className="hover:text-foreground">Graduação</a>
                        <a href="#depoimentos" className="hover:text-foreground">Depoimentos</a>
                        <a href="#contato" className="hover:text-foreground">Contato</a>
                        <Link to="/login" className="hover:text-foreground">Entrar</Link>
                    </div>
                    <div className="flex justify-center gap-4 mb-6">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-green-500">
                            <MessageCircle className="w-5 h-5" />
                        </a>
                        <a href="mailto:contato@academybjj.com.br" className="hover:text-primary">
                            <Mail className="w-5 h-5" />
                        </a>
                    </div>
                    <p>© {new Date().getFullYear()} BJJ Academy Pro. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-6 bg-background rounded-xl border hover:border-primary/30 transition-all hover:shadow-lg group">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-lg mb-1">{title}</h4>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function FinanceCard({ icon, title, items }: { icon: React.ReactNode, title: string, items: string[] }) {
    return (
        <div className="p-6 bg-background rounded-xl border hover:border-blue-500/30 transition-all hover:shadow-lg group">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
