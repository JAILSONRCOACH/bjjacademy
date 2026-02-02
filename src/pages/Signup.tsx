import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, Building2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const signupSchema = z.object({
  academyName: z.string().trim().min(3, 'Nome da academia deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  name: z.string().trim().min(2, 'Seu nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(72, 'Senha muito longa'),
});

export default function Signup() {
  const [academyName, setAcademyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = signupSchema.safeParse({ academyName, name, email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Call Edge Function to Bootstrap everything (User + Academy + Trial)
      const { data, error } = await supabase.functions.invoke('saas-bootstrap', {
        body: {
          academyName: result.data.academyName,
          adminName: result.data.name,
          email: result.data.email,
          password: result.data.password
        }
      });

      if (error) throw new Error(error.message || 'Erro ao conectar com o servidor');
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Academia criada com sucesso!',
        description: 'Fazendo login...',
      });

      // 2. Sign In automatically
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password
      });

      if (loginError) {
        toast({
          title: 'Conta criada, mas erro ao logar',
          description: 'Por favor, faça login manualmente.',
        });
        navigate('/login');
      } else {
        navigate('/admin/dashboard');
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      let msg = err.message || 'Ocorreu um erro ao criar a conta.';
      if (msg.includes('already registered')) msg = 'Este email já está cadastrado.';

      toast({
        title: 'Erro ao criar conta',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already logged in
  if (profile) {
    const redirectPath =
      profile.role === 'admin' ? '/admin/dashboard' :
        profile.role === 'professor' ? '/professor/alunos' :
          '/aluno/progresso';
    navigate(redirectPath, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar Nova Academia</CardTitle>
          <CardDescription>
            Comece seu teste grátis de 7 dias do BJJ Academy System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academyName">Nome da Academia</Label>
              <Input
                id="academyName"
                type="text"
                placeholder="Ex: Gracie Barra Centro"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
              />
              {errors.academyName && <p className="text-sm text-destructive">{errors.academyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome (Admin)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Admin</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Academia e Iniciar Trial
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
