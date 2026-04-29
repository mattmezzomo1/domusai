/** Rhizo webhook event types */
export type RhizoEventType =
  | 'subscription.created'
  | 'subscription.reactivated'
  | 'subscription.cancelled'
  | 'subscription.payment_failed';

/** Rhizo plan tier (normalized) */
export type RhizoTier = 'Basic' | 'Plus' | 'Premium' | 'Pro' | 'Enterprise';

/**
 * Payload received on `subscription.created`.
 * Other events arrive with a leaner shape (only customer_id + event + timestamp).
 */
export interface RhizoCreatedPayload {
  event: 'subscription.created';
  timestamp: string;
  customer_id: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  plan_name: string;
}

export interface RhizoLifecyclePayload {
  event: 'subscription.reactivated' | 'subscription.cancelled' | 'subscription.payment_failed';
  timestamp: string;
  customer_id: string;
}

export type RhizoWebhookPayload = RhizoCreatedPayload | RhizoLifecyclePayload;

export interface RhizoWebhookResult {
  ok: true;
  event: RhizoEventType;
  action: 'created' | 'updated' | 'reactivated' | 'cancelled' | 'past_due' | 'ignored';
  user_id?: string;
  reason?: string;
}
