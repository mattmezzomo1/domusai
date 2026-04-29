// Script to promote an existing user to ADMIN role.
// Usage: node scripts/promote-to-admin.js <email>
// Example: node scripts/promote-to-admin.js berbadinhani@gmail.com

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Missing email argument.');
    console.error('Usage: node scripts/promote-to-admin.js <email>');
    process.exit(1);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (existingUser.role === 'ADMIN') {
      console.log(`ℹ️  User ${email} is already an ADMIN. Nothing to do.`);
      return;
    }

    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        updated_date: new Date(),
      },
    });

    console.log('✅ User promoted to ADMIN successfully!');
    console.log('Email:', updated.email);
    console.log('User ID:', updated.id);
    console.log('Role:', updated.role);
  } catch (error) {
    console.error('❌ Error promoting user to ADMIN:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
