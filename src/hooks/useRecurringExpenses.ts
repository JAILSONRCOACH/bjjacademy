import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function toDateOnlyString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useEnsureRecurringExpensesForMonth(filters?: { month?: number; year?: number }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['ensure-recurring-expenses', profile?.academy_id, filters?.month, filters?.year],
    queryFn: async () => {
      const now = new Date();
      const month = filters?.month ?? now.getMonth();
      const year = filters?.year ?? now.getFullYear();

      // Buscar apenas templates recorrentes (recurring=true)
      const { data: templates, error } = await supabase
        .from('expenses')
        .select(
          'id, academy_id, category_id, type, description, amount, due_date, recurrence_months, recurrence_rule'
        )
        .eq('recurring', true);

      if (error) throw error;

      const startOfTargetMonth = new Date(year, month, 1);

      const inserts: Array<{
        academy_id: string;
        category_id: string | null;
        type: 'fixed' | 'variable';
        description: string;
        amount: number;
        due_date: string;
        paid_at: string | null;
        payment_method: string | null;
        recurring: boolean;
        recurrence_rule: string | null;
        recurrence_months: number | null;
      }> = [];

      // Preparar updates para templates antigos sem recurrence_rule
      const updates: Array<{ id: string; recurrence_rule: string }> = [];

      for (const t of templates ?? []) {
        if (!t.due_date || !t.recurrence_months) continue;

        const interval = Number(t.recurrence_months) || 1;
        const templateDue = new Date(String(t.due_date) + 'T00:00:00');

        // grupo: usa recurrence_rule se existir; senão usa o próprio id (estável)
        const group = t.recurrence_rule ?? t.id;
        if (!t.recurrence_rule) updates.push({ id: t.id, recurrence_rule: group });

        const monthsDiff =
          (startOfTargetMonth.getFullYear() * 12 + startOfTargetMonth.getMonth()) -
          (templateDue.getFullYear() * 12 + templateDue.getMonth());

        if (monthsDiff <= 0) continue; // mês do template já é a 1ª ocorrência
        if (monthsDiff % interval !== 0) continue;

        const occurrenceDate = addMonths(templateDue, monthsDiff);
        const due_date = toDateOnlyString(occurrenceDate);

        // Já existe ocorrência para este mês?
        const { data: existing, error: existingError } = await supabase
          .from('expenses')
          .select('id')
          .eq('recurrence_rule', group)
          .eq('due_date', due_date)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) continue;

        inserts.push({
          academy_id: t.academy_id,
          category_id: t.category_id,
          type: t.type,
          description: t.description,
          amount: Number(t.amount),
          due_date,
          paid_at: null,
          payment_method: null,
          recurring: false,
          recurrence_rule: group,
          recurrence_months: interval,
        });
      }

      // Atualiza templates antigos (uma vez)
      if (updates.length) {
        await Promise.all(
          updates.map((u) =>
            supabase.from('expenses').update({ recurrence_rule: u.recurrence_rule }).eq('id', u.id)
          )
        );
      }

      // Inserir ocorrências faltantes
      if (inserts.length) {
        const { error: insertError } = await supabase.from('expenses').insert(inserts);
        if (insertError) throw insertError;
      }

      // Atualizar listas/estatísticas somente se houve mudanças
      if (updates.length || inserts.length) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      }

      return { inserted: inserts.length, updatedTemplates: updates.length };
    },
    enabled: !!profile?.academy_id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}
