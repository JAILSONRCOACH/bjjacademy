import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SubscriptionSource = 'saas_subscriptions' | 'academy_subscriptions' | 'none';

export interface SaasSubscriptionStatus {
  status: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  daysRemainingTrial: number | null;
  isTrial: boolean;
  isActive: boolean;
  isPastDue: boolean;
  source: SubscriptionSource;
}

function toTrialDaysRemaining(trialEnd: string | null): number | null {
  if (!trialEnd) return null;
  const endMs = new Date(trialEnd).getTime();
  const diffMs = endMs - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function normalizeStatus(status: string | null): string | null {
  if (!status) return null;
  if (status === 'trialing') return 'trial';
  return status;
}

export function useSaasSubscription() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['saas-subscription-status', profile?.academy_id],
    enabled: !!profile?.academy_id,
    queryFn: async (): Promise<SaasSubscriptionStatus> => {
      const academyId = profile?.academy_id;
      if (!academyId) {
        return {
          status: null,
          trialEnd: null,
          currentPeriodEnd: null,
          daysRemainingTrial: null,
          isTrial: false,
          isActive: false,
          isPastDue: false,
          source: 'none',
        };
      }

      const primaryResult = await supabase
        .from('saas_subscriptions')
        .select('status, trial_end, current_period_end')
        .eq('academy_id', academyId)
        .maybeSingle();

      if (!primaryResult.error && primaryResult.data) {
        const normalized = normalizeStatus(primaryResult.data.status);
        return {
          status: normalized,
          trialEnd: primaryResult.data.trial_end,
          currentPeriodEnd: primaryResult.data.current_period_end,
          daysRemainingTrial: toTrialDaysRemaining(primaryResult.data.trial_end),
          isTrial: normalized === 'trial',
          isActive: normalized === 'active' || normalized === 'lifetime',
          isPastDue: normalized === 'past_due',
          source: 'saas_subscriptions',
        };
      }

      const fallbackResult = await supabase
        .from('academy_subscriptions')
        .select('status, trial_end, current_period_end')
        .eq('academy_id', academyId)
        .maybeSingle();

      if (!fallbackResult.error && fallbackResult.data) {
        const normalized = normalizeStatus(fallbackResult.data.status);
        return {
          status: normalized,
          trialEnd: fallbackResult.data.trial_end,
          currentPeriodEnd: fallbackResult.data.current_period_end,
          daysRemainingTrial: toTrialDaysRemaining(fallbackResult.data.trial_end),
          isTrial: normalized === 'trial',
          isActive: normalized === 'active',
          isPastDue: normalized === 'past_due',
          source: 'academy_subscriptions',
        };
      }

      return {
        status: null,
        trialEnd: null,
        currentPeriodEnd: null,
        daysRemainingTrial: null,
        isTrial: false,
        isActive: false,
        isPastDue: false,
        source: 'none',
      };
    },
  });
}

