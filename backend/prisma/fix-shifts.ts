import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo turnos no banco de dados...\n');
  
  // 1. Buscar todos os turnos
  const shifts = await prisma.shift.findMany({
    orderBy: { created_date: 'asc' },
  });

  console.log(`📊 Encontrados ${shifts.length} turnos`);

  // 2. Buscar o restaurante
  const restaurant = await prisma.restaurant.findFirst();
  
  if (!restaurant) {
    console.error('❌ Nenhum restaurante encontrado!');
    process.exit(1);
  }

  console.log(`✅ Restaurante: ${restaurant.name} (${restaurant.id})`);

  // 3. Remover turnos duplicados (manter apenas o primeiro "Almoço")
  const lunchShifts = shifts.filter(s => s.name === 'Almoço');
  
  if (lunchShifts.length > 1) {
    console.log(`\n🗑️  Removendo ${lunchShifts.length - 1} turno(s) de Almoço duplicado(s)...`);
    
    // Manter o primeiro, deletar os outros
    for (let i = 1; i < lunchShifts.length; i++) {
      await prisma.shift.delete({
        where: { id: lunchShifts[i].id },
      });
      console.log(`   ✅ Removido turno duplicado: ${lunchShifts[i].id}`);
    }
  }

  // 4. Verificar se já existe turno de Jantar
  const dinnerShift = await prisma.shift.findFirst({
    where: {
      name: 'Jantar',
      restaurant_id: restaurant.id,
    },
  });

  if (dinnerShift) {
    console.log('\n✅ Turno de Jantar já existe!');
  } else {
    console.log('\n📝 Criando turno de Jantar...');
    
    const newDinnerShift = await prisma.shift.create({
      data: {
        restaurant_id: restaurant.id,
        owner_email: restaurant.owner_email,
        name: 'Jantar',
        start_time: '19:00',
        end_time: '23:00',
        slot_interval_minutes: 15,
        default_dwell_minutes: 90,
        default_buffer_minutes: 10,
        max_capacity: null,
        days_of_week: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
        active: true,
      },
    });

    console.log(`   ✅ Turno de Jantar criado: ${newDinnerShift.id}`);
    console.log(`   - Horário: ${newDinnerShift.start_time} - ${newDinnerShift.end_time}`);
    console.log(`   - Dias: Segunda a Sábado`);
  }

  // 5. Listar turnos finais
  console.log('\n📋 Turnos finais:');
  const finalShifts = await prisma.shift.findMany({
    where: { restaurant_id: restaurant.id },
    orderBy: { start_time: 'asc' },
  });

  finalShifts.forEach((shift, index) => {
    console.log(`\n${index + 1}. ${shift.name}`);
    console.log(`   - Horário: ${shift.start_time} - ${shift.end_time}`);
    console.log(`   - Dias: ${JSON.stringify(shift.days_of_week)}`);
    console.log(`   - Ativo: ${shift.active}`);
  });

  console.log('\n🎉 Turnos corrigidos com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

