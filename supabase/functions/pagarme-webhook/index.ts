import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        // Pagar.me webhook structure: { type: 'subscription.renewed', data: { ... } }

        const type = payload.type
        const data = payload.data

        if (!type || !data) {
            return new Response('Invalid Payload', { status: 400 })
        }

        console.log(`Received webhook: ${type}`, data.id)

        let newStatus = null
        const subscriptionId = data.subscription?.id || data.id // Depending on event

        if (type === 'subscription.renewed' || type === 'subscription.created') {
            newStatus = 'active'
        } else if (type === 'subscription.canceled') {
            newStatus = 'canceled'
        } else if (type === 'subscription.payment_failed') {
            newStatus = 'past_due'
        }

        if (newStatus && subscriptionId) {
            // Find subscription by pagarme_id
            const { error } = await supabaseClient
                .from('saas_subscriptions')
                .update({
                    status: newStatus,
                    current_period_end: data.current_cycle?.end_at,
                    updated_at: new Date().toISOString()
                })
                .eq('pagarme_subscription_id', subscriptionId)

            if (error) console.error('DB Update Error:', error)
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 })
    } catch (error) {
        console.error('Webhook Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})
