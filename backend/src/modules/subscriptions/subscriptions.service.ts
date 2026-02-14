import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import { CreateSubscriptionDTO, UpdateSubscriptionDTO, SubscriptionResponseDTO, FilterParams } from '../../types';

export class SubscriptionsService {
  async create(data: CreateSubscriptionDTO): Promise<SubscriptionResponseDTO> {
    const subscription = await prisma.subscription.create({
      data: {
        user_email: data.user_email,
        plan_type: data.plan_type,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        stripe_customer_id: data.stripe_customer_id,
        stripe_subscription_id: data.stripe_subscription_id,
        updated_date: new Date(),
      },
    });

    return subscription as SubscriptionResponseDTO;
  }

  async findAll(filters?: FilterParams): Promise<SubscriptionResponseDTO[]> {
    const where: any = {};

    if (filters?.user_email) where.user_email = filters.user_email;
    // Convert status to UPPERCASE to match enum SubscriptionStatus (ACTIVE, TRIAL, CANCELLED, PAST_DUE)
    if (filters?.status) where.status = filters.status.toUpperCase();
    // Convert plan_type to UPPERCASE to match enum PlanType (DOMUS_FREE, DOMUS_PAID)
    if (filters?.plan_type) where.plan_type = filters.plan_type.toUpperCase();

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { created_date: 'desc' },
    });

    return subscriptions as SubscriptionResponseDTO[];
  }

  async findById(id: string): Promise<SubscriptionResponseDTO> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    return subscription as SubscriptionResponseDTO;
  }

  async findByUserEmail(userEmail: string): Promise<SubscriptionResponseDTO | null> {
    const subscription = await prisma.subscription.findFirst({
      where: { user_email: userEmail },
      orderBy: { created_date: 'desc' },
    });

    return subscription as SubscriptionResponseDTO | null;
  }

  async update(id: string, data: UpdateSubscriptionDTO): Promise<SubscriptionResponseDTO> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { ...data, updated_date: new Date() },
    });

    return updated as SubscriptionResponseDTO;
  }

  async delete(id: string): Promise<{ message: string }> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    await prisma.subscription.delete({ where: { id } });
    return { message: 'Subscription deleted successfully' };
  }
}

export default new SubscriptionsService();

