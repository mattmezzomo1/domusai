const VALID_ACCESS_STATUSES = new Set(['ACTIVE', 'TRIAL']);
const BLOCKED_ACCESS_STATUSES = new Set(['CANCELLED', 'PAST_DUE', 'EXPIRED']);

export function normalizeSubscriptionStatus(status) {
  return String(status || '').trim().toUpperCase();
}

export function normalizeSubscriptionProvider(provider) {
  return String(provider || '').trim().toUpperCase();
}

export function hasRhizoRegistration(user, subscription) {
  return Boolean(
    user?.rhizo_customer_id ||
      user?.rhizoCustomerId ||
      subscription?.rhizo_customer_id ||
      normalizeSubscriptionProvider(subscription?.provider) === 'RHIZO'
  );
}

export function isRhizoSubscription(subscription) {
  return Boolean(
    subscription?.rhizo_customer_id ||
      normalizeSubscriptionProvider(subscription?.provider) === 'RHIZO'
  );
}

export function isBlockedRhizoSubscription(subscription) {
  return isRhizoSubscription(subscription) &&
    BLOCKED_ACCESS_STATUSES.has(normalizeSubscriptionStatus(subscription?.status));
}

export function hasSubscriptionAccess(subscription, user) {
  const status = normalizeSubscriptionStatus(subscription?.status);
  const userRhizoRegistered = hasRhizoRegistration(user);
  const subscriptionRhizoRegistered = isRhizoSubscription(subscription);
  const rhizoRegistered = userRhizoRegistered || subscriptionRhizoRegistered;

  if (subscriptionRhizoRegistered && BLOCKED_ACCESS_STATUSES.has(status)) {
    return false;
  }

  if (rhizoRegistered) {
    return true;
  }

  if (!VALID_ACCESS_STATUSES.has(status)) {
    return false;
  }

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  if (!periodEnd || Number.isNaN(periodEnd.getTime())) {
    return rhizoRegistered;
  }

  return periodEnd.getTime() > Date.now();
}
