import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook data
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Mercado Pago sends different types of notifications
    const { type, data, action } = body;

    // We only care about payment notifications
    if (type !== "payment" && action !== "payment.created" && action !== "payment.updated") {
      console.log("Ignoring non-payment notification:", type, action);
      return new Response("OK", { status: 200 });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.log("No payment ID in webhook");
      return new Response("OK", { status: 200 });
    }

    console.log(`Processing payment: ${paymentId}`);

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpResponse.ok) {
      console.error("Failed to fetch payment from MP:", await mpResponse.text());
      return new Response("OK", { status: 200 });
    }

    const payment = await mpResponse.json();
    console.log("Payment details:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount,
    }));

    const invoiceId = payment.external_reference;
    if (!invoiceId) {
      console.log("No external_reference (invoice_id) in payment");
      return new Response("OK", { status: 200 });
    }

    // Check if payment is approved
    if (payment.status === "approved") {
      console.log(`Payment approved for invoice: ${invoiceId}`);

      // Update invoice as paid
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          amount: Number(payment.transaction_amount) || undefined,
          provider_payment_id: String(paymentId),
          payment_method: payment.payment_type_id || "mercadopago",
          provider_status: "paid",
        })
        .eq("id", invoiceId);

      if (updateError) {
        console.error("Error updating invoice:", updateError);
      } else {
        console.log("Invoice marked as paid");
      }

      // The trigger will automatically reactivate the student if suspended
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      console.log(`Payment ${payment.status} for invoice: ${invoiceId}`);
      
      // Update provider status
      await supabase
        .from("invoices")
        .update({
          provider_status: payment.status,
        })
        .eq("id", invoiceId);
    } else if (payment.status === "pending" || payment.status === "in_process") {
      console.log(`Payment ${payment.status} for invoice: ${invoiceId}`);
      
      // Update provider status
      await supabase
        .from("invoices")
        .update({
          provider_status: payment.status,
        })
        .eq("id", invoiceId);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to avoid MP retrying forever
    return new Response("OK", { status: 200 });
  }
});
