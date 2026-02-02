import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Student {
  id: string;
  academy_id: string;
  profile_id: string | null;
  name: string;
  birth_date: string | null;
  responsible_instructor_id: string | null;
  belt_current: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  belt_cycle_classes: number;
  total_classes: number;
  stripes_cached: number;
  financial_status: 'ok' | 'pending' | 'overdue' | 'blocked';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  cpf: string | null;
  weight: number | null;
  gender: 'male' | 'female' | null;
  category: string | null;
  email: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  instructor?: {
    name: string;
  } | null;
}

export interface BeltRule {
  academy_id: string;
  belt: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  classes_per_stripe: number;
  stripes_to_promote: number;
}

export function useStudents() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['students', profile?.id, profile?.role],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          instructor:profiles!students_responsible_instructor_id_fkey(name)
        `);

      // If user is a professor, only show their students
      if (profile?.role === 'professor') {
        query = query.eq('responsible_instructor_id', profile.id);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as Student[];
    },
  });
}

export function useStudentByProfileId(profileId: string | undefined) {
  return useQuery({
    queryKey: ['student', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      // First try to auto-link if needed
      await supabase.rpc('link_my_student_record');

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data as Student | null;
    },
    enabled: !!profileId,
  });
}

export function useBeltRules(academyId: string | undefined) {
  return useQuery({
    queryKey: ['belt-rules', academyId],
    queryFn: async () => {
      if (!academyId) return [];

      const { data, error } = await supabase
        .from('belt_rules')
        .select('academy_id, belt, classes_per_stripe, stripes_to_promote')
        .eq('academy_id', academyId);

      if (error) throw error;
      return data as BeltRule[];
    },
    enabled: !!academyId,
  });
}

export function useInstructors(academyId: string | undefined) {
  return useQuery({
    queryKey: ['instructors', academyId],
    queryFn: async () => {
      if (!academyId) return [];

      // Include both professors AND admins as instructors
      // (admin is the academy owner and can also teach)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, cpf, phone, role')
        .eq('academy_id', academyId)
        .in('role', ['professor', 'admin']);

      if (error) throw error;
      return data as { id: string; name: string; email: string | null; cpf: string | null; phone: string | null; role: string }[];
    },
    enabled: !!academyId,
  });
}

export function calculateClassesToNextStripe(
  beltCurrent: string,
  beltCycleClasses: number,
  beltRules: BeltRule[]
): string {
  if (beltCurrent === 'black') return 'N/A';

  const rule = beltRules.find(r => r.belt === beltCurrent);
  if (!rule) return '-';

  const remaining = rule.classes_per_stripe - (beltCycleClasses % rule.classes_per_stripe);
  return remaining.toString();
}
