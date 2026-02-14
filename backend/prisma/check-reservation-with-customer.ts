import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando reserva com dados do cliente...\n');
  
  const reservations = await prisma.reservation.findMany({
    orderBy: { created_date: 'desc' },
    take: 3,
  });

  if (reservations.length === 0) {
    console.log('❌ Nenhuma reserva encontrada!');
    return;
  }

  for (const reservation of reservations) {
    console.log(`\n📋 Reserva: ${reservation.reservation_code}`);
    console.log(`   - Customer ID: ${reservation.customer_id}`);
    
    // Buscar dados do cliente
    const customer = await prisma.customer.findUnique({
      where: { id: reservation.customer_id },
    });

    if (customer) {
      console.log(`\n👤 Cliente encontrado:`);
      console.log(`   - ID: ${customer.id}`);
      console.log(`   - Nome: ${customer.full_name}`);
      console.log(`   - Telefone: ${customer.phone_whatsapp}`);
      console.log(`   - Email: ${customer.email || 'N/A'}`);
    } else {
      console.log(`\n❌ Cliente NÃO encontrado para customer_id: ${reservation.customer_id}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

