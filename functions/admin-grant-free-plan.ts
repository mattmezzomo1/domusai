import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { user_email } = await req.json();

        if (!user_email) {
            return Response.json({ error: 'user_email is required' }, { status: 400 });
        }

        // Verificar se já existe uma subscription para este usuário
        const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_email: user_email
        });

        let subscription;

        if (existingSubscriptions.length > 0) {
            // Atualizar a subscription existente
            subscription = await base44.asServiceRole.entities.Subscription.update(
                existingSubscriptions[0].id,
                {
                    plan_type: 'domus_free',
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
                }
            );
        } else {
            // Criar nova subscription
            subscription = await base44.asServiceRole.entities.Subscription.create({
                user_email: user_email,
                plan_type: 'domus_free',
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
            });
        }

        return Response.json({ 
            success: true,
            subscription: subscription,
            message: 'Plano gratuito concedido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao conceder plano gratuito:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});