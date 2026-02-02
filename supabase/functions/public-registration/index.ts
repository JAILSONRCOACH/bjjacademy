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

    const body = await req.json()
    const {
      registration_token,
      name,
      birth_date,
      cpf,
      email,
      phone,
      sex,
      weight_kg,
      belt_current,
      stripes,
      guardian_name,
      guardian_phone,
      is_minor,
      computed_category,
      source,
      status
    } = body

    if (!registration_token || !name) {
      throw new Error('Token e nome são obrigatórios')
    }

    // 1. Validar token e buscar dados do convite
    const { data: invite, error: inviteError } = await supabaseClient
      .from('registration_invites')
      .select('*')
      .eq('token', registration_token)
      .eq('active', true)
      .single()

    if (inviteError || !invite) {
      throw new Error('Token de cadastro não fornecido, inválido ou expirado')
    }

    // 2. Verificar se token está expirado
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error('Token de cadastro expirado')
    }

    // 3. Criar registro de cadastro
    const { data: registration, error: regError } = await supabaseClient
      .from('student_registrations')
      .insert({
        registration_token,
        name,
        birth_date: birth_date || null,
        cpf: cpf || null,
        email: email || null,
        phone: phone || null,
        sex: sex || 'nao_informado',
        weight_kg: weight_kg || null,
        belt_current: belt_current || 'branca',
        stripes: stripes ?? 0,
        guardian_name: guardian_name || null,
        guardian_phone: guardian_phone || null,
        is_minor: is_minor || false,
        computed_category: computed_category || null,
        source: source || 'link',
        status: status || 'pending',
        // Dados vindos do convite
        modality_id: invite.modality_id,
        class_slot_id: invite.class_slot_id,
        instructor_id: invite.instructor_profile_id,
        plan_id: invite.plan_id,
        next_due_at: invite.next_due_at,
        grace_days: invite.grace_days || 3,
        academy_id: invite.academy_id, // IMPORTANTE: academy_id vem do invite
        created_by_profile_id: invite.created_by_profile_id
      })
      .select()
      .single()

    if (regError) {
      console.error('Erro ao criar registro:', regError)
      throw new Error(regError.message || 'Erro ao salvar cadastro')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cadastro enviado com sucesso!',
        id: registration.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Public Registration Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
