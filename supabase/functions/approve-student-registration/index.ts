import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper to generate random password (alphanumeric only)
function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Email template
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
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== APPROVE STUDENT REGISTRATION START ===')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseClient.auth.getUser(token)

    if (!caller) throw new Error('Unauthorized')

    const { registration_id, login_url } = await req.json()

    if (!registration_id) {
      throw new Error('registration_id é obrigatório')
    }

    console.log('Registration ID:', registration_id)

    // 1. Buscar registration pendente
    const { data: registration, error: regError } = await supabaseClient
      .from('student_registrations')
      .select('*')
      .eq('id', registration_id)
      .eq('status', 'pending')
      .single()

    if (regError) {
      console.error('Error fetching registration:', regError)
      throw new Error(`Erro ao buscar cadastro: ${regError.message}`)
    }

    if (!registration) {
      throw new Error('Cadastro não encontrado ou já processado')
    }

    console.log('Registration found:', registration.name)

    let academyId = registration.academy_id

    // Se não tiver academy_id direto (legado ou link público antigo), busca via token
    if (!academyId) {
      console.log('Academy ID not found in registration, looking up via token...')
      const { data: invite, error: inviteError } = await supabaseClient
        .from('registration_invites')
        .select('academy_id')
        .eq('token', registration.registration_token)
        .single()

      if (inviteError) {
        console.error('Error fetching invite:', inviteError)
        // Se for manual e não tiver token, vai dar erro aqui, mas deveria ter academy_id direto
      }

      academyId = invite?.academy_id
    }

    if (!academyId) {
      throw new Error('Academia não identificada no cadastro')
    }

    console.log('Academy ID:', academyId)

    // 3. Verificar se email existe
    if (!registration.email) {
      throw new Error('Email é obrigatório para criar login')
    }

    console.log('Creating auth user for:', registration.email)

    // 4. Gerar senha temporária
    const tempPassword = generateTempPassword()
    let userId = ''

    // 5. Criar usuário no Auth (ou buscar se já existir)
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: registration.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: registration.name,
        registration_source: 'public_registration_approval'
      }
    })

    if (authError) {
      // Se erro for "usuário já existe", buscamos o usuário para atualizar
      if (authError.message?.includes('already registered') || authError.status === 422) {
        console.log('User already exists, updating password...')

        // Buscar ID do usuário pelo email
        const { data: userList } = await supabaseClient.auth.admin.listUsers()
        const foundUser = userList.users.find(u => u.email === registration.email)

        if (!foundUser) {
          throw new Error(`Email diz que existe mas não foi encontrado: ${authError.message}`)
        }

        userId = foundUser.id

        // Forçar atualização da senha para garantir que bate com o email que vamos enviar
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(userId, {
          password: tempPassword,
          email_confirm: true
        })

        if (updateError) {
          throw new Error(`Erro ao atualizar senha do usuário existente: ${updateError.message}`)
        }

        console.log('Password updated for existing user:', userId)
      } else {
        console.error('Auth error:', authError)
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }
    } else {
      userId = authData.user.id
      console.log('Auth user created:', userId)

      // Force confirm just to be safe (mirrors resend-credentials behavior)
      await supabaseClient.auth.admin.updateUserById(userId, {
        email_confirm: true
      })
    }

    // 6. Upsert no registro de aluno (students table) para evitar duplicidade
    const { error: studentError } = await supabaseClient
      .from('students')
      .upsert({
        id: userId,
        name: registration.name,
        birth_date: registration.birth_date,
        cpf: registration.cpf,
        email: registration.email,
        phone: registration.phone,
        gender: registration.sex === 'masculino' ? 'male' : registration.sex === 'feminino' ? 'female' : null,
        weight: registration.weight_kg,
        belt_current: registration.belt_current || 'white',
        stripes_cached: registration.stripes || 0,
        guardian_name: registration.guardian_name,
        guardian_phone: registration.guardian_phone,
        academy_id: academyId,
        status: 'active',
        category: registration.computed_category,
        responsible_instructor_id: registration.instructor_id,
        financial_status: 'pending',
        total_classes: 0,
        belt_cycle_classes: 0
      })

    if (studentError) {
      console.error('Student error:', studentError)
      // Se acabamos de criar o user, poderia rollback, mas se é update nao.
      throw new Error(`Erro ao criar aluno: ${studentError.message}`)
    }

    console.log('Student created/updated')

    // 7. Upsert no perfil (profiles table)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: userId,
        email: registration.email,
        name: registration.name,
        role: 'student',
        roles: ['student'],
        status: 'active',
        academy_id: academyId
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile error:', profileError)
      throw new Error(`Erro ao criar perfil: ${profileError.message}`)
    }

    console.log('Profile created')

    // 8. Atualizar status do registration
    await supabaseClient
      .from('student_registrations')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', registration_id)

    console.log('Registration approved successfully')

    // 9. Enviar email com credenciais (se RESEND_API_KEY estiver configurada)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    let emailSent = false

    if (resendApiKey) {
      try {
        console.log('Sending email to:', registration.email)

        const resend = new Resend(resendApiKey)
        const loginUrl = login_url || 'https://bjjacademy.lovable.app/login'

        await resend.emails.send({
          from: 'BJJ Academy <noreply@academybjj.com.br>',
          to: registration.email,
          subject: '🥋 Sua matrícula foi aprovada!',
          html: emailTemplate(registration.name, registration.email, tempPassword, loginUrl)
        })

        emailSent = true
        console.log('Email sent successfully')
      } catch (emailError: any) {
        console.error('Email error (non-blocking):', emailError.message)
        // Não bloqueia a aprovação se o email falhar
      }
    } else {
      console.warn('RESEND_API_KEY not configured - email not sent')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Aluno aprovado com sucesso!',
        email_sent: emailSent,
        credentials: {
          email: registration.email,
          temp_password: tempPassword
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('=== APPROVAL ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    return new Response(
      JSON.stringify({
        error: error.message || 'Erro desconhecido',
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
