import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  name: string;
  email: string;
  invite_url: string;
  sender_name?: string;
  academy_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const { name, email, invite_url, sender_name = "BJJ Academy", academy_name = "BJJ Academy" } = await req.json() as InviteRequest;

    if (!name || !email || !invite_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, invite_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "BJJ Academy <noreply@academybjj.com.br>",
      to: email,
      subject: `🥋 Convite para treinar na ${academy_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 500; }
            .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 0.875rem; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Olá, ${name}!</h1>
            <p>Você foi convidado para se cadastrar na <strong>${academy_name}</strong>.</p>
            <p>Para criar sua conta de aluno e ter acesso ao sistema, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invite_url}" class="button">Confirmar Cadastro</a>
            </div>

            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #2563eb;">${invite_url}</p>

            <div class="footer">
              <p>Enviado por ${sender_name}</p>
              <p>Se você não esperava por este convite, pode ignorar este email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
