import Stripe from 'stripe';
import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export class PaymentsService {
  async createCheckout(userEmail: string, priceId?: string): Promise<{ sessionId: string; url: string }> {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const subscription = await prisma.subscription.findFirst({
      where: { user_email: userEmail },
      orderBy: { created_date: 'desc' },
    });

    if (subscription?.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: user.full_name,
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        user_email: userEmail,
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer): Promise<{ received: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userEmail = session.metadata?.user_email;
    if (!userEmail) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const existingSubscription = await prisma.subscription.findFirst({
      where: { user_email: userEmail },
      orderBy: { created_date: 'desc' },
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          updated_date: new Date(),
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          user_email: userEmail,
          plan_type: 'DOMUS_PAID',
          status: 'ACTIVE',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          updated_date: new Date(),
        },
      });
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: stripeSubscription.id },
    });

    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        updated_date: new Date(),
      },
    });
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: stripeSubscription.id },
    });

    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        updated_date: new Date(),
      },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripe_subscription_id: invoice.subscription as string },
    });

    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
        updated_date: new Date(),
      },
    });
  }
}

export default new PaymentsService();

