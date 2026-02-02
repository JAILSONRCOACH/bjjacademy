import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
      border-left: 4px solid #f59e0b;
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
      color: #f59e0b;
      background: white;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
    }
    .button { 
      display: inline-block;
      padding: 14px 32px;
      background: #f59e0b;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
      transition: background 0.3s;
    }
    .button:hover {
      background: #d97706;
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
      <h1>🔐 Senha Resetada</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">Olá <strong>${name}</strong>,</p>
      <p style="font-size: 15px;">Sua senha foi resetada pelo administrador da academia.</p>
      
      <div class="credentials">
        <h3>Nova Senha de Acesso</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Nova Senha:</strong></p>
        <div class="password">${password}</div>
      </div>
      
      <div class="alert">
        <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso ao sistema.
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">🔐 Acessar Sistema</a>
      </div>
    </div>
    <div class="footer">
      <p>Se você não solicitou este reset, entre em contato com o administrador.</p>
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
        console.log('=== RESET PROFESSOR PASSWORD START ===')

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ ok: false, error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            return new Response(
                JSON.stringify({ ok: false, error: 'Não autenticado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { data: adminProfile } = await userClient
            .from('profiles')
            .select('id, academy_id, role')
            .eq('id', user.id)
            .single()

        if (!adminProfile || adminProfile.role !== 'admin') {
            return new Response(
                JSON.stringify({ ok: false, error: 'Apenas administradores podem resetar senhas' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { professorId, email } = await req.json()

        if (!professorId || !email) {
            return new Response(
                JSON.stringify({ ok: false, error: 'professorId e email são obrigatórios' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Get professor profile
        const { data: professor } = await adminClient
            .from('profiles')
            .select('id, name, email')
            .eq('id', professorId)
            .single()

        if (!professor) {
            return new Response(
                JSON.stringify({ ok: false, error: 'Professor não encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate new password
        const newPassword = Array.from(
            { length: 12 },
            () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
        ).join('')

        // Update password
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            professorId,
            { password: newPassword }
        )

        if (updateError) {
            throw new Error(`Erro ao atualizar senha: ${updateError.message}`)
        }

        console.log(`✅ Password reset for ${professorId}`)

        // Send email with new password
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        let emailSent = false

        if (resendApiKey) {
            try {
                const resend = new Resend(resendApiKey)
                const loginUrl = 'http://localhost:8080/login'

                await resend.emails.send({
                    from: 'BJJ Academy <noreply@academybjj.com.br>',
                    to: professor.email,
                    subject: '🔐 Sua senha foi resetada',
                    html: emailTemplate(professor.name, professor.email, newPassword, loginUrl)
                })

                emailSent = true
                console.log('✅ Email sent')
            } catch (emailError: any) {
                console.error('⚠️ Email error:', emailError.message)
            }
        }

        return new Response(
            JSON.stringify({ ok: true, email_sent: emailSent }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('❌ Error:', error)
        return new Response(
            JSON.stringify({ ok: false, error: error.message || 'Erro interno' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
