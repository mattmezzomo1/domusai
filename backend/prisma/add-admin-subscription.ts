/**
 * Script para adicionar assinatura PAGA e ATIVA para o usuário admin
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@domusai.com';

  console.log('🔍 Verificando usuário admin...');
  
  // Verifica se o usuário admin existe
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.error('❌ Usuário admin não encontrado!');
    process.exit(1);
  }

  console.log('✅ Usuário admin encontrado:', adminUser.email);

  // Verifica se já existe uma assinatura
  const existingSubscription = await prisma.subscription.findFirst({
    where: { user_email: adminEmail },
  });

  if (existingSubscription) {
    console.log('📝 Assinatura existente encontrada. Atualizando...');
    
    // Atualiza a assinatura existente para PAGA e ATIVA
    const updatedSubscription = await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan_type: 'DOMUS_PAID',
        status: 'ACTIVE',
        current_period_start: new Date(),
        current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 10)), // 10 anos no futuro
        cancelled_at: null,
      },
    });

    console.log('✅ Assinatura atualizada com sucesso!');
    console.log('   - ID:', updatedSubscription.id);
    console.log('   - Plano:', updatedSubscription.plan_type);
    console.log('   - Status:', updatedSubscription.status);
    console.log('   - Válida até:', updatedSubscription.current_period_end);
  } else {
    console.log('📝 Criando nova assinatura...');
    
    // Cria uma nova assinatura PAGA e ATIVA
    const newSubscription = await prisma.subscription.create({
      data: {
        user_email: adminEmail,
        plan_type: 'DOMUS_PAID',
        status: 'ACTIVE',
        current_period_start: new Date(),
        current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 10)), // 10 anos no futuro
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
    });

    console.log('✅ Assinatura criada com sucesso!');
    console.log('   - ID:', newSubscription.id);
    console.log('   - Plano:', newSubscription.plan_type);
    console.log('   - Status:', newSubscription.status);
    console.log('   - Válida até:', newSubscription.current_period_end);
  }

  console.log('\n🎉 Processo concluído! O usuário admin agora tem acesso completo ao sistema.');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

