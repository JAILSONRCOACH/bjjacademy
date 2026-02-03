import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        const { plan_id, card_token, customer_data, academy_id } = await req.json()

        // 1. Get Plan Details
        const { data: plan, error: planError } = await supabaseClient
            .from('saas_plans')
            .select('*')
            .eq('id', plan_id)
            .single()

        if (planError || !plan) {
            throw new Error('Plan not found')
        }

        // 2. Create/Get Customer in Pagar.me
        // Simplified: Just use the provided data to create subscription which creates customer implicitly or explicitly

        const pagarmeData = {
            code: academy_id,
            payment_method: 'credit_card',
            currency: 'BRL',
            interval: 'month',
            interval_count: 1,
            billing_type: 'prepaid',
            pricing_scheme: {
                scheme_type: 'unit',
                price: plan.price
            },
            customer: {
                name: customer_data.name,
                email: customer_data.email,
                document: customer_data.document, // CPF/CNPJ
                type: customer_data.document.length > 11 ? 'company' : 'individual',
                phones: {
                    mobile_phone: {
                        country_code: '55',
                        area_code: customer_data.phone.substring(0, 2),
                        number: customer_data.phone.substring(2)
                    }
                }
            },
            card_token: card_token
        }

        const response = await fetch('https://api.pagar.me/core/v5/subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(Deno.env.get('PAGARME_API_KEY') + ':')
            },
            body: JSON.stringify(pagarmeData)
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('Pagar.me Error:', result)
            throw new Error('Payment failed: ' + (result.message || JSON.stringify(result.errors)))
        }

        // 3. Update Database
        const { error: dbError } = await supabaseClient
            .from('saas_subscriptions')
            .upsert({
                academy_id: academy_id,
                plan_id: plan_id,
                pagarme_subscription_id: result.id,
                pagarme_customer_id: result.customer.id,
                status: result.status === 'active' ? 'active' : 'trial', // Mapping
                current_period_end: result.current_cycle.end_at,
                updated_at: new Date().toISOString()
            })

        if (dbError) throw dbError

        return new Response(
            JSON.stringify({ success: true, subscription: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
