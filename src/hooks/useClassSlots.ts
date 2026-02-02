import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClassSlot {
  id: string;
  academy_id: string;
  modality_id: string;
  instructor_id: string | null;
  day_of_week: number[]; // Changed to array for multiple days
  start_time: string;
  end_time: string;
  shift: 'morning' | 'afternoon' | 'night';
  title: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  modality?: {
    id: string;
    name: string;
    variant: string;
  };
  instructor?: {
    id: string;
    name: string;
  };
}

export function useClassSlots(filters?: { modality_id?: string; instructor_id?: string; shift?: string }) {
  return useQuery({
    queryKey: ['class-slots', filters],
    queryFn: async () => {
      let query = supabase
        .from('class_slots')
        .select(`
          *,
          modality:modalities(id, name, variant),
          instructor:profiles!class_slots_instructor_id_fkey(id, name)
        `)
        .order('day_of_week')
        .order('start_time');

      if (filters?.modality_id) {
        query = query.eq('modality_id', filters.modality_id);
      }
      if (filters?.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id);
      }
      if (filters?.shift) {
        query = query.eq('shift', filters.shift);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ClassSlot[];
    },
  });
}

export function useCreateClassSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      modality_id: string;
      instructor_id?: string;
      day_of_week: number[]; // Changed to array
      start_time: string;
      end_time: string;
      shift: string;
      title?: string;
      active: boolean;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('academy_id')
        .eq('id', session.session.user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { data: result, error } = await supabase
        .from('class_slots')
        .insert({
          academy_id: profile.academy_id,
          modality_id: data.modality_id,
          instructor_id: data.instructor_id || null,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          shift: data.shift,
          title: data.title || null,
          active: data.active,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({ title: 'Horário criado', description: 'Horário de aula adicionado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClassSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      modality_id: string;
      instructor_id?: string;
      day_of_week: number[]; // Changed to array
      start_time: string;
      end_time: string;
      shift: string;
      title?: string;
      active: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from('class_slots')
        .update({
          modality_id: data.modality_id,
          instructor_id: data.instructor_id || null,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          shift: data.shift,
          title: data.title || null,
          active: data.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({ title: 'Horário atualizado', description: 'Alterações salvas com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteClassSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('class_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-slots'] });
      toast({ title: 'Horário excluído', description: 'Horário de aula removido com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const SHIFT_NAMES: Record<string, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
};
