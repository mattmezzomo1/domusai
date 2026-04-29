const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function columnExists(table, column) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    table,
    column
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function indexExists(table, indexName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    table,
    indexName
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`↪︎  ${table}.${column} já existe — pulando`);
    return;
  }
  console.log(`+ Adicionando ${table}.${column}...`);
  await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
}

async function addIndexIfMissing(table, indexName, definition) {
  if (await indexExists(table, indexName)) {
    console.log(`↪︎  índice ${indexName} já existe — pulando`);
    return;
  }
  console.log(`+ Criando índice ${indexName}...`);
  await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD ${definition}`);
}

async function main() {
  console.log('🔧 Aplicando colunas Rhizo em users e subscriptions...\n');

  // users.phone
  await addColumnIfMissing('users', 'phone', '`phone` VARCHAR(50) NULL');

  // users.rhizo_customer_id (unique)
  await addColumnIfMissing(
    'users',
    'rhizo_customer_id',
    '`rhizo_customer_id` VARCHAR(191) NULL'
  );
  await addIndexIfMissing(
    'users',
    'users_rhizo_customer_id_key',
    'UNIQUE INDEX `users_rhizo_customer_id_key` (`rhizo_customer_id`)'
  );

  // subscriptions.provider
  await addColumnIfMissing(
    'subscriptions',
    'provider',
    "`provider` ENUM('STRIPE', 'RHIZO') NOT NULL DEFAULT 'STRIPE'"
  );

  // subscriptions.tier
  await addColumnIfMissing('subscriptions', 'tier', '`tier` VARCHAR(50) NULL');

  // subscriptions.rhizo_customer_id (indexed)
  await addColumnIfMissing(
    'subscriptions',
    'rhizo_customer_id',
    '`rhizo_customer_id` VARCHAR(191) NULL'
  );
  await addIndexIfMissing(
    'subscriptions',
    'subscriptions_rhizo_customer_id_idx',
    'INDEX `subscriptions_rhizo_customer_id_idx` (`rhizo_customer_id`)'
  );

  console.log('\n✅ Migração Rhizo concluída.');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração Rhizo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
