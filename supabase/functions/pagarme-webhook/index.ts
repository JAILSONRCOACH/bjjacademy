import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapStatusByType(eventType: string): string | null {
  if (eventType === "subscription.renewed" || eventType === "subscription.created") return "active";
  if (eventType === "subscription.canceled") return "canceled";
  if (eventType === "subscription.payment_failed") return "past_due";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const type = payload?.type as string | undefined;
    const data = payload?.data;

    if (!type || !data) {
      return new Response("Invalid payload", { status: 400, headers: corsHeaders });
    }

    const newStatus = mapStatusByType(type);
    const subscriptionId = data?.subscription?.id || data?.id;
    if (!newStatus || !subscriptionId) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentPeriodEnd = data?.current_cycle?.end_at || null;

    const primaryUpdate = await supabaseClient
      .from("saas_subscriptions")
      .update({
        status: newStatus,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("pagarme_subscription_id", subscriptionId);

    let dbError = primaryUpdate.error;

    if (dbError?.message?.includes("invalid input value for enum") && newStatus === "trial") {
      const retryUpdate = await supabaseClient
        .from("saas_subscriptions")
        .update({
          status: "trialing",
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("pagarme_subscription_id", subscriptionId);

      dbError = retryUpdate.error;
    }

    if (dbError?.message?.includes('relation "public.saas_subscriptions" does not exist')) {
      const fallbackStatus = newStatus === "trial" ? "trialing" : newStatus;
      const fallbackUpdate = await supabaseClient
        .from("academy_subscriptions")
        .update({
          status: fallbackStatus,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("external_subscription_id", subscriptionId);

      dbError = fallbackUpdate.error;
    }

    if (dbError) {
      console.error("Webhook DB update error:", dbError);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

