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

        // Get the User from the authorization header (to verify who is calling)
        // We need to use a client with the user's token BUT InviteUser requires Admin privs.
        // So we verify the user manually.
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization Header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

        if (userError || !user) throw new Error('Invalid Token')

        // Fetch Caller Profile to check Academy and Role
        const { data: callerProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('academy_id, role')
            .eq('id', user.id)
            .single()

        if (profileError || !callerProfile) throw new Error('Profile not found')

        if (callerProfile.role !== 'admin') {
            throw new Error('Only admins can invite users')
        }

        // CHECK SUBSCRIPTION STATUS
        // We can use the rpc function we created or query directly
        // Let's query directly to avoid rpc permission complexity if not granted to public
        // Actually, calling Edge Function uses Service Role, so we can query anything.
        const { data: hasAccess } = await supabaseClient
            .rpc('academy_has_access', { _academy_id: callerProfile.academy_id })

        if (!hasAccess) {
            throw new Error('Sua academia não tem uma assinatura ativa. Regularize para convidar usuários.')
        }

        const { email, role, name } = await req.json()

        if (!email || !role) throw new Error('Email and Role are required')

        console.log(`Inviting ${email} as ${role} for academy ${callerProfile.academy_id}`)

        // Invite User
        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            data: {
                academy_id: callerProfile.academy_id,
                role: role,
                name: name
            }
        })

        if (inviteError) throw inviteError

        const invitedUser = inviteData.user

        // Update Profile immediately (InviteUser creates the user in Auth but might not trigger profile creation correctly depending on metadata)
        // Safest is to Upsert the profile
        await supabaseClient
            .from('profiles')
            .upsert({
                id: invitedUser.id,
                email: email,
                academy_id: callerProfile.academy_id,
                role: role,
                name: name || email.split('@')[0]
            })

        // If it's a student, we should also create the student record
        if (role === 'student') {
            await supabaseClient
                .from('students')
                .upsert({
                    profile_id: invitedUser.id,
                    academy_id: callerProfile.academy_id,
                    name: name || email.split('@')[0],
                    email: email,
                    status: 'active',
                    financial_status: 'up_to_date'
                })
        }

        return new Response(
            JSON.stringify({ success: true, user: invitedUser }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Invite Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
