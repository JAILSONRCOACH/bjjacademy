import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendCredentialsRequest {
  student_id: string; // profile_id of the student
  login_url?: string;
}

// Generate a secure random password
function generatePassword(length: number = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // Removed symbols to match other functions
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// Email template for credentials reset
function emailTemplate(name: string, email: string, password: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px;
      color: #374151;
    }
    .credentials { 
      background: #f9fafb;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
      border-left: 4px solid #7c3aed;
    }
    .credentials h3 {
      margin-top: 0;
      color: #1f2937;
      font-size: 18px;
    }
    .credentials p {
      margin: 10px 0;
      font-size: 15px;
    }
    .credentials strong {
      color: #1f2937;
    }
    .password {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      color: #7c3aed;
      background: white;
      padding: 10px 15px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .button { 
      display: inline-block;
      padding: 14px 32px;
      background: #7c3aed;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
      transition: background 0.3s;
    }
    .button:hover {
      background: #5b21b6;
    }
    .alert {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .footer {
      padding: 30px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Novas Credenciais de Acesso</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">Olá <strong>${name}</strong>,</p>
      <p style="font-size: 15px;">Suas credenciais de acesso foram redefinidas por um administrador da academia.</p>
      
      <div class="credentials">
        <h3>Seus Novos Dados</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Nova Senha:</strong></p>
        <div class="password">${password}</div>
      </div>
      
      <div class="alert">
        <strong>⚠️ Importante:</strong> Esta senha é temporária. Recomendamos que você a altere assim que fizer login.
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Logar Agora</a>
      </div>
    </div>
    <div class="footer">
      <p>Se você não solicitou esta alteração, entre em contato imediatamente com a administração.</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} BJJ Academy</p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing env vars");
    }

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Check if requester is admin
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role, academy_id')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403, headers: corsHeaders });
    }

    const { student_id, login_url } = await req.json() as ResendCredentialsRequest;

    if (!student_id) {
      return new Response(JSON.stringify({ error: "Missing student_id" }), { status: 400, headers: corsHeaders });
    }

    // Get student details
    const { data: studentProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('email, name, academy_id')
      .eq('id', student_id)
      .single();

    if (profileError || !studentProfile) {
      return new Response(JSON.stringify({ error: "Student not found" }), { status: 404, headers: corsHeaders });
    }

    // Security check: ensure admin owns this student
    if (studentProfile.academy_id !== callerProfile.academy_id) {
      return new Response(JSON.stringify({ error: "Unauthorized access to student" }), { status: 403, headers: corsHeaders });
    }

    // Generate and update password
    const newPassword = generatePassword(10);
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      student_id,
      { password: newPassword, email_confirm: true }
    );

    if (updateError) {
      throw updateError;
    }

    // Send Email
    let emailSent = false;
    let emailErrorMsg = null;

    if (RESEND_API_KEY) {
      try {
        const loginUrl = login_url || 'https://bjjacademy.lovable.app/login';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'BJJ Academy <noreply@academybjj.com.br>',
            to: studentProfile.email,
            subject: '🔐 Reset de Senha - BJJ Academy',
            html: emailTemplate(studentProfile.name, studentProfile.email, newPassword, loginUrl)
          })
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          emailErrorMsg = await resendRes.text();
          console.error("Resend Error:", emailErrorMsg);
        }
      } catch (e: any) {
        console.error("Email Fetch Error:", e);
        emailErrorMsg = e.message;
      }
    } else {
      console.log("⚠️ SKIPPING EMAIL: No RESEND_API_KEY configured.");
    }

    return new Response(JSON.stringify({
      ok: true,
      message: "Credentials reset successfully",
      email_sent: emailSent,
      debug_password: newPassword // Remove this in production if needed, but useful for manual sending
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
