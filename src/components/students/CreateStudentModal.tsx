import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInstructors } from '@/hooks/useStudents';
import { useCreateManualRegistration } from '@/hooks/useStudentRegistrations';
import { usePlans } from '@/hooks/useFinance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';
import { BJJCategoryTable } from './BJJCategoryTable';
import { calculateAge, getWeightCategory, Gender } from '@/lib/bjjCategories';
import { maskCPF, maskPhone } from '@/lib/masks';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BeltType, BELT_LABELS, CHILDREN_BELTS, ADULT_BELTS } from '@/lib/beltSystem';
type StudentStatus = 'active' | 'inactive' | 'suspended';
type FinancialStatus = 'ok' | 'pending' | 'overdue';
type CreationMode = 'direct' | 'webhook';

interface FormData {
  name: string;
  birth_date: string;
  cpf: string;
  weight: string;
  gender: Gender | '';
  belt_current: BeltType;
  stripes: number;
  responsible_instructor_id: string;
  status: StudentStatus;
  financial_status: FinancialStatus;
  // Contact fields
  email: string;
  phone: string;
  // Guardian fields (for minors)
  guardian_name: string;
  guardian_phone: string;
  // Webhook fields
  plan_id: string;
  next_due_at: string;
  grace_days: number;
}

interface CreateStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStudentModal({ open, onOpenChange }: CreateStudentModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: instructors = [] } = useInstructors(profile?.academy_id);
  const { data: plans = [] } = usePlans();
  const webhookMutation = useCreateManualRegistration();

  const activePlans = plans.filter((p) => p.is_active);

  const [creationMode, setCreationMode] = useState<CreationMode>('webhook'); // Sempre cadastro completo
  const [showCategoryTable, setShowCategoryTable] = useState(false);
  const [calculatedCategory, setCalculatedCategory] = useState<{
    ageCategory: string;
    weightCategory: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    birth_date: '',
    cpf: '',
    weight: '',
    gender: '',
    belt_current: 'white',
    stripes: 0,
    responsible_instructor_id: '',
    status: 'active',
    financial_status: 'ok',
    email: '',
    phone: '',
    guardian_name: '',
    guardian_phone: '',
    plan_id: '',
    next_due_at: '',
    grace_days: 3,
  });

  // Calculate if student is a minor (under 18)
  const isMinor = formData.birth_date ? calculateAge(formData.birth_date) < 18 : false;

  // Calculate category when weight, birth_date, or gender changes
  useEffect(() => {
    if (formData.weight && formData.birth_date && formData.gender) {
      const age = calculateAge(formData.birth_date);
      const weight = parseFloat(formData.weight);
      const result = getWeightCategory(weight, age, formData.gender);

      if (result) {
        setCalculatedCategory({
          ageCategory: result.ageCategory.name,
          weightCategory: result.weightCategory.name,
        });
      } else {
        setCalculatedCategory(null);
      }
    } else {
      setCalculatedCategory(null);
    }
  }, [formData.weight, formData.birth_date, formData.gender]);

  // Reset stripes to max 4 if belt changes from black to another belt
  useEffect(() => {
    if (formData.belt_current !== 'black' && formData.stripes > 4) {
      setFormData(prev => ({ ...prev, stripes: 4 }));
    }
  }, [formData.belt_current, formData.stripes]);

  const directMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!profile?.academy_id) throw new Error('Academia não encontrada');

      const categoryName = calculatedCategory
        ? `${calculatedCategory.ageCategory} - ${calculatedCategory.weightCategory}`
        : null;

      // 1. Create registration record with approved status
      const activationToken = crypto.randomUUID();
      const { data: registration, error: regError } = await supabase
        .from('student_registrations')
        .insert({
          academy_id: profile.academy_id,
          name: data.name,
          birth_date: data.birth_date || null,
          cpf: data.cpf || null,
          weight_kg: data.weight ? parseFloat(data.weight) : null,
          sex: data.gender || null,
          computed_category: categoryName,
          belt_current: data.belt_current,
          stripes: data.stripes,
          instructor_id: data.responsible_instructor_id || null,
          email: data.email || null,
          phone: data.phone || null,
          guardian_name: data.guardian_name || null,
          guardian_phone: data.guardian_phone || null,
          is_minor: isMinor,
          status: 'approved',
          approved_at: new Date().toISOString(),
          source: 'manual',
          registration_token: activationToken,
          created_by_profile_id: profile.id,
        })
        .select()
        .single();

      if (regError) throw regError;

      // 2. Create student record
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          academy_id: profile.academy_id,
          name: data.name,
          birth_date: data.birth_date || null,
          cpf: data.cpf || null,
          weight: data.weight ? parseFloat(data.weight) : null,
          gender: data.gender || null,
          category: categoryName,
          belt_current: data.belt_current,
          stripes_cached: data.stripes,
          responsible_instructor_id: data.responsible_instructor_id || null,
          status: data.status,
          financial_status: data.financial_status,
          email: data.email || null,
          phone: data.phone || null,
          guardian_name: data.guardian_name || null,
          guardian_phone: data.guardian_phone || null,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // 3. Generate activation link - always use production URL
      const activationLink = `https://bjjacademy.lovable.app/ativar-conta?token=${activationToken}`;

      // 4. Send activation link via WhatsApp webhook
      const whatsappPayload = {
        action: 'send_activation',
        registration_id: registration.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        activation_link: activationLink,
      };

      try {
        await fetch('https://n8n.servmjr.site/webhook/bjjwhatsap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(whatsappPayload),
        });
      } catch (webhookError) {
        console.warn('Webhook WhatsApp falhou, mas cadastro foi concluído:', webhookError);
      }

      return { activationLink };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
      toast({
        title: 'Aluno criado',
        description: 'Link de ativação enviado via WhatsApp!',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      birth_date: '',
      cpf: '',
      weight: '',
      gender: '',
      belt_current: 'white',
      stripes: 0,
      responsible_instructor_id: '',
      status: 'active',
      financial_status: 'ok',
      email: '',
      phone: '',
      guardian_name: '',
      guardian_phone: '',
      plan_id: '',
      next_due_at: '',
      grace_days: 3,
    });
    setCalculatedCategory(null);
    setCreationMode('direct');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do aluno.',
        variant: 'destructive',
      });
      return;
    }

    // For direct mode, phone is required to send activation link via WhatsApp
    if (creationMode === 'direct' && !formData.phone.trim()) {
      toast({
        title: 'Celular obrigatório',
        description: 'Informe o celular para enviar o link de ativação via WhatsApp.',
        variant: 'destructive',
      });
      return;
    }

    if (creationMode === 'webhook') {
      if (!formData.email || !formData.plan_id || !formData.next_due_at) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Email, plano e data de cobrança são obrigatórios.',
          variant: 'destructive',
        });
        return;
      }

      const categoryName = calculatedCategory
        ? `${calculatedCategory.ageCategory} - ${calculatedCategory.weightCategory}`
        : undefined;

      webhookMutation.mutate(
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          birth_date: formData.birth_date || undefined,
          belt_current: formData.belt_current,
          stripes: formData.stripes,
          instructor_profile_id: formData.responsible_instructor_id === 'none' ? undefined : formData.responsible_instructor_id || undefined,
          plan_id: formData.plan_id,
          next_due_at: formData.next_due_at,
          grace_days: formData.grace_days,
          // Additional fields
          cpf: formData.cpf || undefined,
          weight_kg: formData.weight ? parseFloat(formData.weight) : undefined,
          sex: formData.gender || undefined,
          computed_category: categoryName,
          guardian_name: formData.guardian_name || undefined,
          guardian_phone: formData.guardian_phone || undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        }
      );
    } else {
      directMutation.mutate(formData);
    }
  };

  const isPending = directMutation.isPending || webhookMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Aluno</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">


          <div className="grid grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do aluno"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_email">Email</Label>
              <Input
                id="student_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_phone">Celular</Label>
              <Input
                id="student_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* Guardian fields - only show if student is a minor */}
            {isMinor && (
              <>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <p className="text-sm text-muted-foreground mb-3">Dados do Responsável (menor de idade)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Nome do Responsável *</Label>
                  <Input
                    id="guardian_name"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="Nome completo do responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Telefone do Responsável *</Label>
                  <Input
                    id="guardian_phone"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                value={formData.gender || 'none'}
                onValueChange={(value) => setFormData({ ...formData, gender: value === 'none' ? '' : value as Gender })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="200"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="Ex: 75.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="belt">Faixa</Label>
              <Select
                value={formData.belt_current}
                onValueChange={(value) => setFormData({ ...formData, belt_current: value as BeltType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a faixa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="children-header" disabled className="font-semibold text-muted-foreground">
                    — Faixas Infantis —
                  </SelectItem>
                  {CHILDREN_BELTS.map((belt) => (
                    <SelectItem key={belt} value={belt}>
                      {BELT_LABELS[belt]}
                    </SelectItem>
                  ))}
                  <SelectItem value="adults-header" disabled className="font-semibold text-muted-foreground">
                    — Faixas Adultos —
                  </SelectItem>
                  {ADULT_BELTS.map((belt) => (
                    <SelectItem key={belt} value={belt}>
                      {BELT_LABELS[belt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripes">
                Graus (0-{formData.belt_current === 'black' ? '10' : '4'})
              </Label>
              <Select
                value={formData.stripes.toString()}
                onValueChange={(value) => setFormData({ ...formData, stripes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os graus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Iniciante</SelectItem>
                  <SelectItem value="1">1 grau</SelectItem>
                  <SelectItem value="2">2 graus</SelectItem>
                  <SelectItem value="3">3 graus</SelectItem>
                  <SelectItem value="4">4 graus</SelectItem>
                  {['black', 'red_black', 'red_white', 'red'].includes(formData.belt_current) && (
                    <>
                      <SelectItem value="5">5 graus</SelectItem>
                      <SelectItem value="6">6 graus</SelectItem>
                      <SelectItem value="7">7 graus (Mestre)</SelectItem>
                      <SelectItem value="8">8 graus (Mestre)</SelectItem>
                      <SelectItem value="9">9 graus (Grande Mestre)</SelectItem>
                      <SelectItem value="10">10 graus (Grande Mestre)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instrutor Responsável</Label>
              <Select
                value={formData.responsible_instructor_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, responsible_instructor_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o instrutor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculated Category Display */}
            {calculatedCategory && (
              <div className="col-span-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium">
                  Categoria Calculada: <span className="text-primary">{calculatedCategory.ageCategory} - {calculatedCategory.weightCategory}</span>
                </p>
              </div>
            )}

            {/* Category Table Toggle */}
            <div className="col-span-2">
              <Collapsible open={showCategoryTable} onOpenChange={setShowCategoryTable}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="w-full">
                    <Info className="h-4 w-4 mr-2" />
                    {showCategoryTable ? 'Ocultar' : 'Ver'} Tabela de Categorias
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <BJJCategoryTable
                    gender={formData.gender || 'male'}
                    highlightCategory={calculatedCategory?.weightCategory}
                    highlightAgeGroup={calculatedCategory?.ageCategory}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Webhook-only fields */}
            {creationMode === 'webhook' && (
              <>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <p className="text-sm text-muted-foreground mb-3">Dados de Acesso e Plano</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="aluno@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="5511999999999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plano *</Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_due_at">Data 1ª Cobrança *</Label>
                  <Input
                    id="next_due_at"
                    type="date"
                    value={formData.next_due_at}
                    onChange={(e) => setFormData({ ...formData, next_due_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grace_days">Dias de Carência</Label>
                  <Input
                    id="grace_days"
                    type="number"
                    min={0}
                    max={30}
                    value={formData.grace_days}
                    onChange={(e) => setFormData({ ...formData, grace_days: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </>
            )}

            {/* Direct-only fields */}
            {creationMode === 'direct' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as StudentStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financial">Financeiro</Label>
                  <Select
                    value={formData.financial_status}
                    onValueChange={(value) => setFormData({ ...formData, financial_status: value as FinancialStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ok">Em dia</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creationMode === 'webhook' ? 'Cadastrar Aluno' : 'Criar Aluno'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
