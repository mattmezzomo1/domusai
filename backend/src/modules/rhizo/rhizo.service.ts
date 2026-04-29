import prisma from '../../utils/db';
import { hashPassword, generateRandomPassword } from '../../utils/password.util';
import { AppError } from '../../middleware/error.middleware';
import {
  RhizoCreatedPayload,
  RhizoLifecyclePayload,
  RhizoWebhookPayload,
  RhizoWebhookResult,
} from './rhizo.types';
import { normalizePlan, addOneMonth } from './rhizo.utils';

/**
 * Handles Rhizo webhook events.
 * Behavior follows the Rhizo spec: any non-2xx is treated as a lost event
 * (no retries), so unknown customers are logged and acknowledged with 200.
 */
export class RhizoService {
  async handleEvent(payload: RhizoWebhookPayload): Promise<RhizoWebhookResult> {
    if (!payload || typeof payload !== 'object' || !payload.event) {
      throw new AppError('Invalid payload: missing event', 400);
    }

    switch (payload.event) {
      case 'subscription.created':
        return this.handleCreated(payload as RhizoCreatedPayload);
      case 'subscription.reactivated':
        return this.handleReactivated(payload as RhizoLifecyclePayload);
      case 'subscription.cancelled':
        return this.handleCancelled(payload as RhizoLifecyclePayload);
      case 'subscription.payment_failed':
        return this.handlePaymentFailed(payload as RhizoLifecyclePayload);
      default:
        console.warn('[rhizo] evento desconhecido:', (payload as any).event);
        return { ok: true, event: (payload as any).event, action: 'ignored', reason: 'unknown event' };
    }
  }

  /** subscription.created — upsert do user + subscription ACTIVE/RHIZO. */
  private async handleCreated(payload: RhizoCreatedPayload): Promise<RhizoWebhookResult> {
    const { customer_id, customer_email, customer_name, customer_phone, plan_name } = payload;

    if (!customer_id || !customer_email) {
      throw new AppError('Invalid payload: customer_id and customer_email are required', 400);
    }

    const tier = normalizePlan(plan_name);
    const periodStart = new Date();
    const periodEnd = addOneMonth(periodStart);
    const email = customer_email.toLowerCase().trim();

    // 1. Find existing user by rhizo_customer_id OR by email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ rhizo_customer_id: customer_id }, { email }],
      },
    });

    let userId: string;
    let action: 'created' | 'updated';

    if (existing) {
      // Anexa rhizo_customer_id se ainda não tiver e atualiza dados básicos
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          rhizo_customer_id: existing.rhizo_customer_id ?? customer_id,
          phone: existing.phone ?? customer_phone ?? null,
          full_name: existing.full_name || customer_name || existing.full_name,
          updated_date: new Date(),
        },
      });
      userId = updated.id;
      action = 'updated';
    } else {
      // Cria user novo com senha aleatória (Rhizo é o gateway de auth do plano)
      const tempPassword = generateRandomPassword(16);
      const hashed = await hashPassword(tempPassword);
      const created = await prisma.user.create({
        data: {
          email,
          password: hashed,
          full_name: customer_name || email,
          phone: customer_phone ?? null,
          rhizo_customer_id: customer_id,
          role: 'USER',
        },
      });
      userId = created.id;
      action = 'created';
    }

    // 2. Upsert da subscription Rhizo do usuário (uma ativa por user)
    const existingSub = await prisma.subscription.findFirst({
      where: { user_email: email, provider: 'RHIZO' },
      orderBy: { created_date: 'desc' },
    });

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          tier,
          rhizo_customer_id: customer_id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancelled_at: null,
          updated_date: new Date(),
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          user_email: email,
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          provider: 'RHIZO',
          tier,
          rhizo_customer_id: customer_id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_date: new Date(),
        },
      });
    }

    console.log(`[rhizo] subscription.created → ${action} user ${email} (tier=${tier})`);
    return { ok: true, event: 'subscription.created', action, user_id: userId };
  }

  /** subscription.reactivated — volta a status ACTIVE e estende período. */
  private async handleReactivated(payload: RhizoLifecyclePayload): Promise<RhizoWebhookResult> {
    const sub = await this.findSubscription(payload.customer_id);
    if (!sub) return this.notFound('subscription.reactivated', payload.customer_id);

    const periodStart = new Date();
    const periodEnd = addOneMonth(periodStart);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        cancelled_at: null,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_date: new Date(),
      },
    });

    console.log(`[rhizo] subscription.reactivated → ${sub.user_email}`);
    return { ok: true, event: 'subscription.reactivated', action: 'reactivated' };
  }

  /** subscription.cancelled — marca CANCELLED + cancelled_at. */
  private async handleCancelled(payload: RhizoLifecyclePayload): Promise<RhizoWebhookResult> {
    const sub = await this.findSubscription(payload.customer_id);
    if (!sub) return this.notFound('subscription.cancelled', payload.customer_id);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        updated_date: new Date(),
      },
    });

    console.log(`[rhizo] subscription.cancelled → ${sub.user_email}`);
    return { ok: true, event: 'subscription.cancelled', action: 'cancelled' };
  }

  /** subscription.payment_failed — marca PAST_DUE. */
  private async handlePaymentFailed(payload: RhizoLifecyclePayload): Promise<RhizoWebhookResult> {
    const sub = await this.findSubscription(payload.customer_id);
    if (!sub) return this.notFound('subscription.payment_failed', payload.customer_id);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'PAST_DUE',
        updated_date: new Date(),
      },
    });

    console.log(`[rhizo] subscription.payment_failed → ${sub.user_email}`);
    return { ok: true, event: 'subscription.payment_failed', action: 'past_due' };
  }

  /** Busca a subscription Rhizo mais recente associada a um customer_id. */
  private async findSubscription(customerId: string) {
    if (!customerId) return null;
    return prisma.subscription.findFirst({
      where: { rhizo_customer_id: customerId },
      orderBy: { created_date: 'desc' },
    });
  }

  /** Loga e ack 200 quando o customer_id não for encontrado (Rhizo não faz retry). */
  private notFound(event: any, customerId: string): RhizoWebhookResult {
    console.warn(`[rhizo] ${event} ignorado: customer_id desconhecido (${customerId})`);
    return { ok: true, event, action: 'ignored', reason: 'customer_id not found' };
  }
}

export default new RhizoService();
