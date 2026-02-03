import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutBody {
  plan_id?: string;
  card_token?: string;
  customer_data?: {
    name?: string;
    email?: string;
    document?: string;
    phone?: string;
  };
}

function mapProviderStatus(status: string | undefined): string {
  if (status === "active") return "active";
  if (status === "past_due" || status === "payment_failed") return "past_due";
  if (status === "canceled" || status === "cancelled") return "canceled";
  return "trial";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const pagarmeApiKey = Deno.env.get("PAGARME_API_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Ambiente Supabase não configurado.");
    }
    if (!pagarmeApiKey) {
      throw new Error("PAGARME_API_KEY não configurada.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("academy_id, role, email, name")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Perfil não encontrado.");
    }

    if (profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Somente administradores podem assinar o plano PRO." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = (await req.json()) as CheckoutBody;
    if (!body.plan_id || !body.card_token) {
      throw new Error("plan_id e card_token são obrigatórios.");
    }

    const customerName = body.customer_data?.name?.trim() || profile.name || "Responsável";
    const customerEmail = body.customer_data?.email?.trim() || profile.email || "";
    const customerDocument = (body.customer_data?.document || "").replace(/\D/g, "");
    const customerPhone = (body.customer_data?.phone || "").replace(/\D/g, "");

    if (!customerEmail) {
      throw new Error("E-mail do cliente é obrigatório.");
    }
    if (customerDocument.length < 11) {
      throw new Error("Documento inválido (CPF/CNPJ).");
    }
    if (customerPhone.length < 10) {
      throw new Error("Telefone inválido. Informe DDD + número.");
    }

    const areaCode = customerPhone.slice(0, 2);
    const phoneNumber = customerPhone.slice(2);

    const { data: plan, error: planError } = await adminClient
      .from("saas_plans")
      .select("id, price, interval, active")
      .eq("id", body.plan_id)
      .single();

    if (planError || !plan || !plan.active) {
      throw new Error("Plano inválido ou inativo.");
    }

    const pagarmePayload = {
      code: profile.academy_id,
      payment_method: "credit_card",
      currency: "BRL",
      interval: plan.interval === "year" ? "year" : "month",
      interval_count: 1,
      billing_type: "prepaid",
      pricing_scheme: {
        scheme_type: "unit",
        price: plan.price,
      },
      customer: {
        name: customerName,
        email: customerEmail,
        document: customerDocument,
        type: customerDocument.length > 11 ? "company" : "individual",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: areaCode,
            number: phoneNumber,
          },
        },
      },
      card_token: body.card_token,
    };

    const pagarmeResponse = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${pagarmeApiKey}:`),
      },
      body: JSON.stringify(pagarmePayload),
    });

    const providerResult = await pagarmeResponse.json();
    if (!pagarmeResponse.ok) {
      console.error("Pagar.me subscription error:", providerResult);
      throw new Error(providerResult?.message || "Falha ao processar pagamento no Pagar.me.");
    }

    const mappedStatus = mapProviderStatus(providerResult?.status);

    const upsertSaas = async (statusValue: string) =>
      adminClient
        .from("saas_subscriptions")
        .upsert({
          academy_id: profile.academy_id,
          plan_id: body.plan_id,
          pagarme_subscription_id: providerResult?.id || null,
          pagarme_customer_id: providerResult?.customer?.id || null,
          status: statusValue,
          current_period_end: providerResult?.current_cycle?.end_at || null,
          updated_at: new Date().toISOString(),
        });

    let dbError: { message?: string } | null = null;

    const primaryWrite = await upsertSaas(mappedStatus);
    dbError = primaryWrite.error;

    if (dbError?.message?.includes("invalid input value for enum") && mappedStatus === "trial") {
      const retryTrialing = await upsertSaas("trialing");
      dbError = retryTrialing.error;
    }

    if (dbError?.message?.includes('relation "public.saas_subscriptions" does not exist')) {
      const fallbackStatus = mappedStatus === "trial" ? "trialing" : mappedStatus;
      const fallbackWrite = await adminClient
        .from("academy_subscriptions")
        .upsert({
          academy_id: profile.academy_id,
          payment_provider: "pagarme",
          external_customer_id: providerResult?.customer?.id || null,
          external_subscription_id: providerResult?.id || null,
          status: fallbackStatus,
          current_period_end: providerResult?.current_cycle?.end_at || null,
          updated_at: new Date().toISOString(),
        });

      dbError = fallbackWrite.error;
    }

    if (dbError) {
      console.error("Database subscription update error:", dbError);
      throw new Error("Pagamento processado, mas falhou ao atualizar assinatura no banco.");
    }

    return new Response(
      JSON.stringify({ success: true, subscription: providerResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado no checkout.";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

