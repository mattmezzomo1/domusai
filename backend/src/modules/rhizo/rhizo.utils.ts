import { RhizoTier } from './rhizo.types';

/**
 * Maps a free-form Rhizo plan name to one of the supported tiers.
 * Order matters: more specific keywords first (Enterprise/Premium before Plus/Pro/Basic).
 * Falls back to 'Basic' when no keyword matches.
 */
export function normalizePlan(planName: string | undefined | null): RhizoTier {
  const name = (planName || '').toLowerCase();
  if (name.includes('enterprise')) return 'Enterprise';
  if (name.includes('premium')) return 'Premium';
  if (name.includes('plus')) return 'Plus';
  if (name.includes('pro')) return 'Pro';
  if (name.includes('basic')) return 'Basic';
  return 'Basic';
}

/**
 * Returns a Date one month ahead of the given reference (defaults to now).
 * Used to set `current_period_end` for Rhizo subscriptions, which renew monthly.
 */
export function addOneMonth(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}
