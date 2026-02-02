import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface Plan {
  id: string;
  academy_id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  academy_id: string;
  student_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'paused';
  started_at: string;
  next_due_at: string;
  grace_days: number;
  created_at: string;
  plan?: Plan;
  student?: { id: string; name: string };
}

export interface Invoice {
  id: string;
  academy_id: string;
  student_id: string;
  subscription_id: string | null;
  due_date: string;
  amount: number;
  status: 'open' | 'paid' | 'overdue' | 'canceled';
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  student?: { id: string; name: string };
}

export interface ExpenseCategory {
  id: string;
  academy_id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  academy_id: string;
  category_id: string | null;
  type: 'fixed' | 'variable';
  description: string;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  recurring: boolean;
  recurrence_rule: string | null;
  recurrence_months: number | null;
  payment_method: string | null;
  created_at: string;
  category?: ExpenseCategory;
}

// Plans hooks
export function usePlans() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['plans', profile?.academy_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Plan[];
    },
    enabled: !!profile?.academy_id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (plan: Omit<Plan, 'id' | 'academy_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('plans')
        .insert({
          ...plan,
          academy_id: profile!.academy_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Plan> & { id: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

// Subscriptions hooks
export function useSubscriptions() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['subscriptions', profile?.academy_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*),
          student:students(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!profile?.academy_id,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      planId: string;
      startDate?: string;
      graceDays?: number;
    }) => {
      const { data, error } = await supabase.rpc('create_subscription_with_invoice', {
        p_student_id: params.studentId,
        p_plan_id: params.planId,
        p_start_date: params.startDate || new Date().toISOString().split('T')[0],
        p_grace_days: params.graceDays || 3,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; subscription_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar assinatura');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Invoices hooks
export function useInvoices(filters?: { status?: string; studentId?: string }) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['invoices', profile?.academy_id, filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          student:students(id, name)
        `)
        .order('due_date', { ascending: false });
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as 'open' | 'paid' | 'overdue' | 'canceled');
      }
      
      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!profile?.academy_id,
  });
}

export function useStudentInvoices() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['student-invoices', user?.id],
    queryFn: async () => {
      // First get student id from profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user!.id)
        .maybeSingle();
      
      if (studentError) throw studentError;
      if (!student) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user?.id,
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, method }: { invoiceId: string; method: string }) => {
      const { data, error } = await supabase.rpc('mark_invoice_paid', {
        p_invoice_id: invoiceId,
        p_method: method,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erro ao marcar fatura como paga');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'canceled' as const })
        .eq('id', invoiceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
    },
  });
}

// Expense Categories hooks
export function useExpenseCategories() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['expense-categories', profile?.academy_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ExpenseCategory[];
    },
    enabled: !!profile?.academy_id,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          name,
          academy_id: profile!.academy_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

// Expenses hooks
export function useExpenses(filters?: { month?: number; year?: number }) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['expenses', profile?.academy_id, filters?.month, filters?.year],
    queryFn: async () => {
      const now = new Date();
      const month = filters?.month ?? now.getMonth();
      const year = filters?.year ?? now.getFullYear();
      
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .or(`due_date.gte.${startDate},due_date.is.null`)
        .or(`due_date.lte.${endDate},due_date.is.null`)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      // Filtrar no cliente para garantir precisão
      return (data as Expense[]).filter(exp => {
        if (exp.due_date) {
          const dueDate = new Date(exp.due_date + 'T00:00:00');
          return dueDate >= startOfMonth && dueDate <= endOfMonth;
        }
        // Se não tem data de vencimento, mostrar baseado na criação
        const createdAt = new Date(exp.created_at);
        return createdAt >= startOfMonth && createdAt <= endOfMonth;
      });
    },
    enabled: !!profile?.academy_id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'academy_id' | 'created_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          academy_id: profile!.academy_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useMarkExpensePaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { expenseId: string; payment_method: string; paid_at: string }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          paid_at: params.paid_at,
          payment_method: params.payment_method,
        })
        .eq('id', params.expenseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    },
  });
}

// Invoice stats hook
export function useInvoiceStats() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['invoice-stats', profile?.academy_id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status, amount, paid_at')
        .gte('due_date', startOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const stats = {
        totalOpen: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countOpen: 0,
        countPaid: 0,
        countOverdue: 0,
      };
      
      invoices?.forEach((inv) => {
        const amount = Number(inv.amount);
        switch (inv.status) {
          case 'open':
            stats.totalOpen += amount;
            stats.countOpen++;
            break;
          case 'paid':
            stats.totalPaid += amount;
            stats.countPaid++;
            break;
          case 'overdue':
            stats.totalOverdue += amount;
            stats.countOverdue++;
            break;
        }
      });
      
      return stats;
    },
    enabled: !!profile?.academy_id,
  });
}

// Expense stats hook
export function useExpenseStats(filters?: { month?: number; year?: number }) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['expense-stats', profile?.academy_id, filters?.month, filters?.year],
    queryFn: async () => {
      const now = new Date();
      const month = filters?.month ?? now.getMonth();
      const year = filters?.year ?? now.getFullYear();
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('type, amount, paid_at, due_date, recurring, recurrence_rule, recurrence_months, created_at');
      
      if (error) throw error;
      
      const stats = {
        totalMonth: 0,
        totalRecurring: 0,
        totalPaid: 0,
        totalOverdue: 0,
        totalPending: 0,
        countOverdue: 0,
        countPending: 0,
      };
      
      expenses?.forEach((exp) => {
        const amount = Number(exp.amount);
        const dueDate = exp.due_date ? new Date(exp.due_date + 'T00:00:00') : null;
        const createdAt = new Date(exp.created_at);
        
        // Considerar se a despesa está no mês selecionado (por vencimento ou criação)
        const isInMonth = dueDate 
          ? (dueDate >= startOfMonth && dueDate <= endOfMonth)
          : (createdAt >= startOfMonth && createdAt <= endOfMonth);
        
        if (isInMonth) {
          stats.totalMonth += amount;
          
          // Recorrente = template (recurring) OU ocorrência gerada (recurrence_rule + recurrence_months)
          const isRecurring = Boolean(exp.recurring || (exp.recurrence_rule && exp.recurrence_months));
          if (isRecurring) {
            stats.totalRecurring += amount;
          }
          
          if (exp.paid_at) {
            stats.totalPaid += amount;
          } else if (dueDate && dueDate < today) {
            // Vencida (não paga e data passou)
            stats.totalOverdue += amount;
            stats.countOverdue++;
          } else {
            // A vencer (não paga e data não passou)
            stats.totalPending += amount;
            stats.countPending++;
          }
        }
      });
      
      return stats;
    },
    enabled: !!profile?.academy_id,
  });
}
