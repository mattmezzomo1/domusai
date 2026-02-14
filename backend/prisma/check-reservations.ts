import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando últimas reservas no banco de dados...\n');
  
  const reservations = await prisma.reservation.findMany({
    orderBy: { created_date: 'desc' },
    take: 5,
  });

  if (reservations.length === 0) {
    console.log('❌ Nenhuma reserva encontrada no banco de dados!');
  } else {
    console.log(`✅ ${reservations.length} reserva(s) encontrada(s):\n`);
    reservations.forEach((reservation, index) => {
      console.log(`${index + 1}. Código: ${reservation.reservation_code}`);
      console.log(`   - Data: ${reservation.date}`);
      console.log(`   - Data (ISO): ${reservation.date.toISOString()}`);
      console.log(`   - Horário: ${reservation.slot_time}`);
      console.log(`   - Pessoas: ${reservation.party_size}`);
      console.log(`   - Status: ${reservation.status}`);
      console.log(`   - Source: ${reservation.source}`);
      console.log(`   - Customer ID: ${reservation.customer_id}`);
      console.log(`   - Table ID: ${reservation.table_id}`);
      console.log(`   - Shift ID: ${reservation.shift_id}`);
      console.log(`   - Notes: ${reservation.notes || 'N/A'}`);
      console.log('');
    });
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

