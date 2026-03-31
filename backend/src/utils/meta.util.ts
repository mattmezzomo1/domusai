/**
 * Meta Pixel / Conversions API - Hashing & Normalization Utilities
 *
 * Follows Meta's official Customer Information Parameters spec:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 *
 * Rules:
 *  - All values must be lowercased and trimmed before hashing
 *  - Phone numbers: digits only, with country code (no leading + or zeros)
 *  - Names: lowercase, trimmed, no extra whitespace
 *  - SHA-256 hex digest
 */

import { createHash } from 'crypto';

/**
 * SHA-256 hash a pre-normalized string value.
 * Returns the hex digest, or null if the input is empty/nullish.
 */
export function hashSHA256(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize and hash an email address.
 */
export function hashEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return hashSHA256(email.trim().toLowerCase());
}

/**
 * Normalize a phone number to E.164 digits-only format (no + or spaces),
 * prepend Brazilian country code "55" if the number has 10-11 digits and
 * does not already start with the country code.
 *
 * Meta requires: digits only, country code prepended, no leading zeros.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Already has a country code (Brazil 55 + DDD = 12-13 digits)
  if (digits.length >= 12) return digits;

  // Brazilian local number: 10 (landline) or 11 (mobile) digits → prepend "55"
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;

  return digits;
}

/**
 * Normalize and hash a phone number.
 */
export function hashPhone(phone: string | null | undefined): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Extract and hash the first name from a full name string.
 */
export function hashFirstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  const firstName = fullName.trim().split(/\s+/)[0];
  if (!firstName) return null;
  return hashSHA256(firstName);
}

/**
 * Extract and hash the last name (everything after the first word) from a full name string.
 */
export function hashLastName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const lastName = parts.slice(1).join(' ');
  return hashSHA256(lastName);
}

/**
 * Read a cookie value by name from a raw Cookie header string.
 * Used server-side when the cookie header is forwarded from the browser request.
 */
export function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

