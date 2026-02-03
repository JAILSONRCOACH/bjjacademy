import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    const { email, password, academyName, adminName } = await req.json()

    console.log('Starting SaaS Bootstrap:', { email, academyName, adminName })

    if (!email || !password || !academyName || !adminName) {
      throw new Error('Dados incompletos')
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        registration_source: 'saas_bootstrap'
      }
    })

    if (authError) throw authError
    const userId = authData.user.id
    console.log('User created:', userId)

    // 2. Create Academy
    // The trigger 'on_academy_created_create_subscription' will automatically 
    // create the SaaS Subscription (Trial) in 'saas_subscriptions' table.
    const { data: academyData, error: academyError } = await supabaseClient
      .from('academies')
      .insert({
        name: academyName,
        timezone: 'America/Sao_Paulo'
      })
      .select()
      .single()

    if (academyError) {
      // Rollback user
      await supabaseClient.auth.admin.deleteUser(userId)
      throw academyError
    }
    const academyId = academyData.id
    console.log('Academy created:', academyId)

    // 3. Create Admin Profile
    // We use UPSERT to be safe.
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        name: adminName,
        role: 'admin',      // Legacy/Primary role
        // roles: ['admin'], // Removed to avoid schema mismatch if column doesn't exist
        status: 'active',
        academy_id: academyId
      })

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      throw profileError;
    }
    console.log('Profile created/updated')

    // 4. Notification (Optional)
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: "BJJ Academy System <system@academybjj.com.br>",
          to: "jailsonrcoach@gmail.com",
          subject: `🚀 Nova Academia (Trial): ${academyName}`,
          html: `
            <h1>Nova Academia Iniciou Trial</h1>
            <p><strong>Academia:</strong> ${academyName}</p>
            <p><strong>Admin:</strong> ${adminName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p>O trial de 7 dias foi ativado automaticamente.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: authData.user,
        academy_id: academyId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Bootstrap Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
