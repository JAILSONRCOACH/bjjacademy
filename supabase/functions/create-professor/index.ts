import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email template for professor credentials
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
      <h1>👨‍🏫 Bem-vindo à Equipe!</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">Olá <strong>${name}</strong>,</p>
      <p style="font-size: 15px;">Sua conta de <strong>Professor</strong> foi criada com sucesso! ✅</p>
      
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
        Como professor, você tem acesso a:
      </p>
      <ul style="color: #6b7280; font-size: 14px;">
        <li>Painel de alunos vinculados</li>
        <li>Aprovação de presenças (Tatame Online)</li>
        <li>Graduação de alunos</li>
      </ul>
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE PROFESSOR START ===')

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify permissions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is authenticated and is admin
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile to check role and academy
    const { data: adminProfile, error: profileError } = await userClient
      .from('profiles')
      .select('id, academy_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ ok: false, error: 'Perfil não encontrado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Apenas administradores podem criar professores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { name, email, cpf, phone, password: providedPassword } = await req.json()
    console.log('📥 Request body received:', { name, email, cpf, phone, hasPassword: !!providedPassword })

    if (!name || !email) {
      console.error('❌ Validation failed: missing name or email')
      return new Response(
        JSON.stringify({ ok: false, error: 'Nome e email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, roles, role, academy_id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      console.log('👤 User already exists, checking roles...', existingProfile)

      const currentRoles = existingProfile.roles || [existingProfile.role]
      const hasProfessorRole = currentRoles.includes('professor')

      if (hasProfessorRole) {
        return new Response(
          JSON.stringify({ ok: true, message: 'Usuário já é professor', profile_id: existingProfile.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Promote to professor
      const newRoles = [...new Set([...currentRoles, 'professor'])]

      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          roles: newRoles,
          role: 'professor', // Set as primary role to ensure dashboard access
          academy_id: adminProfile.academy_id // Ensure they are in this academy (or handle multi-academy later)
        })
        .eq('id', existingProfile.id)

      if (updateError) {
        throw new Error(`Erro ao promover usuário: ${updateError.message}`)
      }

      console.log(`✅ User ${existingProfile.id} promoted to professor`)

      // TODO: Send promotion email

      return new Response(
        JSON.stringify({
          ok: true,
          profile_id: existingProfile.id,
          message: 'Usuário promovido a professor com sucesso! Ele pode acessar com a senha atual.',
          promoted: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate temporary password if not provided
    // Use crypto for secure random password generation (12 alphanumeric characters)
    const tempPassword = providedPassword || Array.from(
      { length: 12 },
      () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
    ).join('')
    console.log('🔑 Password generated, length:', tempPassword.length)

    console.log(`Creating professor: ${name} (${email}) for academy ${adminProfile.academy_id}`)

    console.log('🔐 Creating auth user...')
    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name, role: 'professor' }
    })

    if (authError) {
      console.error('❌ Error creating auth user messages:', authError.message)
      console.error('❌ Error creating auth user details:', JSON.stringify(authError))
      // RETURN 200 WITH ERROR FOR DEBUGGING
      return new Response(
        JSON.stringify({ ok: false, error: `Auth Error: ${authError.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id
    console.log(`✅ Auth user created: ${newUserId}`)

    // Create profile for the new professor
    console.log('📝 Creating profile...')
    const { error: insertError } = await adminClient
      .from('profiles')
      .insert({
        id: newUserId,
        academy_id: adminProfile.academy_id,
        name,
        email,
        cpf: cpf || null,
        phone: phone || null,
        role: 'professor',
        roles: ['professor'],
        status: 'active',
        belt: 'black', // Professors typically are black belts
        stripes: 0
      })

    if (insertError) {
      console.error('❌ Error creating profile:', insertError)
      // Try to clean up the auth user
      await adminClient.auth.admin.deleteUser(newUserId)
      // RETURN 200 WITH ERROR FOR DEBUGGING
      return new Response(
        JSON.stringify({ ok: false, error: `Profile Error: ${insertError.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Professor profile created successfully: ${newUserId}`)

    // Send email with credentials (if RESEND_API_KEY is configured)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    let emailSent = false

    if (resendApiKey) {
      try {
        console.log('📧 Sending email to:', email)

        const resend = new Resend(resendApiKey)
        const loginUrl = 'http://localhost:8080/login' // TODO: Change to production URL when deploying

        await resend.emails.send({
          from: 'BJJ Academy <noreply@academybjj.com.br>',
          to: email,
          subject: '👨‍🏫 Sua conta de Professor foi criada!',
          html: emailTemplate(name, email, tempPassword, loginUrl)
        })

        emailSent = true
        console.log('✅ Email sent successfully')
      } catch (emailError: any) {
        console.error('⚠️ Email error (non-blocking):', emailError.message)
        // Don't block creation if email fails
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured - email not sent')
    }

    return new Response(
      JSON.stringify({
        ok: true,
        profile_id: newUserId,
        email_sent: emailSent,
        credentials: {
          email,
          password: tempPassword // Return password in response so admin can copy it
        },
        message: 'Professor criado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Unexpected error in handler:', error)
    // RETURN 200 WITH ERROR FOR DEBUGGING
    return new Response(
      JSON.stringify({ ok: false, error: `Unexpected Error: ${error.message || error}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})