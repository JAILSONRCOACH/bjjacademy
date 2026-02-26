import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChargeBreakdown {
  base_amount: number;
  late_fee_percent: number;
  monthly_interest_percent: number;
  late_fee_amount: number;
  interest_amount: number;
  days_overdue: number;
  amount_charged: number;
  calculated_at: string;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parsePercent(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const normalized = raw.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function calculateDaysOverdue(dueDateIso: string): number {
  const due = new Date(`${dueDateIso}T00:00:00`);
  const now = new Date();
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.floor((todayUtc - dueUtc) / 86400000);
  return Math.max(0, diffDays);
}

function parseStoredBreakdown(raw: unknown): ChargeBreakdown | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (
      typeof parsed?.amount_charged === "number" &&
      typeof parsed?.base_amount === "number" &&
      typeof parsed?.days_overdue === "number"
    ) {
      return parsed as ChargeBreakdown;
    }
  } catch (_e) {
    return null;
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!mpAccessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { invoice_id } = await req.json();
    
    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating payment for invoice: ${invoice_id}`);

    // Fetch invoice with student and academy info
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        student:students(id, name, email, phone, cpf),
        academy:academies(id, name, bank_info)
      `)
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Fatura não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invoice.status === "paid") {
      return new Response(
        JSON.stringify({ error: "Fatura já foi paga" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bankInfo = (invoice.academy as { bank_info?: Record<string, unknown> } | null)?.bank_info || {};
    const baseAmount = Number(invoice.amount);
    const lateFeePercent = parsePercent(bankInfo.late_fee_percent, 2);
    const monthlyInterestPercent = parsePercent(bankInfo.monthly_interest_percent, 2);
    const daysOverdue = calculateDaysOverdue(invoice.due_date);
    const lateFeeAmount = daysOverdue > 0 ? roundMoney(baseAmount * (lateFeePercent / 100)) : 0;
    const interestAmount =
      daysOverdue > 0
        ? roundMoney(baseAmount * (monthlyInterestPercent / 100) * (daysOverdue / 30))
        : 0;
    const amountCharged = roundMoney(baseAmount + lateFeeAmount + interestAmount);

    const chargeBreakdown: ChargeBreakdown = {
      base_amount: baseAmount,
      late_fee_percent: lateFeePercent,
      monthly_interest_percent: monthlyInterestPercent,
      late_fee_amount: lateFeeAmount,
      interest_amount: interestAmount,
      days_overdue: daysOverdue,
      amount_charged: amountCharged,
      calculated_at: new Date().toISOString(),
    };

    // Check if already has valid PIX data (not expired)
    const now = new Date();
    const pixExpiresAt = invoice.pix_expires_at ? new Date(invoice.pix_expires_at) : null;
    const storedBreakdown = parseStoredBreakdown(invoice.provider_ref);
    
    if (invoice.pix_copiaecola && invoice.pix_qr_base64 && pixExpiresAt && pixExpiresAt > now) {
      console.log("Returning existing PIX data");
      const existingAmount = storedBreakdown?.amount_charged ?? Number(invoice.amount);
      return new Response(
        JSON.stringify({
          pix_copiaecola: invoice.pix_copiaecola,
          pix_qr_base64: invoice.pix_qr_base64,
          pix_expires_at: invoice.pix_expires_at,
          checkout_url: invoice.checkout_url,
          amount_charged: existingAmount,
          late_fee_amount: storedBreakdown?.late_fee_amount ?? 0,
          interest_amount: storedBreakdown?.interest_amount ?? 0,
          days_overdue: storedBreakdown?.days_overdue ?? 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create payment with PIX
    const paymentData = {
      transaction_amount: chargeBreakdown.amount_charged,
      description: `Mensalidade - ${invoice.academy?.name || "Academia"} - ${invoice.due_date}${
        chargeBreakdown.days_overdue > 0 ? ` (atraso ${chargeBreakdown.days_overdue}d)` : ""
      }`,
      payment_method_id: "pix",
      payer: {
        email: invoice.student?.email || "aluno@academia.com",
        first_name: invoice.student?.name?.split(" ")[0] || "Aluno",
        last_name: invoice.student?.name?.split(" ").slice(1).join(" ") || "",
        identification: invoice.student?.cpf ? {
          type: "CPF",
          number: invoice.student.cpf.replace(/\D/g, ""),
        } : undefined,
      },
      external_reference: invoice_id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    console.log("Creating PIX payment:", JSON.stringify(paymentData));

    const mpPaymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
        "X-Idempotency-Key": `invoice-${invoice_id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentData),
    });

    const mpPayment = await mpPaymentResponse.json();

    if (!mpPaymentResponse.ok) {
      console.error("Mercado Pago payment error:", mpPayment);
      return new Response(
        JSON.stringify({ error: "Erro ao criar pagamento PIX", details: mpPayment }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PIX payment created:", mpPayment.id);

    // Extract PIX data
    const pixData = mpPayment.point_of_interaction?.transaction_data;
    const pixCopiaECola = pixData?.qr_code || null;
    const pixQrBase64 = pixData?.qr_code_base64 || null;
    const pixExpirationDate = mpPayment.date_of_expiration || null;

    // Also create Checkout Pro preference for alternative payment
    let checkoutUrl = invoice.checkout_url;
    
    if (!checkoutUrl) {
      const preference = {
        items: [
          {
            title: `Mensalidade - ${invoice.academy?.name || "Academia"}`,
            description: `Fatura ${invoice_id.slice(0, 8)} - Vencimento: ${invoice.due_date}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: chargeBreakdown.amount_charged,
          },
        ],
        payer: {
          name: invoice.student?.name || "Aluno",
          email: invoice.student?.email || undefined,
        },
        external_reference: invoice_id,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
        back_urls: {
          success: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/aluno/mensalidade?status=success`,
          failure: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/aluno/mensalidade?status=failure`,
          pending: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/aluno/mensalidade?status=pending`,
        },
        auto_return: "approved",
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      console.log("Creating Checkout Pro preference");

      const mpPrefResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify(preference),
      });

      const mpPrefData = await mpPrefResponse.json();

      if (mpPrefResponse.ok) {
        checkoutUrl = mpPrefData.init_point;
        console.log("Checkout preference created:", mpPrefData.id);
      } else {
        console.error("Checkout preference error:", mpPrefData);
      }
    }

    // Update invoice with PIX and checkout data
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        pix_copiaecola: pixCopiaECola,
        pix_qr_base64: pixQrBase64,
        pix_expires_at: pixExpirationDate,
        checkout_url: checkoutUrl,
        external_reference: invoice_id,
        provider: "mercadopago",
        provider_ref: JSON.stringify(chargeBreakdown),
        provider_payment_id: String(mpPayment.id),
        provider_status: mpPayment.status || "pending",
      })
      .eq("id", invoice_id);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
    }

    return new Response(
      JSON.stringify({
        pix_copiaecola: pixCopiaECola,
        pix_qr_base64: pixQrBase64,
        pix_expires_at: pixExpirationDate,
        checkout_url: checkoutUrl,
        amount_charged: chargeBreakdown.amount_charged,
        late_fee_amount: chargeBreakdown.late_fee_amount,
        interest_amount: chargeBreakdown.interest_amount,
        days_overdue: chargeBreakdown.days_overdue,
        payment_id: mpPayment.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
