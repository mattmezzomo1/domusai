import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminSubscription() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@domusai.com' },
      include: { subscriptions: true }
    });

    console.log('=== ADMIN USER ===');
    console.log(JSON.stringify(admin, null, 2));

    if (!admin) {
      console.log('\n❌ Admin user not found!');
      return;
    }

    const subscription = admin.subscriptions?.[0];

    if (!subscription) {
      console.log('\n❌ Admin has NO subscription!');
      console.log('Creating subscription...');

      const newSubscription = await prisma.subscription.create({
        data: {
          user_email: admin.email,
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      });

      console.log('✅ Subscription created:', JSON.stringify(newSubscription, null, 2));
    } else {
      console.log('\n✅ Admin has subscription:');
      console.log('Plan:', subscription.plan_type);
      console.log('Status:', subscription.status);
      console.log('Period Start:', subscription.current_period_start);
      console.log('Period End:', subscription.current_period_end);

      // Check if subscription is active
      if (subscription.status !== 'ACTIVE') {
        console.log('\n⚠️ Subscription is not ACTIVE! Updating...');
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' }
        });
        console.log('✅ Subscription status updated to ACTIVE');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSubscription();

