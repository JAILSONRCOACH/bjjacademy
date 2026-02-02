import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudentRegistration {
  id: string;
  academy_id: string;
  created_by_profile_id: string | null;
  source: 'link' | 'manual';
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  birth_date: string | null;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  sex: 'nao_informado' | 'masculino' | 'feminino';
  weight_kg: number | null;
  belt_current: string;
  stripes: number;
  guardian_name: string | null;
  guardian_phone: string | null;
  is_minor: boolean;
  modality_id: string | null;
  class_slot_id: string | null;
  instructor_id: string | null;
  plan_id: string | null;
  next_due_at: string | null;
  grace_days: number;
  computed_category: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  registration_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
  modality?: { id: string; name: string };
  class_slot?: { id: string; title: string; day_of_week: number; start_time: string; end_time: string };
  plan?: { id: string; name: string; price: number };
  instructor?: { id: string; name: string };
}

export function useStudentRegistrations(status?: 'pending' | 'approved' | 'rejected') {
  return useQuery({
    queryKey: ['student-registrations', status],
    queryFn: async () => {
      let query = supabase
        .from('student_registrations')
        .select(`
          *,
          modality:modalities(id, name),
          class_slot:class_slots(id, title, day_of_week, start_time, end_time),
          plan:plans(id, name, price)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as StudentRegistration[];
    },
  });
}

// Small mappers to convert public registration values to internal DB enums
function normalizeBelt(value?: string | null): 'white' | 'blue' | 'purple' | 'brown' | 'black' {
  const v = (value ?? '').toString().trim().toLowerCase();
  switch (v) {
    case 'branca':
    case 'white':
      return 'white';
    case 'azul':
    case 'blue':
      return 'blue';
    case 'roxa':
    case 'purple':
      return 'purple';
    case 'marrom':
    case 'brown':
      return 'brown';
    case 'preta':
    case 'black':
      return 'black';
    default:
      return 'white';
  }
}

function normalizeGender(value?: string | null): 'male' | 'female' | null {
  const v = (value ?? '').toString().trim().toLowerCase();
  if (v === 'masculino' || v === 'male') return 'male';
  if (v === 'feminino' || v === 'female') return 'female';
  return null;
}

async function ensureStudentFromRegistration(registration: StudentRegistration) {
  // Check if student already exists by name AND email (more restrictive)
  if (registration.email) {
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('academy_id', registration.academy_id)
      .eq('email', registration.email)
      .eq('name', registration.name)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  // Create new student record
  const { data: created, error } = await supabase
    .from('students')
    .insert({
      academy_id: registration.academy_id,
      profile_id: null,
      name: registration.name,
      email: registration.email ?? null,
      phone: registration.phone ?? null,
      birth_date: registration.birth_date ?? null,
      cpf: registration.cpf ?? null,
      belt_current: normalizeBelt(registration.belt_current),
      stripes_cached: registration.stripes ?? 0,
      belt_cycle_classes: 0,
      total_classes: 0,
      weight: registration.weight_kg ?? null,
      gender: normalizeGender(registration.sex),
      responsible_instructor_id: registration.instructor_id ?? null,
      financial_status: 'pending',
      status: 'active',
      guardian_name: registration.guardian_name ?? null,
      guardian_phone: registration.guardian_phone ?? null,
      category: registration.computed_category ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return created.id as string;
}

// Webhook call for admin actions (approval/rejection/create link)
async function callAdminWebhook(payload: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch('https://n8n.servmjr.site/webhook/admpro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ payload }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Erro ao chamar webhook');
  }

  return response.json();
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      // Call the Edge Function to approve registration
      // This function will:
      // 1. Check SaaS access
      // 2. Create Auth user with temp password
      // 3. Create student record
      // 4. Create profile (role: student)
      // 5. Update registration status to approved

      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('approve-student-registration', {
        body: { registration_id: registrationId, login_url: window.location.origin + '/login' },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao aprovar cadastro');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });

      // Show temp password to admin
      if (data?.credentials?.temp_password) {
        toast({
          title: 'Cadastro aprovado!',
          description: `Login criado. Senha temporária: ${data.credentials.temp_password}`,
          duration: 10000 // 10 seconds
        });
      } else {
        toast({ title: 'Cadastro aprovado', description: 'Aluno ativado com sucesso!' });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { registrationId: string; reason: string }) => {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: data.reason
        })
        .eq('id', data.registrationId);

      if (error) {
        throw new Error(error.message || 'Erro ao rejeitar cadastro');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
      toast({ title: 'Cadastro rejeitado', description: 'Cadastro rejeitado.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao rejeitar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateRegistrationLink() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      modality_id?: string;
      class_slot_id?: string;
      instructor_profile_id?: string;
      plan_id?: string;
      next_due_at?: string;
      grace_days?: number;
      expires_at?: string;
      academy_id?: string; // Can be passed from context
    }) => {
      // Get user session for created_by
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      let academyId = data.academy_id;

      // If academy_id not provided, try to get from profile
      if (!academyId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('academy_id')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.academy_id) {
          academyId = profile.academy_id;
        }
      }

      // Fallback to default academy if still not found
      if (!academyId) {
        academyId = 'a0000001-0000-0000-0000-000000000001';
      }

      // Generate unique token
      const token = crypto.randomUUID();

      // Calculate expires_at (7 days from now if not provided)
      const expiresAt = data.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Insert into registration_invites
      const { error: insertError } = await supabase
        .from('registration_invites')
        .insert({
          academy_id: academyId,
          created_by_profile_id: userId,
          token,
          modality_id: data.modality_id || null,
          class_slot_id: data.class_slot_id || null,
          instructor_profile_id: data.instructor_profile_id || null,
          plan_id: data.plan_id || null,
          next_due_at: data.next_due_at || null,
          grace_days: data.grace_days ?? 3,
          expires_at: expiresAt,
          active: true,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Generate URL using current origin (internal system)
      const url = `${window.location.origin}/cadastro?token=${token}`;

      return { url, token };
    },
    onSuccess: () => {
      toast({ title: 'Link criado', description: 'Link de cadastro gerado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao gerar link', description: error.message, variant: 'destructive' });
    },
  });
}

// Public registration submission (uses Edge Function to bypass RLS)
export function useSubmitRegistration() {
  return useMutation({
    mutationFn: async (data: {
      token: string;
      name: string;
      birth_date?: string;
      cpf?: string;
      email?: string;
      phone?: string;
      sex?: string;
      weight_kg?: number;
      belt_current?: string;
      stripes?: number;
      guardian_name?: string;
      guardian_phone?: string;
      computed_category?: string;
    }) => {
      // Calculate if is minor
      const birthDate = data.birth_date ? new Date(data.birth_date) : null;
      const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      const isMinor = age !== null && age < 18;

      // Call the Edge Function for public registration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/public-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_token: data.token,
          name: data.name,
          birth_date: data.birth_date || null,
          cpf: data.cpf || null,
          email: data.email || null,
          phone: data.phone || null,
          sex: data.sex || 'nao_informado',
          weight_kg: data.weight_kg || null,
          belt_current: data.belt_current || 'branca',
          stripes: data.stripes ?? 0,
          guardian_name: isMinor ? data.guardian_name : null,
          guardian_phone: isMinor ? data.guardian_phone : null,
          is_minor: isMinor,
          computed_category: data.computed_category || null,
          source: 'link',
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar cadastro');
      }

      const result = await response.json();
      return { success: true, message: 'Cadastro enviado com sucesso!', id: result.id };
    },
  });
}

// Create manual registration (admin action)
export function useCreateManualRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      birth_date?: string;
      cpf?: string;
      email?: string;
      phone?: string;
      sex?: string;
      weight_kg?: number;
      belt_current?: string;
      stripes?: number;
      guardian_name?: string;
      guardian_phone?: string;
      modality_id?: string;
      class_slot_id?: string;
      instructor_profile_id?: string;
      plan_id?: string;
      next_due_at?: string;
      grace_days?: number;
      computed_category?: string;
    }) => {
      // 1. Get Context
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('academy_id')
        .eq('id', userId)
        .maybeSingle();

      const academyId = profile?.academy_id || 'a0000001-0000-0000-0000-000000000001';

      // 2. Calculate isMinor
      const birthDate = data.birth_date ? new Date(data.birth_date) : null;
      const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      const isMinor = age !== null && age < 18;

      // 3. Insert Pending Registration directly
      const { data: inserted, error: insertError } = await supabase
        .from('student_registrations')
        .insert({
          academy_id: academyId,
          created_by_profile_id: userId,
          source: 'manual',
          status: 'pending',
          name: data.name,
          birth_date: data.birth_date || null,
          cpf: data.cpf || null,
          email: data.email || null,
          phone: data.phone || null,
          sex: (data.sex as any) || 'nao_informado',
          weight_kg: data.weight_kg || null,
          belt_current: data.belt_current || 'white',
          stripes: data.stripes || 0,
          guardian_name: isMinor ? data.guardian_name : null,
          guardian_phone: isMinor ? data.guardian_phone : null,
          is_minor: isMinor,
          modality_id: data.modality_id,
          class_slot_id: data.class_slot_id,
          instructor_id: data.instructor_profile_id || null,
          plan_id: data.plan_id || null,
          next_due_at: data.next_due_at || null,
          grace_days: data.grace_days ?? 3,
          computed_category: data.computed_category || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Immediately Approve to send credentials
      const response = await supabase.functions.invoke('approve-student-registration', {
        body: { registration_id: inserted.id, login_url: window.location.origin + '/login' },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao aprovar cadastro manual');
      }

      return { ...response.data, registration: inserted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });

      const pwd = data?.credentials?.temp_password;
      const email = data?.registration?.email || 'email';
      const emailSent = data?.email_sent;

      let msg = '';
      if (pwd) {
        msg = `Cadastro criado para ${email}! Senha: ${pwd}`;
        if (emailSent === false) {
          msg += ' (Alerta: Email não enviado/configurado)';
        }
      } else {
        msg = 'Cadastro criado e e-mail enviado!';
      }

      toast({
        title: 'Sucesso!',
        description: msg,
        duration: pwd ? 20000 : 5000
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar cadastro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSendInvite() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; invite_url: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) throw new Error('Usuário não autenticado');

      const response = await supabase.functions.invoke('send-invite-email', {
        body: data,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.error) {
        let errorMsg = response.error.message || 'Erro ao enviar convite';
        // Tentar parsear se for JSON string
        try {
          if (typeof response.error === 'string' && response.error.startsWith('{')) {
            const parsed = JSON.parse(response.error);
            if (parsed.error) errorMsg = parsed.error;
          }
        } catch (e) {/* ignore */ }
        throw new Error(errorMsg);
      }

      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Convite enviado', description: 'O email foi enviado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
    }
  });
}
