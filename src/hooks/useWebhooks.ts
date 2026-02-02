import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebhookResponse {
  ok: boolean;
  message?: string;
  user_id?: string;
  profile_id?: string;
  student_id?: string;
  subscription_id?: string;
  invoice_id?: string;
  plan?: unknown;
  credentials?: {
    email: string;
    password?: string;
  };
}

async function callWebhook(
  endpoint: 'admin' | 'professor' | 'aluno',
  payload: Record<string, unknown>
): Promise<WebhookResponse> {
  // Ensure user is authenticated (invoke will include a fresh JWT automatically)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.warn('Erro ao obter sessão:', sessionError.message);
  }

  if (!sessionData.session) {
    throw new Error('Usuário não autenticado');
  }

  // Prevent sporadic 401s when the access token is close to expiring
  try {
    await supabase.auth.refreshSession();
  } catch (err) {
    console.warn('Falha ao atualizar sessão (seguindo com a sessão atual):', err);
  }

  const { data, error } = await supabase.functions.invoke('n8n-webhook', {
    body: { endpoint, payload },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao chamar webhook');
  }

  // Handle case where n8n is set to "Respond immediately" 
  // which returns "Workflow was started" string instead of JSON
  if (typeof data === 'string') {
    if (data.includes('Workflow was started') || data.includes('started')) {
      // Treat as success - workflow is processing
      return { ok: true, message: 'Processando...' };
    }
    throw new Error(data);
  }

  // Handle n8n response with explicit ok field
  if (data && typeof data === 'object') {
    if (data.ok === false) {
      throw new Error(data.message || data.error || 'Erro na resposta do webhook');
    }
    // If ok is true or not present but no error field, treat as success
    if (data.ok === true || (!data.error && !data.ok)) {
      return { ok: true, ...data } as WebhookResponse;
    }
  }

  return data as WebhookResponse;
}

// Create Professor via webhook (n8n) - academy_id comes from n8n via JWT validation
export function useCreateProfessorWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      cpf?: string;
      phone?: string;
      password: string;
    }) => {
      // Don't send academy_id - n8n gets it from the authenticated user's profile
      return callWebhook('professor', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Professor cadastrado',
        description: `Professor criado via n8n. ID: ${data.profile_id || 'processando...'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar professor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create Professor directly via Edge Function (without n8n)
export function useCreateProfessorDirect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      cpf?: string;
      phone?: string;
      password?: string; // Optional - will be auto-generated if not provided
    }) => {
      console.log('🔍 Payload enviado para create-professor:', data);

      // supabase.functions.invoke automatically includes the auth token
      const { data: response, error } = await supabase.functions.invoke('create-professor', {
        body: data,
      });

      console.log('📥 Resposta da Edge Function:', { response, error });

      if (error) {
        console.error('❌ Erro da Edge Function:', error);
        throw new Error(error.message || 'Erro ao criar professor');
      }

      if (response && !response.ok) {
        console.error('❌ Resposta com erro:', response.error);
        throw new Error(response.error || 'Erro ao criar professor');
      }

      return response as WebhookResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Professor cadastrado',
        description: 'Professor criado com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar professor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create Student via Edge Function (full registration with subscription and invoice)
// Uses create-student edge function directly instead of n8n
export function useCreateStudentWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone?: string;
      password?: string; // Optional - auto-generated if not provided
      birth_date?: string;
      belt_current?: string;
      stripes?: number;
      responsible_instructor_id?: string;
      plan_id: string;
      next_due_at: string;
      grace_days?: number;
      // Fields for BJJ categories
      cpf?: string;
      weight?: number;
      gender?: string;
      category?: string;
      guardian_name?: string;
      guardian_phone?: string;
    }) => {
      // Call edge function directly instead of n8n
      const { data: response, error } = await supabase.functions.invoke('create-student', {
        body: data,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar aluno');
      }

      if (response && !response.ok) {
        throw new Error(response.error || 'Erro ao criar aluno');
      }

      return response as WebhookResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Aluno cadastrado',
        description: `Aluno criado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar aluno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Mark Invoice Paid via webhook (academy_id comes from n8n via JWT validation)
export function useMarkInvoicePaidWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      invoice_id: string;
      method: string;
    }) => {
      // Prefer direct DB RPC to guarantee the invoice is actually updated
      const { data: result, error } = await supabase.rpc('mark_invoice_paid', {
        p_invoice_id: data.invoice_id,
        p_method: data.method,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao baixar fatura');
      }

      const parsed = result as { success: boolean; error?: string };
      if (!parsed?.success) {
        throw new Error(parsed?.error || 'Erro ao baixar fatura');
      }

      return { ok: true } as WebhookResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Fatura baixada',
        description: 'Fatura marcada como paga e aluno liberado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao baixar fatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create Plan via webhook (academy_id comes from n8n via JWT validation)
export function useCreatePlanWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      price: number;
      billing_cycle: string;
      is_active?: boolean;
    }) => {
      // Don't send academy_id - n8n gets it from the authenticated user's profile
      return callWebhook('admin', {
        action: 'create_plan',
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: 'Plano criado',
        description: 'O plano foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar plano',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create Expense Category via webhook (academy_id comes from n8n via JWT validation)
export function useCreateExpenseCategoryWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
    }) => {
      // Don't send academy_id - n8n gets it from the authenticated user's profile
      return callWebhook('admin', {
        action: 'create_expense_category',
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create Expense via webhook (academy_id comes from n8n via JWT validation)
export function useCreateExpenseWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      category_id?: string;
      type: string;
      description: string;
      amount: number;
      due_date?: string;
      recurring?: boolean;
      recurrence_rule?: string;
    }) => {
      // Don't send academy_id - n8n gets it from the authenticated user's profile
      return callWebhook('admin', {
        action: 'create_expense',
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Despesa criada',
        description: 'A despesa foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar despesa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
