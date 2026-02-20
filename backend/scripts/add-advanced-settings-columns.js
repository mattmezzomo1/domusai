const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log('Adicionando colunas de configurações avançadas...\n');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'add_advanced_settings_columns.sql'),
      'utf8'
    );
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await prisma.$executeRawUnsafe(statement);
      }
    }
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();

