import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, full_name } = await req.json();

        if (!email) {
            return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
        }

        // Convida o usuário (cria a conta)
        await base44.asServiceRole.users.inviteUser(email, "user");
        
        // Aguarda um momento para garantir que a conta foi criada
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Cria automaticamente uma subscription free para o usuário
        const subscription = await base44.asServiceRole.entities.Subscription.create({
            user_email: email,
            plan_type: 'domus_free',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
        });

        return Response.json({ 
            success: true,
            subscription: subscription,
            message: 'Conta free trial criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar conta free trial:', error);
        return Response.json({ 
            error: error.message || 'Erro ao criar conta' 
        }, { status: 500 });
    }
});