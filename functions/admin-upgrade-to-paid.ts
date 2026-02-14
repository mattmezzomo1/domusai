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
            return Response.json({ error: 'user_email é obrigatório' }, { status: 400 });
        }

        // Buscar assinatura existente
        const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_email: user_email
        });

        if (existingSubscriptions.length === 0) {
            return Response.json({ error: 'Usuário não possui assinatura' }, { status: 404 });
        }

        const subscription = existingSubscriptions[0];

        // Atualizar para plano pago
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
            plan_type: 'domus_paid',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        return Response.json({ 
            success: true,
            message: 'Plano alterado para pago com sucesso'
        });

    } catch (error) {
        console.error('Erro ao alterar plano:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});