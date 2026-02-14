import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { code, discountPercent, durationMonths } = await req.json();

        if (!code || !discountPercent) {
            return Response.json({ 
                error: 'code and discountPercent are required' 
            }, { status: 400 });
        }

        // Criar cupom no Stripe
        const coupon = await stripe.coupons.create({
            percent_off: discountPercent,
            duration: durationMonths ? 'repeating' : 'once',
            duration_in_months: durationMonths || undefined,
            name: `Desconto ${discountPercent}%`,
            metadata: {
                base44_app_id: Deno.env.get("BASE44_APP_ID")
            }
        });

        // Criar promotion code com o código personalizado
        const promotionCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: code.toUpperCase(),
            max_redemptions: 1,
            metadata: {
                base44_app_id: Deno.env.get("BASE44_APP_ID")
            }
        });

        return Response.json({ 
            success: true,
            coupon: {
                id: coupon.id,
                percent_off: coupon.percent_off,
                code: promotionCode.code
            },
            message: `Código de desconto ${promotionCode.code} criado com sucesso`
        });
    } catch (error) {
        console.error('Erro ao criar código de desconto:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});