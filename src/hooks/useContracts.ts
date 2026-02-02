import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'manual_signed' | 'void';
export type SignatureMethod = 'digital' | 'manual';

export interface ContractTemplate {
  id: string;
  academy_id: string;
  title: string;
  version: number;
  body_html: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  academy_id: string;
  student_id: string;
  template_id: string;
  status: ContractStatus;
  contract_token: string | null;
  sent_at: string | null;
  signed_at: string | null;
  voided_at: string | null;
  voided_reason: string | null;
  pdf_url: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  updated_at: string;
  student?: { id: string; name: string; email: string | null };
  template?: ContractTemplate;
  snapshot_json?: any;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_profile_id: string | null;
  signer_name: string;
  signer_document: string;
  method: SignatureMethod;
  signature_svg: string | null;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Templates hooks
export function useContractTemplates() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['contract-templates', profile?.academy_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContractTemplate[];
    },
    enabled: !!profile?.academy_id,
  });
}

export function useActiveTemplate() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['active-template', profile?.academy_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ContractTemplate | null;
    },
    enabled: !!profile?.academy_id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (template: { title: string; body_html: string }) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          ...template,
          academy_id: profile!.academy_id,
          created_by: profile!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-template'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('contract_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-template'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    },
  });
}

// Contracts hooks
export function useContracts(filters?: { status?: string; studentId?: string }) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['contracts', profile?.academy_id, filters],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          student:students(id, name, email),
          template:contract_templates(id, title, version, body_html)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as ContractStatus);
      }

      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map snapshot to template body
      return (data as any[]).map(contract => ({
        ...contract,
        template: {
          ...contract.template,
          body_html: (contract.snapshot_json as any)?.html || contract.template?.body_html || ''
        }
      })) as Contract[];
    },
    enabled: !!profile?.academy_id,
  });
}

export function useContractByToken(token: string | null) {
  return useQuery({
    queryKey: ['contract-token', token],
    queryFn: async () => {
      if (!token) return null;

      // Use secure RPC function to get contract by exact token match
      const { data: contractData, error: contractError } = await supabase
        .rpc('get_contract_by_token', { p_token: token });

      if (contractError) throw contractError;
      if (!contractData || contractData.length === 0) return null;

      const contract = contractData[0];

      // Fetch related student and template data
      // These queries work because we now have the contract ID
      const [studentResult, templateResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, name, email, cpf, birth_date, guardian_name')
          .eq('id', contract.student_id)
          .maybeSingle(),
        supabase
          .from('contract_templates')
          .select('id, title, version, body_html')
          .eq('id', contract.template_id)
          .maybeSingle(),
      ]);

      if (studentResult.error) throw studentResult.error;
      if (templateResult.error) throw templateResult.error;

      return {
        ...contract,
        student: studentResult.data,
        template: {
          ...templateResult.data,
          body_html: (contract.snapshot_json as any)?.html || templateResult.data.body_html
        },
      } as Contract & {
        student: { id: string; name: string; email: string | null; cpf: string | null; birth_date: string | null; guardian_name: string | null };
        template: ContractTemplate;
      };
    },
    enabled: !!token,
  });
}

export function useStudentContracts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-contracts', user?.id],
    queryFn: async () => {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user!.id)
        .maybeSingle();

      if (!student) return [];

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          template:contract_templates(id, title, version, body_html)
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (error) throw error;

      // Map snapshot to template body
      return (data as any[]).map(contract => ({
        ...contract,
        template: {
          ...contract.template,
          body_html: (contract.snapshot_json as any)?.html || contract.template?.body_html || ''
        }
      })) as (Contract & { template: ContractTemplate })[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ studentId, templateId, snapshot }: { studentId: string; templateId: string, snapshot?: any }) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          academy_id: profile!.academy_id,
          student_id: studentId,
          template_id: templateId,
          snapshot_json: snapshot,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, snapshot }: { contractId: string; snapshot: any }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({
          snapshot_json: snapshot,
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      // Invalidate specific keys if needed, like the public token view
      if (data.contract_token) {
        queryClient.invalidateQueries({ queryKey: ['contract-token', data.contract_token] });
      }
    },
  });
}

export function useSendContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .select(`
          *,
          student:students(id, name, email, phone)
        `)
        .single();

      if (error) throw error;
      return data as Contract & { student: { id: string; name: string; email: string | null; phone: string | null } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      signerName,
      signerDocument,
      signatureSvg,
      method = 'digital',
    }: {
      contractId: string;
      signerName: string;
      signerDocument: string;
      signatureSvg: string;
      method?: SignatureMethod;
    }) => {
      // Create signature
      const { error: sigError } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contractId,
          signer_name: signerName,
          signer_document: signerDocument,
          signature_svg: signatureSvg,
          method,
          ip_address: null, // Would need edge function to get real IP
          user_agent: navigator.userAgent,
        });

      if (sigError) throw sigError;

      // Update contract status
      const { data, error } = await supabase
        .from('contracts')
        .update({
          status: method === 'digital' ? 'signed' : 'manual_signed',
          signed_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['student-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-token'] });
    },
  });
}

export function useVoidContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, reason }: { contractId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({
          status: 'void',
          voided_at: new Date().toISOString(),
          voided_reason: reason || null,
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useMarkContractManualSigned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, signerName, signerDocument }: {
      contractId: string;
      signerName: string;
      signerDocument: string;
    }) => {
      // Create manual signature record
      const { error: sigError } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contractId,
          signer_name: signerName,
          signer_document: signerDocument,
          method: 'manual',
        });

      if (sigError) throw sigError;

      const { data, error } = await supabase
        .from('contracts')
        .update({
          status: 'manual_signed',
          signed_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useContractSignatures(contractId: string | undefined) {
  return useQuery({
    queryKey: ['contract-signatures', contractId],
    queryFn: async () => {
      if (!contractId) return [];

      const { data, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContractSignature[];
    },
    enabled: !!contractId,
  });
}

// Helper to generate contract URL
export function getContractUrl(contractToken: string) {
  return `${window.location.origin}/contrato/${contractToken}`;
}

// Helper to prepare webhook payload
export function prepareContractWebhookPayload(contract: Contract & { student: { name: string; email: string | null; phone: string | null } }) {
  return {
    contractId: contract.id,
    contractUrl: getContractUrl(contract.contract_token!),
    studentName: contract.student.name,
    studentEmail: contract.student.email,
    studentPhone: contract.student.phone,
    status: contract.status,
    sentAt: contract.sent_at,
  };
}
