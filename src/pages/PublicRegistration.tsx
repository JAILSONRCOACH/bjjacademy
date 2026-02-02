import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GraduationCap, Loader2, CheckCircle, Info } from 'lucide-react';
import { useSubmitRegistration } from '@/hooks/useStudentRegistrations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { maskPhone, maskCPF } from '@/lib/masks';
import { ageCategories, getWeightCategory, formatWeight, type AgeCategory } from '@/lib/bjjCategories';
import { BELT_LABELS, CHILDREN_BELTS, ADULT_BELTS, BeltType } from '@/lib/beltSystem';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface LinkData {
  modality_id: string | null;
  class_slot_id: string | null;
  instructor_profile_id: string | null;
  plan_id: string | null;
  next_due_at: string | null;
  grace_days: number;
  expires_at?: string | null;
  active?: boolean;
}

export default function PublicRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const submitRegistration = useSubmitRegistration();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    birth_date: '',
    cpf: '',
    email: '',
    phone: '',
    sex: 'nao_informado',
    weight_kg: '',
    belt_current: 'branca',
    stripes: 0,
    guardian_name: '',
    guardian_phone: '',
  });

  // Load link data
  useEffect(() => {
    async function loadLinkData() {
      if (!token) {
        setError('Token de cadastro não fornecido');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('registration_invites')
          .select('*')
          .eq('token', token)
          .eq('active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Link de cadastro inválido ou expirado');
          setIsLoading(false);
          return;
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('Link de cadastro expirado');
          setIsLoading(false);
          return;
        }

        setLinkData(data as unknown as LinkData);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados do cadastro');
      } finally {
        setIsLoading(false);
      }
    }

    loadLinkData();
  }, [token]);

  // Calculate age and check if minor
  const birthDate = form.birth_date ? new Date(form.birth_date) : null;
  const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const isMinor = age !== null && age < 18;

  // Calculate category
  const computedCategory = useMemo(() => {
    if (!age || !form.weight_kg) return null;
    const gender = form.sex === 'masculino' ? 'male' : form.sex === 'feminino' ? 'female' : null;
    if (!gender) return null;
    const result = getWeightCategory(Number(form.weight_kg), age, gender);
    if (!result) return null;
    return `${result.ageCategory.name} - ${result.weightCategory.name}`;
  }, [age, form.weight_kg, form.sex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (isMinor && (!form.guardian_name.trim() || !form.guardian_phone.trim())) {
      toast({ title: 'Dados do responsável são obrigatórios para menores', variant: 'destructive' });
      return;
    }

    try {
      await submitRegistration.mutateAsync({
        token: token!,
        name: form.name,
        birth_date: form.birth_date || undefined,
        cpf: form.cpf.replace(/\D/g, '') || undefined,
        email: form.email || undefined,
        phone: form.phone.replace(/\D/g, '') || undefined,
        sex: form.sex,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        belt_current: form.belt_current,
        stripes: form.stripes,
        guardian_name: isMinor ? form.guardian_name : undefined,
        guardian_phone: isMinor ? form.guardian_phone.replace(/\D/g, '') : undefined,
        computed_category: computedCategory || undefined,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao enviar cadastro', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <GraduationCap className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')}>Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Cadastro Enviado com Sucesso!</CardTitle>
            <CardDescription className="text-base mt-4 space-y-2">
              <p className="font-medium">✅ Seu cadastro foi recebido</p>
              <p>📋 Aguarde a aprovação da academia</p>
              <p>📧 Você receberá suas credenciais de acesso por e-mail após a aprovação</p>
              <p className="text-xs text-muted-foreground mt-4">
                Obs: Você só poderá fazer login após receber o e-mail de aprovação
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.close()} variant="outline">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Cadastro de Aluno</h1>
          <p className="text-muted-foreground">Preencha seus dados para se matricular</p>
        </div>


        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Data */}
              <div className="space-y-4">
                <h3 className="font-semibold">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Digite seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sexo</Label>
                    <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_informado">Não informado</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={form.weight_kg}
                      onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                      placeholder="Ex: 75.5"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian Data (for minors) */}
              {isMinor && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
                  <h3 className="font-semibold">Dados do Responsável (obrigatório para menores)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardian_name">Nome do Responsável *</Label>
                      <Input
                        id="guardian_name"
                        value={form.guardian_name}
                        onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardian_phone">Telefone do Responsável *</Label>
                      <Input
                        id="guardian_phone"
                        value={form.guardian_phone}
                        onChange={(e) => setForm({ ...form, guardian_phone: maskPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BJJ Data */}
              <div className="space-y-4">
                <h3 className="font-semibold">Dados do Jiu-Jitsu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="belt">Faixa Atual</Label>
                    <Select value={form.belt_current} onValueChange={(v) => setForm({ ...form, belt_current: v, stripes: 0 })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BELT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripes">Graus</Label>
                    <Select value={String(form.stripes)} onValueChange={(v) => setForm({ ...form, stripes: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: (['black', 'red_black', 'red_white', 'red'].includes(form.belt_current) ? 11 : 5) }).map((_, s) => (
                          <SelectItem key={s} value={String(s)}>{s} grau(s)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Categoria Calculada</Label>
                    <p className="text-lg font-semibold">
                      {computedCategory || 'Preencha idade, peso e sexo'}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
                    <Info className="h-4 w-4 mr-2" />
                    Ver Tabela
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitRegistration.isPending}>
                {submitRegistration.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enviar Cadastro
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Category Table Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Tabela de Categorias - BJJ</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {ageCategories.map((ageCategory) => (
              <div key={ageCategory.name}>
                <h4 className="font-semibold mb-2">{ageCategory.name} ({ageCategory.minAge}-{ageCategory.maxAge === Infinity ? '+' : ageCategory.maxAge} anos)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Masculino</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Peso Máx</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ageCategory.maleCategories.map((cat) => (
                          <TableRow key={cat.name}>
                            <TableCell>{cat.name}</TableCell>
                            <TableCell>{formatWeight(cat.maxWeight)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Feminino</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Peso Máx</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ageCategory.femaleCategories.map((cat) => (
                          <TableRow key={cat.name}>
                            <TableCell>{cat.name}</TableCell>
                            <TableCell>{formatWeight(cat.maxWeight)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
