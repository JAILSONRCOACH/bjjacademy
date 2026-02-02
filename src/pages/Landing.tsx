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
    MessageCircle
} from "lucide-react";

export default function Landing() {
    const whatsappLink = "https://wa.me/5583991287155?text=Olá! Gostaria de saber mais sobre o BJJ Academy Pro.";

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* Logo Destaque */}
                        <div className="flex justify-center mb-6">
                            <img
                                src="/logo.jpg"
                                alt="BJJ Academy Pro"
                                className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover shadow-2xl border-4 border-primary/20"
                            />
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-[1.1]">
                            Gestão. <br />
                            <span className="text-primary">Nível Faixa Preta.</span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            O único SaaS feito especialmente para academias de Jiu-Jitsu. Controle financeiro, graduação de alunos e gestão de presença em um só lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                    Comece 7 Dias Grátis
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg hover:bg-muted/50">
                                    Acessar Minha Conta
                                </Button>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground pt-4">
                            <CheckCircle2 className="inline-block w-4 h-4 mr-1 text-primary" /> Sem cartão de crédito para começar
                        </p>
                    </div>
                </div>

                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none opacity-40">
                    <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                </div>
            </section>

            {/* Features Grid */}
            <section id="funcionalidades" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold">Tudo que você precisa para escalar</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Pare de usar planilhas. Automatize as operações da sua academia e foque no tatame.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <FeatureCard
                            icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                            title="Isolamento Total"
                            description="Seus dados são só seus. Nossa arquitetura multi-tenant garante 100% de privacidade e segurança para sua academia."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-10 h-10 text-blue-500" />}
                            title="Crescimento Financeiro"
                            description="Acompanhe mensalidades, despesas e faturas automaticamente. Saiba exatamente quem pagou e quem está pendente."
                        />
                        <FeatureCard
                            icon={<Trophy className="w-10 h-10 text-amber-500" />}
                            title="Graduação Automática"
                            description="Defina suas regras. O sistema rastreia presenças e avisa quando o aluno está pronto para grau ou faixa."
                        />
                        <FeatureCard
                            icon={<Users className="w-10 h-10 text-violet-500" />}
                            title="Portal do Aluno"
                            description="Dê aos seus alunos um app dedicado para ver progresso, histórico de presenças e status de pagamento."
                        />
                        <FeatureCard
                            icon={<Calendar className="w-10 h-10 text-green-500" />}
                            title="Gestão de Aulas"
                            description="Agende aulas, registre check-ins via QR Code e gerencie capacidade sem esforço."
                        />
                        <FeatureCard
                            icon={<Building2 className="w-10 h-10 text-rose-500" />}
                            title="Multi-Instrutor"
                            description="Dê acesso específico aos seus professores para fazer chamada sem expor dados financeiros."
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
                            {/* Quote marks */}
                            <div className="absolute top-4 left-6 text-8xl text-primary/10 font-serif leading-none">"</div>

                            <div className="relative z-10">
                                {/* Stars */}
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
                                <span>Alunos Ilimitados</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Aulas Ilimitadas</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Módulo Financeiro Completo</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Suporte 24/7</span>
                            </li>
                        </ul>

                        <Link to="/signup" className="block w-full">
                            <Button size="lg" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all">
                                Criar Minha Conta Agora
                            </Button>
                        </Link>
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
                            Tire suas dúvidas ou peça uma demonstração.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {/* WhatsApp */}
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

                        {/* Email Contato */}
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

                        {/* Email Suporte */}
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
                        <a href="#funcionalidades" className="hover:text-foreground">Funcionalidades</a>
                        <a href="#depoimentos" className="hover:text-foreground">Depoimentos</a>
                        <a href="#precos" className="hover:text-foreground">Preços</a>
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
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
