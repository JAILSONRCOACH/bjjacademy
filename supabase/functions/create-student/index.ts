import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateStudentRequest {
  name: string;
  email: string;
  phone?: string;
  password?: string; // Optional - will be auto-generated if not provided
  birth_date?: string;
  belt_current?: string;
  stripes?: number;
  responsible_instructor_id?: string;
  plan_id: string;
  next_due_at: string;
  grace_days?: number;
  cpf?: string;
  weight?: number;
  gender?: string;
  category?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

// Generate a secure random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// Email template for student credentials
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
      font-size: 16px;
      color: #7c3aed;
      background: white;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
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
      <h1>🥋 Bem-vindo à Academia!</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">Olá <strong>${name}</strong>,</p>
      <p style="font-size: 15px;">Sua conta de <strong>Aluno</strong> foi criada com sucesso! ✅</p>
      
      <div class="credentials">
        <h3>Suas Credenciais de Acesso</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha:</strong></p>
        <div class="password">${password}</div>
      </div>
      
      <div class="alert">
        <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso ao sistema.
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">🔐 Acessar Sistema</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Como aluno, você tem acesso a:
      </p>
      <ul style="color: #6b7280; font-size: 14px;">
        <li>Painel com sua evolução</li>
        <li>Histórico de presenças</li>
        <li>Acompanhamento de graduação</li>
        <li>Faturas e pagamentos</li>
      </ul>
    </div>
    <div class="footer">
      <p>Se você não solicitou este cadastro, por favor ignore este email.</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} BJJ Academy - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    // Validate caller is authenticated
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    // Create client with user token to validate caller
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's profile to get academy_id
    const { data: callerProfile, error: profileError } = await userClient
      .from("profiles")
      .select("academy_id, role")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ ok: false, error: "Could not find caller profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only admins can create students
    if (callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Only admins can create students" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const academyId = callerProfile.academy_id;

    // Parse request body
    const body: CreateStudentRequest = await req.json();

    // Generate password if not provided
    const password = body.password || generatePassword(12);

    // Use service role client for admin operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, roles, role, academy_id')
      .eq('email', body.email)
      .single();

    let userId: string;
    let emailSent = false;
    const loginUrl = 'https://bjjacademy.lovable.app/login';
    let isNewUser = false;

    if (existingProfile) {
      console.log('👤 User already exists (Profile found), checking roles...', existingProfile);

      userId = existingProfile.id;
      const currentRoles = existingProfile.roles || [existingProfile.role];
      const hasStudentRole = currentRoles.includes('student');

      if (hasStudentRole) {
        // Check if student record exists for this academy
        const { data: existingStudent } = await adminClient
          .from('students')
          .select('id')
          .eq('profile_id', userId)
          .eq('academy_id', academyId)
          .single();

        if (existingStudent) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Usuário já é aluno desta academia' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Promote to student (add student role)
        const newRoles = [...new Set([...currentRoles, 'student'])];

        const { error: updateError } = await adminClient
          .from('profiles')
          .update({
            roles: newRoles,
          })
          .eq('id', userId);

        if (updateError) {
          return new Response(
            JSON.stringify({ ok: false, error: `Erro ao promover usuário: ${updateError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`✅ User ${userId} promoted to student`);
      }
    } else {
      isNewUser = true;
      // 1. Create new auth user
      const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: password,
        email_confirm: true,
        user_metadata: { name: body.name }
      });

      if (createUserError) {
        // Check if error is "User already registered" (orphan auth user case)
        if (createUserError.message?.includes('already registered') || createUserError.status === 422) {
          console.log("User exists in Auth but not in Profiles. Handling orphan user.");
          // Since we can't get ID from error easily without listing, let's treat this case.
          // BE CAREFUL: If we reset password here, we might affect an existing user.
          // But since they have no profile, they likely aren't using the system.

          // We need the User ID. Since we can't trust createUser return on error.
          // Admin listUsers filter by email.
          const { data: userList } = await adminClient.auth.admin.listUsers(); // TODO: optimize filtering ideally
          const foundUser = userList.users.find(u => u.email === body.email);

          if (!foundUser) {
            throw new Error("Erro inconsistente: Diz que existe mas não encontrei na lista.");
          }

          userId = foundUser.id;

          // Force update password to match what we will send in email
          await adminClient.auth.admin.updateUserById(userId, { password: password });

          // Continue to create profile...
        } else {
          console.error("Error creating auth user:", createUserError);
          return new Response(
            JSON.stringify({ ok: false, error: createUserError?.message || "Failed to create user" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (newUser?.user) {
        userId = newUser.user.id;
      } else {
        throw new Error("Falha ao obter ID do usuário recém criado.");
      }

      // 2. Create profile
      const { error: profileInsertError } = await adminClient.from("profiles").upsert({
        id: userId,
        academy_id: academyId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        cpf: body.cpf || null,
        birth_date: body.birth_date || null,
        belt: body.belt_current || "white",
        stripes: body.stripes || 0,
        role: "student",
        roles: ["student"],
        status: "active",
      });

      if (profileInsertError) {
        console.error("Error creating profile:", profileInsertError);
        // Rollback: delete auth user
        await adminClient.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ ok: false, error: profileInsertError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Create student record
    const { data: newStudent, error: studentError } = await adminClient.from("students").insert({
      academy_id: academyId,
      profile_id: userId,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      cpf: body.cpf || null,
      birth_date: body.birth_date || null,
      belt_current: body.belt_current || "white",
      stripes_cached: body.stripes || 0,
      weight: body.weight || null,
      gender: body.gender || null,
      category: body.category || null,
      guardian_name: body.guardian_name || null,
      guardian_phone: body.guardian_phone || null,
      responsible_instructor_id: body.responsible_instructor_id || null,
      status: "active",
      financial_status: "ok",
    }).select().single();

    if (studentError || !newStudent) {
      console.error("Error creating student:", studentError);
      // Rollback: delete profile and auth user if this was a new user
      if (isNewUser) {
        await adminClient.from("profiles").delete().eq("id", userId);
        await adminClient.auth.admin.deleteUser(userId);
      }
      return new Response(
        JSON.stringify({ ok: false, error: studentError?.message || "Failed to create student" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3.5. Create student_registration record for audit/history
    const { error: registrationError } = await adminClient.from("student_registrations").insert({
      academy_id: academyId,
      created_by_profile_id: userData.user.id, // Admin who created
      source: 'manual',
      status: 'approved',
      approved_at: new Date().toISOString(),
      name: body.name,
      birth_date: body.birth_date || null,
      cpf: body.cpf || null,
      email: body.email,
      phone: body.phone || null,
      sex: body.gender || 'nao_informado',
      weight_kg: body.weight || null,
      belt_current: body.belt_current || 'branca',
      stripes: body.stripes || 0,
      guardian_name: body.guardian_name || null,
      guardian_phone: body.guardian_phone || null,
      instructor_id: body.responsible_instructor_id || null,
      plan_id: body.plan_id,
      next_due_at: body.next_due_at,
      grace_days: body.grace_days || 3,
    });

    if (registrationError) {
      console.error("Error creating registration record (non-blocking):", registrationError);
      // Don't fail the whole operation, just log it
    }

    // 4. Get plan info
    const { data: plan, error: planError } = await adminClient
      .from("plans")
      .select("price")
      .eq("id", body.plan_id)
      .single();

    if (planError || !plan) {
      console.error("Error fetching plan:", planError);
      return new Response(
        JSON.stringify({ ok: false, error: "Plan not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create subscription
    const graceDays = body.grace_days ?? 3;
    const { data: subscription, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .insert({
        academy_id: academyId,
        student_id: newStudent.id,
        plan_id: body.plan_id,
        next_due_at: body.next_due_at,
        grace_days: graceDays,
        status: "active",
      })
      .select()
      .single();

    if (subscriptionError || !subscription) {
      console.error("Error creating subscription:", subscriptionError);
      return new Response(
        JSON.stringify({ ok: false, error: subscriptionError?.message || "Failed to create subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create first invoice
    const { data: invoice, error: invoiceError } = await adminClient
      .from("invoices")
      .insert({
        academy_id: academyId,
        student_id: newStudent.id,
        subscription_id: subscription.id,
        amount: plan.price,
        due_date: body.next_due_at,
        status: "open",
        provider_status: "pending",
        external_reference: null,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
    }

    // 7. Send email with credentials (only for new users)
    if (isNewUser && RESEND_API_KEY) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'BJJ Academy <noreply@academybjj.com.br>',
            to: body.email,
            subject: '🥋 Bem-vindo à Academia - Suas Credenciais de Acesso',
            html: emailTemplate(body.name, body.email, password, loginUrl)
          })
        });

        if (resendResponse.ok) {
          emailSent = true;
          console.log('Email sent successfully to:', body.email);
        } else {
          const resendError = await resendResponse.text();
          console.error('Resend error:', resendError);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: userId,
        profile_id: userId,
        student_id: newStudent.id,
        subscription_id: subscription.id,
        invoice_id: invoice?.id || null,
        email_sent: emailSent,
        promoted: !isNewUser,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in create-student:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
