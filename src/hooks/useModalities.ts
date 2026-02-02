import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Modality {
  id: string;
  academy_id: string;
  name: string;
  variant: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useModalities() {
  return useQuery({
    queryKey: ['modalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modalities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Modality[];
    },
  });
}

export function useCreateModality() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; variant: string; active: boolean }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('academy_id')
        .eq('id', session.session.user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { data: result, error } = await supabase
        .from('modalities')
        .insert({
          academy_id: profile.academy_id,
          name: data.name,
          variant: data.variant,
          active: data.active,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modalities'] });
      toast({ title: 'Modalidade criada', description: 'Modalidade adicionada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateModality() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; variant: string; active: boolean }) => {
      const { data: result, error } = await supabase
        .from('modalities')
        .update({
          name: data.name,
          variant: data.variant,
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
      queryClient.invalidateQueries({ queryKey: ['modalities'] });
      toast({ title: 'Modalidade atualizada', description: 'Alterações salvas com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteModality() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modalities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modalities'] });
      toast({ title: 'Modalidade excluída', description: 'Modalidade removida com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}
