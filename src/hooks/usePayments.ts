import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Invoice {
  id: string;
  academy_id: string;
  student_id: string;
  subscription_id: string | null;
  amount: number;
  due_date: string;
  status: 'open' | 'paid' | 'overdue' | 'canceled';
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  provider: string | null;
  external_reference: string | null;
  provider_payment_id: string | null;
  provider_status: string | null;
  checkout_url: string | null;
  pix_qr_base64: string | null;
  pix_copiaecola: string | null;
  pix_expires_at: string | null;
  created_at: string;
  student?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
  };
}

export function useInvoices(filters?: { status?: string; studentId?: string }) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['invoices', profile?.academy_id, filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          student:students(id, name, email, phone, status)
        `)
        .eq('academy_id', profile!.academy_id)
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
  const { profile, activeRole } = useAuth(); // Get activeRole

  return useQuery({
    queryKey: ['student-invoices', profile?.id],
    queryFn: async () => {
      // First get the student record linked to this profile
      // Use maybeSingle to avoid 406 error if no student record found (e.g. admin)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, status, suspended_reason, suspended_at')
        .eq('profile_id', profile!.id)
        .maybeSingle();

      if (studentError || !student) {
        return { invoices: [], student: null };
      }

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return { invoices: invoices as Invoice[], student };
    },
    // Only fetch if profile exists AND active role is student
    enabled: !!profile?.id && activeRole === 'student',
  });
}

export function useCreatePaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('mp-create-payment', {
        body: { invoice_id: invoiceId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as {
        pix_copiaecola: string | null;
        pix_qr_base64: string | null;
        pix_expires_at: string | null;
        checkout_url: string | null;
        payment_id?: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['student-invoices'] });
    },
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['student-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
