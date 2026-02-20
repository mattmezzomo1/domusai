const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adicionando coluna whatsapp_message_template...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT DEFAULT 'Olá {nome}! Tudo bem?'
    `);
    
    console.log('✅ Coluna adicionada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

