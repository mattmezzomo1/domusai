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

        // Buscar subscription do usuário
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_email: user_email
        });

        if (subscriptions.length === 0) {
            return Response.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // Cancelar a subscription
        const subscription = await base44.asServiceRole.entities.Subscription.update(
            subscriptions[0].id,
            {
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            }
        );

        return Response.json({ 
            success: true,
            subscription: subscription,
            message: 'Acesso revogado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao revogar acesso:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});