import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface Guardian {
    id: string;
    academy_id: string;
    student_id: string;
    name: string;
    cpf: string | null;
    rg: string | null;
    email: string | null;
    phone: string | null;
    relationship: 'pai' | 'mae' | 'tutor' | 'outro';
    address_json: AddressJson | null;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface AddressJson {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip?: string;
}

export interface CreateGuardianInput {
    student_id: string;
    name: string;
    cpf?: string;
    rg?: string;
    email?: string;
    phone?: string;
    relationship: 'pai' | 'mae' | 'tutor' | 'outro';
    address_json?: AddressJson;
    is_primary?: boolean;
}

export interface UpdateGuardianInput extends Partial<CreateGuardianInput> {
    id: string;
}

// Hook to fetch guardians for a student
export function useGuardians(studentId: string | null) {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['guardians', studentId],
        queryFn: async () => {
            if (!studentId || !profile?.academy_id) return [];

            const { data, error } = await supabase
                .from('guardians')
                .select('*')
                .eq('student_id', studentId)
                .eq('academy_id', profile.academy_id)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as Guardian[];
        },
        enabled: !!studentId && !!profile?.academy_id,
    });
}

// Hook to fetch primary guardian for a student
export function usePrimaryGuardian(studentId: string | null) {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['guardians', studentId, 'primary'],
        queryFn: async () => {
            if (!studentId || !profile?.academy_id) return null;

            const { data, error } = await supabase
                .from('guardians')
                .select('*')
                .eq('student_id', studentId)
                .eq('academy_id', profile.academy_id)
                .eq('is_primary', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as Guardian | null;
        },
        enabled: !!studentId && !!profile?.academy_id,
    });
}

// Hook to create a guardian
export function useCreateGuardian() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: async (input: CreateGuardianInput) => {
            if (!profile?.academy_id) throw new Error('Academy ID not found');

            // If this is marked as primary, unmark others
            if (input.is_primary) {
                await supabase
                    .from('guardians')
                    .update({ is_primary: false })
                    .eq('student_id', input.student_id)
                    .eq('academy_id', profile.academy_id);
            }

            const { data, error } = await supabase
                .from('guardians')
                .insert({
                    ...input,
                    academy_id: profile.academy_id,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Guardian;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['guardians', data.student_id] });
        },
    });
}

// Hook to update a guardian
export function useUpdateGuardian() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: async ({ id, ...updates }: UpdateGuardianInput) => {
            if (!profile?.academy_id) throw new Error('Academy ID not found');

            // If marking as primary, unmark others first
            if (updates.is_primary && updates.student_id) {
                await supabase
                    .from('guardians')
                    .update({ is_primary: false })
                    .eq('student_id', updates.student_id)
                    .eq('academy_id', profile.academy_id)
                    .neq('id', id);
            }

            const { data, error } = await supabase
                .from('guardians')
                .update(updates)
                .eq('id', id)
                .eq('academy_id', profile.academy_id)
                .select()
                .single();

            if (error) throw error;
            return data as Guardian;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['guardians', data.student_id] });
        },
    });
}

// Hook to delete a guardian
export function useDeleteGuardian() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
            if (!profile?.academy_id) throw new Error('Academy ID not found');

            const { error } = await supabase
                .from('guardians')
                .delete()
                .eq('id', id)
                .eq('academy_id', profile.academy_id);

            if (error) throw error;
            return { id, studentId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['guardians', data.studentId] });
        },
    });
}

// Hook to check if a student needs a guardian (is minor)
export function useStudentNeedsGuardian(birthDate: string | null) {
    if (!birthDate) return false;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age < 18;
}
