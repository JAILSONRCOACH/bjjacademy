import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';
import { BeltType } from '@/lib/beltSystem';

type Student = Tables<'students'>;
type BeltRule = Tables<'belt_rules'>;
type PromotionQueue = Tables<'promotion_queue'>;
type BeltPromotion = Tables<'belt_promotions'>;
type StripeEvent = Tables<'stripe_events'>;

export interface EligibleStudent extends Student {
  remaining_to_stripe: number;
  in_queue: boolean;
}

export function useEligibleStudents() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['eligible-students', profile?.academy_id],
    queryFn: async () => {
      if (!profile?.academy_id) return [];
      
      // Get belt rules first
      const { data: rules } = await supabase
        .from('belt_rules')
        .select('*')
        .eq('academy_id', profile.academy_id);
      
      const rulesMap = new Map(rules?.map(r => [r.belt, r]) || []);
      
      // Get ALL active students to evaluate eligibility
      let query = supabase
        .from('students')
        .select('*')
        .eq('academy_id', profile.academy_id)
        .eq('status', 'active');
      
      // If professor, only get their students
      if (profile.role === 'professor') {
        query = query.eq('responsible_instructor_id', profile.id);
      }
      
      const { data: students, error } = await query;
      if (error) throw error;
      
      // Check which ones are already in queue
      const { data: queueItems } = await supabase
        .from('promotion_queue')
        .select('student_id')
        .eq('academy_id', profile.academy_id)
        .eq('status', 'open');
      
      const inQueueIds = new Set(queueItems?.map(q => q.student_id) || []);
      
      // Calculate eligibility for each student
      const eligibleStudents = (students || []).filter(student => {
        // Skip black belts for belt promotion (but they can still get degrees)
        const rule = rulesMap.get(student.belt_current);
        const classesPerStripe = rule?.classes_per_stripe || 30;
        const stripesToPromote = rule?.stripes_to_promote || 4;
        
        // Check if eligible for BELT change (has enough stripes and not black)
        const eligibleForBelt = student.stripes_cached >= stripesToPromote && student.belt_current !== 'black';
        
        // Check if eligible for STRIPE/DEGREE (has completed enough classes in cycle)
        const eligibleForStripe = student.belt_cycle_classes >= classesPerStripe && student.stripes_cached < stripesToPromote;
        
        return eligibleForBelt || eligibleForStripe;
      });
      
      return eligibleStudents.map(student => {
        const rule = rulesMap.get(student.belt_current);
        const classesPerStripe = rule?.classes_per_stripe || 30;
        const remaining = Math.max(0, classesPerStripe - (student.belt_cycle_classes % classesPerStripe));
        
        return {
          ...student,
          remaining_to_stripe: remaining,
          in_queue: inQueueIds.has(student.id)
        } as EligibleStudent;
      });
    },
    enabled: !!profile?.academy_id
  });
}

export function usePromotionQueue() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['promotion-queue', profile?.academy_id],
    queryFn: async () => {
      if (!profile?.academy_id) return [];
      
      let query = supabase
        .from('promotion_queue')
        .select(`
          *,
          student:students(*)
        `)
        .eq('academy_id', profile.academy_id)
        .eq('status', 'open')
        .order('eligible_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      // If professor, filter by their students
      if (profile.role === 'professor') {
        return (data || []).filter(
          item => item.student?.responsible_instructor_id === profile.id
        );
      }
      
      return data || [];
    },
    enabled: !!profile?.academy_id
  });
}

export function useAddToQueue() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      if (!profile?.academy_id) throw new Error('No academy');
      
      const { error } = await supabase
        .from('promotion_queue')
        .insert({
          academy_id: profile.academy_id,
          student_id: studentId,
          status: 'open'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligible-students'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-queue'] });
    }
  });
}

export function useIgnoreQueue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ queueId, notes }: { queueId: string; notes?: string }) => {
      const { error } = await supabase
        .from('promotion_queue')
        .update({
          status: 'ignored',
          notes,
          processed_at: new Date().toISOString()
        })
        .eq('id', queueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-queue'] });
    }
  });
}

export function usePromoteBelt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      studentId, 
      toBelt, 
      reason 
    }: { 
      studentId: string; 
      toBelt: BeltType; 
      reason?: string 
    }) => {
      const { data, error } = await supabase.rpc('promote_student_belt', {
        p_student_id: studentId,
        p_to_belt: toBelt,
        p_reason: reason || null
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erro ao promover faixa');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-students'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-queue'] });
    }
  });
}

export function useStudentHistory(studentId: string | null) {
  return useQuery({
    queryKey: ['student-history', studentId],
    queryFn: async () => {
      if (!studentId) return { stripeEvents: [], beltPromotions: [] };
      
      const [stripeRes, promotionRes] = await Promise.all([
        supabase
          .from('stripe_events')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('belt_promotions')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);
      
      return {
        stripeEvents: stripeRes.data || [],
        beltPromotions: promotionRes.data || []
      };
    },
    enabled: !!studentId
  });
}

export function useStudentProgress() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['student-progress', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get student record linked to this profile
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!student) return null;
      
      // Get belt rule
      const { data: rule } = await supabase
        .from('belt_rules')
        .select('*')
        .eq('academy_id', student.academy_id)
        .eq('belt', student.belt_current)
        .single();
      
      const classesPerStripe = rule?.classes_per_stripe || 30;
      const stripesToPromote = rule?.stripes_to_promote || 4;
      const remaining = classesPerStripe - (student.belt_cycle_classes % classesPerStripe);
      const isEligible = student.stripes_cached >= stripesToPromote && student.belt_current !== 'black';
      
      return {
        student,
        rule,
        remainingToStripe: remaining,
        isEligible
      };
    },
    enabled: !!profile?.id
  });
}

export function useMyHistory() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['my-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { stripeEvents: [], beltPromotions: [] };
      
      // Get student record
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile.id)
        .single();
      
      if (!student) return { stripeEvents: [], beltPromotions: [] };
      
      const [stripeRes, promotionRes] = await Promise.all([
        supabase
          .from('stripe_events')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('belt_promotions')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);
      
      return {
        stripeEvents: stripeRes.data || [],
        beltPromotions: promotionRes.data || []
      };
    },
    enabled: !!profile?.id
  });
}

export function useBeltRules() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['belt-rules', profile?.academy_id],
    queryFn: async () => {
      if (!profile?.academy_id) return [];
      
      const { data, error } = await supabase
        .from('belt_rules')
        .select('*')
        .eq('academy_id', profile.academy_id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.academy_id
  });
}
