import prisma from '../../utils/db';
import { hashPassword, generateRandomPassword } from '../../utils/password.util';
import { AppError } from '../../middleware/error.middleware';

export class AdminService {
  async createFreetrialAccount(email: string, fullName: string): Promise<{ user: any; temporaryPassword: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const temporaryPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        full_name: fullName,
        role: 'USER',
        updated_date: new Date(),
      },
    });

    // Create free trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days trial

    await prisma.subscription.create({
      data: {
        user_email: email,
        plan_type: 'DOMUS_FREE',
        status: 'TRIAL',
        current_period_start: new Date(),
        current_period_end: trialEndDate,
        updated_date: new Date(),
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      temporaryPassword,
    };
  }

  async grantFreePlan(userEmail: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Find existing subscription
    const subscription = await prisma.subscription.findFirst({
      where: { user_email: userEmail },
      orderBy: { created_date: 'desc' },
    });

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan_type: 'DOMUS_FREE',
          status: 'ACTIVE',
          current_period_start: new Date(),
          current_period_end: oneYearFromNow,
          updated_date: new Date(),
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          user_email: userEmail,
          plan_type: 'DOMUS_FREE',
          status: 'ACTIVE',
          current_period_start: new Date(),
          current_period_end: oneYearFromNow,
          updated_date: new Date(),
        },
      });
    }

    return { message: 'Free plan granted successfully' };
  }

  async revokeAccess(userEmail: string): Promise<{ message: string }> {
    const subscription = await prisma.subscription.findFirst({
      where: { user_email: userEmail },
      orderBy: { created_date: 'desc' },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        updated_date: new Date(),
      },
    });

    return { message: 'Access revoked successfully' };
  }

  async upgradeToPaid(userEmail: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<{ message: string }> {
    const subscription = await prisma.subscription.findFirst({
      where: { user_email: userEmail },
      orderBy: { created_date: 'desc' },
    });

    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: new Date(),
          current_period_end: oneMonthFromNow,
          updated_date: new Date(),
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          user_email: userEmail,
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: new Date(),
          current_period_end: oneMonthFromNow,
          updated_date: new Date(),
        },
      });
    }

    return { message: 'Upgraded to paid plan successfully' };
  }

  async createDiscountCode(code: string, _discountPercent: number): Promise<{ message: string; code: string }> {
    // TODO: Implement discount code creation in Stripe
    // This would typically create a coupon in Stripe
    return {
      message: 'Discount code created successfully',
      code,
    };
  }
}

export default new AdminService();

