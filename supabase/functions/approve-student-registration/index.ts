import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper to generate random password (alphanumeric only)
function generateTempPassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Erro desconhecido ao enviar email";
  }
}

// Email template
function emailTemplate(
  name: string,
  email: string,
  password: string,
  loginUrl: string,
): string {
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
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
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
      border-left: 4px solid #2563eb;
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
      color: #2563eb;
      background: white;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
    }
    .button { 
      display: inline-block;
      padding: 14px 32px;
      background: #2563eb;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
      transition: background 0.3s;
    }
    .button:hover {
      background: #1e40af;
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
      <h1>🥋 Cadastro Aprovado!</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">Olá <strong>${name}</strong>,</p>
      <p style="font-size: 15px;">Sua matrícula na academia foi aprovada com sucesso! ✅</p>
      
      <div class="credentials">
        <h3>Suas Credenciais de Acesso</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha Temporária:</strong></p>
        <div class="password">${password}</div>
      </div>
      
      <div class="alert">
        <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso ao sistema.
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">🔐 Acessar Sistema</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Seja bem-vindo(a) à nossa academia! Estamos felizes em tê-lo(a) conosco.
      </p>
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

function existingAccountEmailTemplate(name: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #fff; padding: 32px 20px; text-align: center; }
    .content { padding: 30px; color: #374151; }
    .box { background: #f9fafb; padding: 18px; border-left: 4px solid #2563eb; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { padding: 20px 30px; font-size: 13px; color: #6b7280; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>Acesso de Aluno Liberado</h2></div>
    <div class="content">
      <p>Olá <strong>${name}</strong>,</p>
      <p>Seu acesso como <strong>aluno(a)</strong> foi habilitado no sistema, mantendo seus acessos atuais.</p>
      <div class="box">
        Você pode entrar com o mesmo email e senha que já usa hoje e trocar o perfil no sistema.
      </div>
      <p style="text-align:center; margin-top: 24px;">
        <a href="${loginUrl}" class="button">Acessar Sistema</a>
      </p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} BJJ Academy</div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== APPROVE STUDENT REGISTRATION START ===");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error(
        "Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY",
      );
    }

    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseUser.auth.getUser();

    if (callerError || !caller) {
      console.error("Caller auth error:", callerError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: callerProfile, error: callerProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("role, roles, academy_id, is_super_admin")
        .eq("id", caller.id)
        .maybeSingle();

    if (callerProfileError) {
      throw new Error(
        `Erro ao validar perfil do solicitante: ${callerProfileError.message}`,
      );
    }

    const isSuperAdmin = !!callerProfile?.is_super_admin;
    const callerRoles =
      Array.isArray(callerProfile?.roles) && callerProfile.roles.length > 0
        ? callerProfile.roles
        : callerProfile?.role
          ? [callerProfile.role]
          : [];
    const isAdminCaller = callerRoles.includes("admin");

    if (!isSuperAdmin && !isAdminCaller) {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { registration_id, login_url } = await req.json();

    if (!registration_id) {
      throw new Error("registration_id é obrigatório");
    }

    console.log("Registration ID:", registration_id);

    // 1. Buscar registration pendente
    const { data: registration, error: regError } = await supabaseAdmin
      .from("student_registrations")
      .select("*")
      .eq("id", registration_id)
      .eq("status", "pending")
      .single();

    if (regError) {
      console.error("Error fetching registration:", regError);
      throw new Error(`Erro ao buscar cadastro: ${regError.message}`);
    }

    if (!registration) {
      throw new Error("Cadastro não encontrado ou já processado");
    }

    if (
      !isSuperAdmin &&
      callerProfile?.academy_id &&
      registration.academy_id &&
      callerProfile.academy_id !== registration.academy_id
    ) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: registration outside your academy",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    console.log("Registration found:", registration.name);

    let academyId = registration.academy_id;

    // Se não tiver academy_id direto (legado ou link público antigo), busca via token
    if (!academyId) {
      console.log(
        "Academy ID not found in registration, looking up via token...",
      );
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from("registration_invites")
        .select("academy_id")
        .eq("token", registration.registration_token)
        .single();

      if (inviteError) {
        console.error("Error fetching invite:", inviteError);
        // Se for manual e não tiver token, vai dar erro aqui, mas deveria ter academy_id direto
      }

      academyId = invite?.academy_id;
    }

    if (!academyId) {
      throw new Error("Academia não identificada no cadastro");
    }

    console.log("Academy ID:", academyId);

    // 3. Verificar se email existe
    if (!registration.email) {
      throw new Error("Email é obrigatório para criar login");
    }

    console.log("Creating auth user for:", registration.email);

    // 4. Gerar senha temporária
    const tempPassword = generateTempPassword();
    let userId = "";
    let passwordToShare: string | null = tempPassword;
    let existingAuthUser = false;

    // 5. Criar usuário no Auth (ou buscar se já existir)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: registration.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: registration.name,
          registration_source: "public_registration_approval",
        },
      });

    if (authError) {
      // Se erro for "usuário já existe", buscamos o usuário para atualizar
      if (
        authError.message?.includes("already registered") ||
        authError.status === 422
      ) {
        console.log("User already exists, preserving password and promoting role...");

        // Buscar ID do usuário pelo email
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const foundUser = userList.users.find(
          (u) => u.email === registration.email,
        );

        if (!foundUser) {
          throw new Error(
            `Email diz que existe mas não foi encontrado: ${authError.message}`,
          );
        }

        userId = foundUser.id;
        existingAuthUser = true;
        passwordToShare = null;

        // Não alteramos senha de conta já existente para não quebrar acesso atual (ex.: professor)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            email_confirm: true,
          },
        );

        if (updateError) {
          throw new Error(
            `Erro ao confirmar email do usuário existente: ${updateError.message}`,
          );
        }

        console.log("Existing auth user kept unchanged:", userId);
      } else {
        console.error("Auth error:", authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }
    } else {
      userId = authData.user.id;
      console.log("Auth user created:", userId);

      // Force confirm just to be safe (mirrors resend-credentials behavior)
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
    }

    // 6. Busca perfil existente para preservar role principal e apenas adicionar role student
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, roles, academy_id, name, email")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfileError) {
      throw new Error(
        `Erro ao verificar perfil existente: ${existingProfileError.message}`,
      );
    }

    if (
      !isSuperAdmin &&
      existingProfile?.academy_id &&
      existingProfile.academy_id !== academyId
    ) {
      throw new Error(
        "Este usuário já pertence a outra academia e não pode ser aprovado aqui",
      );
    }

    // Mesmo email == mesma conta no Auth. Se nome diverge, provavelmente é outra pessoa (ex.: menor com email do pai/mãe).
    const normalizeName = (value?: string | null) =>
      (value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (
      existingAuthUser &&
      existingProfile?.name &&
      normalizeName(existingProfile.name) !== normalizeName(registration.name)
    ) {
      throw new Error(
        "Este email já está vinculado a outra pessoa no sistema. Use um email diferente para o aluno ou cadastre o menor sem login próprio.",
      );
    }

    const currentRoles =
      Array.isArray(existingProfile?.roles) && existingProfile.roles.length > 0
        ? existingProfile.roles
        : existingProfile?.role
          ? [existingProfile.role]
          : [];

    const mergedRoles = Array.from(new Set([...currentRoles, "student"]));
    const primaryRole =
      existingProfile?.role && existingProfile.role !== "student"
        ? existingProfile.role
        : "student";

    const profileName = existingProfile?.name || registration.name;
    const profileEmail = existingProfile?.email || registration.email;

    // 7. Upsert no perfil (profiles table) primeiro para satisfazer FK profile_id em students
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: profileEmail,
        name: profileName,
        role: primaryRole,
        roles: mergedRoles,
        status: "active",
        academy_id: academyId,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("Profile error:", profileError);
      throw new Error(`Erro ao criar perfil: ${profileError.message}`);
    }

    console.log("Profile created/updated");

    // 8. Upsert no registro de aluno (students table) para evitar duplicidade
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .upsert({
        id: userId,
        profile_id: userId,
        name: registration.name,
        birth_date: registration.birth_date,
        cpf: registration.cpf,
        email: registration.email ?? profileEmail,
        phone: registration.phone,
        gender:
          registration.sex === "masculino"
            ? "male"
            : registration.sex === "feminino"
              ? "female"
              : null,
        weight: registration.weight_kg,
        belt_current: registration.belt_current || "white",
        stripes_cached: registration.stripes || 0,
        guardian_name: registration.guardian_name,
        guardian_phone: registration.guardian_phone,
        academy_id: academyId,
        status: "active",
        category: registration.computed_category,
        responsible_instructor_id: registration.instructor_id,
        financial_status: "pending",
        total_classes: 0,
        belt_cycle_classes: 0,
      });

    if (studentError) {
      console.error("Student error:", studentError);
      // Se acabamos de criar o user, poderia rollback, mas se é update nao.
      throw new Error(`Erro ao criar aluno: ${studentError.message}`);
    }

    console.log("Student created/updated");

    // 9. Atualizar status do registration
    await supabaseAdmin
      .from("student_registrations")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", registration_id);

    console.log("Registration approved successfully");

    // 10. Enviar email com credenciais (se RESEND_API_KEY estiver configurada)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    let emailError: string | null = null;
    let emailMessageId: string | null = null;

    if (resendApiKey) {
      if (!passwordToShare) {
        // Conta já existente: enviar email informativo sem alterar credenciais.
        try {
          const resend = new Resend(resendApiKey);
          const loginUrl = login_url || "https://bjjacademy.lovable.app/login";
          const { data: resendData, error: resendError } =
            await resend.emails.send({
              from: "BJJ Academy <noreply@academybjj.com.br>",
              to: registration.email,
              subject: "🥋 Seu acesso de aluno foi liberado",
              html: existingAccountEmailTemplate(registration.name, loginUrl),
            });

          if (resendError) {
            emailError = getErrorMessage(resendError);
            console.error("Resend returned error:", emailError);
          } else {
            emailSent = true;
            emailMessageId = resendData?.id ?? null;
            console.log("Existing account email sent");
          }
        } catch (sendError: unknown) {
          emailError = getErrorMessage(sendError);
          console.error("Email error (non-blocking):", emailError);
        }
      } else {
      try {
        console.log("Sending email to:", registration.email);

        const resend = new Resend(resendApiKey);
        const loginUrl = login_url || "https://bjjacademy.lovable.app/login";

        const { data: resendData, error: resendError } =
          await resend.emails.send({
            from: "BJJ Academy <noreply@academybjj.com.br>",
            to: registration.email,
            subject: "🥋 Sua matrícula foi aprovada!",
            html: emailTemplate(
              registration.name,
              registration.email,
              passwordToShare,
              loginUrl,
            ),
          });

        if (resendError) {
          emailError = getErrorMessage(resendError);
          console.error("Resend returned error:", emailError);
        } else {
          emailSent = true;
          emailMessageId = resendData?.id ?? null;
          console.log(
            "Email sent successfully",
            emailMessageId ? `(id: ${emailMessageId})` : "",
          );
        }
      } catch (sendError: unknown) {
        emailError = getErrorMessage(sendError);
        console.error("Email error (non-blocking):", emailError);
        // Não bloqueia a aprovação se o email falhar
      }
      }
    } else {
      emailError = "RESEND_API_KEY not configured";
      console.warn("RESEND_API_KEY not configured - email not sent");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Aluno aprovado com sucesso!",
        email_sent: emailSent,
        email_error: emailError,
        email_message_id: emailMessageId,
        existing_account: existingAuthUser,
        credentials: {
          email: registration.email,
          temp_password: passwordToShare,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("=== APPROVAL ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || "Erro desconhecido",
        details: error.stack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
