import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { reference, userId } = await req.json()

        if (!reference || !userId) {
            return new Response(JSON.stringify({ success: false, error: 'Missing reference or userId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Verify payment with Paystack
        const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!
        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    'Authorization': `Bearer ${paystackSecretKey}`,
                },
            }
        )

        const result = await response.json()
        const transaction = result.data

        if (transaction.status === 'success') {
            // Get user details
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (userError) {
                console.error('Error fetching user:', userError)
                return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Update user payment status and add welcome bonus
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    is_paid: true,
                    balance: (user.balance || 0) + 3.00, // Add $3 welcome bonus
                    total_earned: (user.total_earned || 0) + 3.00
                })
                .eq('id', userId)

            if (updateError) {
                console.error('Error updating user:', updateError)
                return new Response(JSON.stringify({ success: false, error: 'Failed to update user status' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Log the welcome bonus transaction
            const { error: bonusError } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    type: 'bonus',
                    amount: 3.00,
                    description: 'Welcome bonus for account activation',
                    reference: `WELCOME-${userId}-${Date.now()}`,
                    status: 'completed'
                })

            if (bonusError) {
                console.error('Error logging bonus transaction:', bonusError)
            }

            // Log the payment transaction
            const { error: paymentError } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    type: 'payment',
                    amount: 15.00,
                    description: 'Account activation payment',
                    reference: reference,
                    paystack_reference: reference,
                    status: 'completed'
                })

            if (paymentError) {
                console.error('Error logging payment transaction:', paymentError)
            }

            console.log(`Payment successful for user ${userId}, reference: ${reference}`)
            return new Response(JSON.stringify({
                success: true,
                message: 'Payment confirmed and account activated',
                welcomeBonus: 3.00
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        } else {
            console.log(`Payment failed for user ${userId}, reference: ${reference}, status: ${transaction.status}`)
            return new Response(JSON.stringify({ success: false, error: 'Payment not successful' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

    } catch (error) {
        console.error('Payment confirmation error:', error)
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
}) 