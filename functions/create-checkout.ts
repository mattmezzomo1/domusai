import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { priceId, successUrl, cancelUrl, couponCode } = await req.json();

        // Criar sessão de checkout do Stripe
        const sessionConfig = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: user.email,
            metadata: {
                base44_app_id: Deno.env.get("BASE44_APP_ID"),
                user_email: user.email,
            },
        };

        // Se houver código de cupom, adicionar ao checkout
        if (couponCode) {
            sessionConfig.discounts = [{
                promotion_code: couponCode
            }];
        } else {
            // Permitir que o usuário insira um código durante o checkout
            sessionConfig.allow_promotion_codes = true;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return Response.json({ 
            checkoutUrl: session.url,
            sessionId: session.id 
        });
    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});