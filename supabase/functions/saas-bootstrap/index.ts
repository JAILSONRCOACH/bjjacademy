import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      email_confirm: true, // Auto-confirm for now to simplify flow
      user_metadata: {
        registration_source: 'saas_bootstrap'
      }
    })

    if (authError) throw authError
    const userId = authData.user.id
    console.log('User created:', userId)

    // 2. Create Academy
    const { data: academyData, error: academyError } = await supabaseClient
      .from('academies')
      .insert({
        name: academyName,
        timezone: 'America/Sao_Paulo' // Default
      })
      .select()
      .single()

    if (academyError) {
      // Rollback user (optional but good practice)
      await supabaseClient.auth.admin.deleteUser(userId)
      throw academyError
    }
    const academyId = academyData.id
    console.log('Academy created:', academyId)

    // 3. Create Admin Profile
    // Note: profiles usually have a trigger on auth.users, but we might need to update it 
    // or insert it if the trigger doesn't handle everything. 
    // In this project config, let's assume we need to insert/update.
    // Let's check if a profile was auto-created by a trigger? 
    // Usually standard Supabase starters have a trigger.
    // Safest is to UPSERT.
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        name: adminName,
        role: 'admin',
        roles: ['admin'], // CRITICAL: Array field for multi-role support
        status: 'active',
        academy_id: academyId
      })

    if (profileError) throw profileError
    console.log('Profile created/updated')

    // 4. Create Subscription (Trial)
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    const { error: subError } = await supabaseClient
      .from('academy_subscriptions')
      .insert({
        academy_id: academyId,
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        payment_provider: 'mercadopago'
      })

    if (subError) throw subError
    console.log('Subscription created')

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
