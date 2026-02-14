import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando turnos no banco de dados...\n');
  
  const shifts = await prisma.shift.findMany({
    orderBy: { start_time: 'asc' },
  });

  if (shifts.length === 0) {
    console.log('❌ Nenhum turno encontrado no banco de dados!');
  } else {
    console.log(`✅ ${shifts.length} turno(s) encontrado(s):\n`);
    shifts.forEach((shift, index) => {
      console.log(`${index + 1}. ${shift.name}`);
      console.log(`   - Horário: ${shift.start_time} - ${shift.end_time}`);
      console.log(`   - Dias da semana: ${JSON.stringify(shift.days_of_week)}`);
      console.log(`   - Ativo: ${shift.active}`);
      console.log(`   - Restaurant ID: ${shift.restaurant_id}`);
      console.log(`   - Owner: ${shift.owner_email}`);
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

