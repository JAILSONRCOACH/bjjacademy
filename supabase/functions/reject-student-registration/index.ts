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

        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: caller } } = await supabaseClient.auth.getUser(token)

        if (!caller) throw new Error('Unauthorized')

        const { registration_id, rejection_reason } = await req.json()

        if (!registration_id) {
            throw new Error('registration_id é obrigatório')
        }

        // 1. Buscar registration pendente
        const { data: registration, error: regError } = await supabaseClient
            .from('student_registrations')
            .select('*')
            .eq('id', registration_id)
            .eq('status', 'pending')
            .single()

        if (regError || !registration) {
            throw new Error('Cadastro não encontrado ou já processado')
        }

        // 2. Atualizar status para rejected
        const { error: updateError } = await supabaseClient
            .from('student_registrations')
            .update({
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejection_reason: rejection_reason || null
            })
            .eq('id', registration_id)

        if (updateError) throw updateError

        // 3. TODO: Enviar email notificando rejeição
        console.log('Cadastro rejeitado:', {
            email: registration.email,
            reason: rejection_reason
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Cadastro rejeitado com sucesso.'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Rejection Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
