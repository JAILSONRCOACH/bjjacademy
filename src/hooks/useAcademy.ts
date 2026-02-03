import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAcademy() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['academy', profile?.academy_id],
    queryFn: async () => {
      if (!profile?.academy_id) return null;

      const { data, error } = await supabase
        .from('academies')
        .select('*')
        .eq('id', profile.academy_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.academy_id
  });
}

export function useUpdateAcademy() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      phone?: string;
      address?: string;
      logo_url?: string;
      cnpj?: string | null;
      cpf?: string | null;
      razao_social?: string | null;
      email?: string | null;
      whatsapp?: string | null;
      responsible_name?: string | null;
      address_json?: any;

      // New fields
      bank_info?: any;
    }) => {
      if (!profile?.academy_id) throw new Error('No academy');

      const { error } = await supabase
        .from('academies')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.academy_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy'] });
    }
  });
}
