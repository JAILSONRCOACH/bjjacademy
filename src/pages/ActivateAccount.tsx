import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Token de ativação não fornecido');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('student_registrations')
        .select('*')
        .eq('registration_token', token)
        .eq('status', 'approved')
        .maybeSingle();

      if (fetchError) {
        setError('Erro ao validar token');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Token inválido ou cadastro não aprovado');
        setLoading(false);
        return;
      }

      setRegistrationData(data);
      setEmail(data.email || '');
      setLoading(false);
    }

    validateToken();
  }, [token]);

  // Mapeia faixa em português para enum em inglês
  const mapBeltToEnum = (belt: string | null): 'white' | 'blue' | 'purple' | 'brown' | 'black' => {
    const beltMap: Record<string, 'white' | 'blue' | 'purple' | 'brown' | 'black'> = {
      'branca': 'white',
      'white': 'white',
      'azul': 'blue',
      'blue': 'blue',
      'roxa': 'purple',
      'purple': 'purple',
      'marrom': 'brown',
      'brown': 'brown',
      'preta': 'black',
      'black': 'black',
    };
    return beltMap[belt?.toLowerCase() || ''] || 'white';
  };

  // Mapeia gênero - só envia se for um valor válido
  const mapGender = (sex: string | null): string | null => {
    const validGenders = ['masculino', 'feminino', 'M', 'F', 'male', 'female'];
    if (!sex) return null;
    if (validGenders.includes(sex.toLowerCase())) {
      if (sex.toLowerCase() === 'm' || sex.toLowerCase() === 'male') return 'masculino';
      if (sex.toLowerCase() === 'f' || sex.toLowerCase() === 'female') return 'feminino';
      return sex.toLowerCase();
    }
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const beltEnum = mapBeltToEnum(registrationData.belt_current);
    const genderValue = mapGender(registrationData.sex);

    try {
      // 1. Tentar criar conta ou fazer login se já existir
      let userId: string;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // Se usuário já existe, tentar fazer login
        if (signUpError.message.includes('already') || signUpError.message.includes('registered')) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (loginError) {
            throw new Error('Email já cadastrado. Tente fazer login com sua senha.');
          }
          
          if (!loginData.user) {
            throw new Error('Erro ao autenticar');
          }
          
          userId = loginData.user.id;
        } else {
          throw new Error(signUpError.message);
        }
      } else if (!authData.user) {
        throw new Error('Erro ao criar conta');
      } else {
        userId = authData.user.id;
      }

      // 2. Verificar se já existe perfil
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        // Criar perfil do aluno
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            academy_id: registrationData.academy_id,
            name: registrationData.name,
            email: email,
            phone: registrationData.phone,
            birth_date: registrationData.birth_date,
            cpf: registrationData.cpf,
            role: 'student',
            status: 'active',
            belt: beltEnum,
            stripes: registrationData.stripes || 0,
          });

        if (profileError) {
          console.error('Profile error:', profileError);
        }
      }

      // 3. Verificar se já existe registro na tabela students
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();

      if (!existingStudent) {
        // Criar registro na tabela students
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            academy_id: registrationData.academy_id,
            profile_id: userId,
            name: registrationData.name,
            email: email,
            phone: registrationData.phone,
            birth_date: registrationData.birth_date,
            cpf: registrationData.cpf,
            belt_current: beltEnum,
            stripes_cached: registrationData.stripes || 0,
            ...(genderValue && { gender: genderValue }),
            weight: registrationData.weight_kg,
            guardian_name: registrationData.guardian_name,
            guardian_phone: registrationData.guardian_phone,
            category: registrationData.computed_category,
            responsible_instructor_id: registrationData.instructor_id,
            status: 'active',
            financial_status: 'pending',
          });

        if (studentError) {
          console.error('Student error:', studentError);
        }
      }

      // 4. Invalidar o token (limpar)
      await supabase
        .from('student_registrations')
        .update({ registration_token: null })
        .eq('id', registrationData.id);

      setSuccess(true);
      toast({ title: 'Conta ativada!', description: 'Sua conta foi criada com sucesso.' });

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Conta Ativada!</CardTitle>
            <CardDescription>
              Sua conta foi criada com sucesso. Você será redirecionado para o login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Ativar Conta</CardTitle>
          <CardDescription>
            Olá, {registrationData?.name}! Crie sua senha para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repita a senha"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ativando...
                </>
              ) : (
                'Ativar Conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
