import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInstructors, Student } from '@/hooks/useStudents';
import { useClassSlots, DAY_NAMES } from '@/hooks/useClassSlots';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, Link } from 'lucide-react';
import { BJJCategoryTable } from './BJJCategoryTable';
import { calculateAge, getWeightCategory, Gender } from '@/lib/bjjCategories';
import { maskCPF, maskPhone } from '@/lib/masks';
import { BeltType, BELT_LABELS, CHILDREN_BELTS, ADULT_BELTS } from '@/lib/beltSystem';
type StudentStatus = 'active' | 'inactive' | 'suspended';
type FinancialStatus = 'ok' | 'pending' | 'overdue' | 'blocked';

interface EditStudentModalProps {
  student: Student | null;
  onClose: () => void;
}

export function EditStudentModal({ student, onClose }: EditStudentModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: instructors = [] } = useInstructors(profile?.academy_id);
  const { data: classSlots = [] } = useClassSlots();

  // Fetch unlinked student profiles (profiles with role=student that are not yet linked to any student)
  const { data: availableProfiles = [] } = useQuery({
    queryKey: ['unlinked-student-profiles', profile?.academy_id, student?.id],
    queryFn: async () => {
      if (!profile?.academy_id) return [];

      // Get all profiles with role=student in the academy
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('academy_id', profile.academy_id)
        .eq('role', 'student')
        .order('name');

      if (profilesError) throw profilesError;

      // Get all profile_ids that are already linked to students
      const { data: linkedStudents, error: studentsError } = await supabase
        .from('students')
        .select('profile_id')
        .eq('academy_id', profile.academy_id)
        .not('profile_id', 'is', null);

      if (studentsError) throw studentsError;

      const linkedProfileIds = new Set(linkedStudents.map(s => s.profile_id));

      // Filter out profiles that are already linked (except the current student's profile)
      return profiles.filter(p => 
        !linkedProfileIds.has(p.id) || p.id === student?.profile_id
      );
    },
    enabled: !!profile?.academy_id,
  });

  // Fetch current student enrollments
  const { data: currentEnrollments = [] } = useQuery({
    queryKey: ['student-enrollments', student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      
      const { data, error } = await supabase
        .from('student_enrollments')
        .select('class_slot_id')
        .eq('student_id', student.id)
        .eq('status', 'active');

      if (error) throw error;
      return data.map(e => e.class_slot_id);
    },
    enabled: !!student?.id,
  });

  const [showCategoryTable, setShowCategoryTable] = useState(false);
  const [calculatedCategory, setCalculatedCategory] = useState<{
    ageCategory: string;
    weightCategory: string;
  } | null>(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    cpf: '',
    weight: '',
    gender: '' as Gender | '',
    belt_current: 'white' as BeltType,
    stripes_cached: 0,
    responsible_instructor_id: '',
    profile_id: '',
    status: 'active' as StudentStatus,
    financial_status: 'ok' as FinancialStatus,
    belt_cycle_classes: 0,
    total_classes: 0,
    email: '',
    phone: '',
    guardian_name: '',
    guardian_phone: '',
  });

  // Calculate if student is a minor (under 18)
  const isMinor = formData.birth_date ? calculateAge(formData.birth_date) < 18 : false;

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        birth_date: student.birth_date || '',
        cpf: student.cpf || '',
        weight: student.weight?.toString() || '',
        gender: (student.gender as Gender) || '',
        belt_current: student.belt_current,
        stripes_cached: student.stripes_cached,
        responsible_instructor_id: student.responsible_instructor_id || '',
        profile_id: student.profile_id || '',
        status: student.status,
        financial_status: student.financial_status,
        belt_cycle_classes: student.belt_cycle_classes,
        total_classes: student.total_classes,
        email: student.email || '',
        phone: student.phone || '',
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
      });
    }
  }, [student]);

  // Sync enrollments when loaded
  useEffect(() => {
    if (currentEnrollments.length > 0) {
      setSelectedEnrollments(currentEnrollments);
    }
  }, [currentEnrollments]);

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

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!student || !profile?.academy_id) throw new Error('Aluno não encontrado');

      const categoryName = calculatedCategory 
        ? `${calculatedCategory.ageCategory} - ${calculatedCategory.weightCategory}`
        : null;

      // Update student record
      const { error } = await supabase
        .from('students')
        .update({
          name: data.name,
          birth_date: data.birth_date || null,
          cpf: data.cpf || null,
          weight: data.weight ? parseFloat(data.weight) : null,
          gender: data.gender || null,
          category: categoryName,
          belt_current: data.belt_current,
          stripes_cached: data.stripes_cached,
          responsible_instructor_id: data.responsible_instructor_id || null,
          profile_id: data.profile_id || null,
          status: data.status,
          financial_status: data.financial_status,
          belt_cycle_classes: data.belt_cycle_classes,
          total_classes: data.total_classes,
          email: data.email || null,
          phone: data.phone || null,
          guardian_name: data.guardian_name || null,
          guardian_phone: data.guardian_phone || null,
        })
        .eq('id', student.id);

      if (error) throw error;

      // Update enrollments - delete old ones and insert new ones
      const { error: deleteError } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('student_id', student.id);

      if (deleteError) throw deleteError;

      if (selectedEnrollments.length > 0) {
        const enrollmentsToInsert = selectedEnrollments.map(classSlotId => ({
          academy_id: profile.academy_id,
          student_id: student.id,
          class_slot_id: classSlotId,
          status: 'active',
        }));

        const { error: insertError } = await supabase
          .from('student_enrollments')
          .insert(enrollmentsToInsert);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      toast({
        title: 'Aluno atualizado',
        description: 'Os dados do aluno foram atualizados.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
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
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_phone">Celular</Label>
              <Input
                id="edit_phone"
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
                  <Label htmlFor="edit_guardian_name">Nome do Responsável</Label>
                  <Input
                    id="edit_guardian_name"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="Nome completo do responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_guardian_phone">Telefone do Responsável</Label>
                  <Input
                    id="edit_guardian_phone"
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
              <Label>Faixa</Label>
              <Select
                value={formData.belt_current}
                onValueChange={(value) => setFormData({ ...formData, belt_current: value as BeltType })}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Graus (0-4)</Label>
              <Select
                value={formData.stripes_cached.toString()}
                onValueChange={(value) => setFormData({ ...formData, stripes_cached: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Iniciante</SelectItem>
                  <SelectItem value="1">1 grau</SelectItem>
                  <SelectItem value="2">2 graus</SelectItem>
                  <SelectItem value="3">3 graus</SelectItem>
                  <SelectItem value="4">4 graus</SelectItem>
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

            {/* Profile Link Section */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <p className="text-sm font-medium flex items-center gap-2 mb-3">
                <Link className="h-4 w-4" />
                Vinculação de Conta
              </p>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Perfil de Usuário (permite login e check-in)</Label>
              <Select
                value={formData.profile_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, profile_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincular a um perfil de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {availableProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.email ? `(${p.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincule este aluno a um perfil de usuário para que ele possa fazer login e registrar presenças.
              </p>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Instrutor Responsável</Label>
              <Select
                value={formData.responsible_instructor_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, responsible_instructor_id: value === 'none' ? '' : value })
                }
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

            {/* Class Enrollments Section */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Turmas Matriculadas</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                {classSlots.filter(cs => cs.active).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma turma disponível</p>
                ) : (
                  classSlots.filter(cs => cs.active).map((slot) => {
                    const days = slot.day_of_week.map(d => DAY_NAMES[d].slice(0, 3)).join(', ');
                    return (
                      <div key={slot.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`slot-${slot.id}`}
                          checked={selectedEnrollments.includes(slot.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEnrollments([...selectedEnrollments, slot.id]);
                            } else {
                              setSelectedEnrollments(selectedEnrollments.filter(id => id !== slot.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`slot-${slot.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {slot.modality?.name} - {days} {slot.start_time.slice(0, 5)}
                          {slot.instructor?.name && ` (${slot.instructor.name})`}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aulas no Ciclo</Label>
              <Input
                type="number"
                min={0}
                value={formData.belt_cycle_classes}
                onChange={(e) => setFormData({ ...formData, belt_cycle_classes: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Total de Aulas</Label>
              <Input
                type="number"
                min={0}
                value={formData.total_classes}
                onChange={(e) => setFormData({ ...formData, total_classes: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
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
              <Label>Financeiro</Label>
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
