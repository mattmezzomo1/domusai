import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                Deno.env.get('STRIPE_WEBHOOK_SECRET')
            );
        } catch (err) {
            console.error('Erro na validação do webhook:', err.message);
            return Response.json({ error: 'Webhook validation failed' }, { status: 400 });
        }

        console.log('Webhook recebido:', event.type);

        // Processar eventos do Stripe
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userEmail = session.metadata.user_email || session.customer_email;

                if (session.mode === 'subscription') {
                    // Buscar assinatura existente
                    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                        user_email: userEmail
                    });

                    if (existingSubs.length > 0) {
                        // Atualizar assinatura existente
                        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
                            plan_type: 'domus_paid',
                            status: 'active',
                            stripe_customer_id: session.customer,
                            stripe_subscription_id: session.subscription,
                            current_period_start: new Date().toISOString(),
                        });
                    } else {
                        // Criar nova assinatura
                        await base44.asServiceRole.entities.Subscription.create({
                            user_email: userEmail,
                            plan_type: 'domus_paid',
                            status: 'active',
                            stripe_customer_id: session.customer,
                            stripe_subscription_id: session.subscription,
                            current_period_start: new Date().toISOString(),
                        });
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (existingSubs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
                        status: subscription.status === 'active' ? 'active' : 'cancelled',
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (existingSubs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, {
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                    });
                }
                break;
            }

            default:
                console.log(`Evento não tratado: ${event.type}`);
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error('Erro no webhook:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});