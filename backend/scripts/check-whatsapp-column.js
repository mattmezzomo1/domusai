const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumn() {
  const connection = await prisma.$connect();
  
  try {
    console.log('Verificando estrutura da tabela restaurants...\n');

    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM restaurants`;

    console.log('Colunas da tabela restaurants:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    const hasWhatsAppColumn = columns.some(col => col.Field === 'whatsapp_message_template');

    if (hasWhatsAppColumn) {
      console.log('\n✅ Coluna whatsapp_message_template EXISTE no banco de dados!');
    } else {
      console.log('\n❌ Coluna whatsapp_message_template NÃO EXISTE no banco de dados!');
    }

  } catch (error) {
    console.error('Erro ao verificar coluna:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumn();

