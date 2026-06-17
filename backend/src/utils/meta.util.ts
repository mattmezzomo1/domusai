/**
 * Meta Pixel / Conversions API - Hashing & Normalization Utilities
 *
 * Follows Meta's Customer Information Parameters rules:
 * - normalize before hashing
 * - phone numbers: digits only, including country code
 * - SHA-256 hex digest for hashed customer information parameters
 */

import { createHash } from 'crypto';
import {
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/max';
import type { CountryCode } from 'libphonenumber-js/max';

const DEFAULT_PHONE_COUNTRY: CountryCode = 'BR';

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
 * Normalize an email address before hashing.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

/**
 * Normalize and hash an email address.
 */
export function hashEmail(email: string | null | undefined): string | null {
  return hashSHA256(normalizeEmail(email));
}

export function normalizePhoneCountry(countryIso: string | null | undefined): CountryCode {
  const candidate = String(countryIso || DEFAULT_PHONE_COUNTRY).trim().toUpperCase();
  return isSupportedCountry(candidate) ? candidate as CountryCode : DEFAULT_PHONE_COUNTRY;
}

/**
 * Normalize a phone number to E.164 digits-only format (no + or spaces).
 *
 * Meta requires: digits only, country code prepended, no leading zeros.
 */
export function normalizePhone(
  phone: string | null | undefined,
  countryIso: string | null | undefined = DEFAULT_PHONE_COUNTRY
): string | null {
  if (!phone) return null;
  const raw = String(phone).trim();
  if (!raw) return null;

  const selectedCountry = normalizePhoneCountry(countryIso);
  const parsed = raw.startsWith('+')
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, selectedCountry);

  if (!parsed || (parsed.country && parsed.country !== selectedCountry) || !parsed.isValid()) {
    return null;
  }

  return parsed.number.replace(/\D/g, '');
}

/**
 * Normalize and hash a phone number.
 */
export function hashPhone(
  phone: string | null | undefined,
  countryIso: string | null | undefined = DEFAULT_PHONE_COUNTRY
): string | null {
  const normalized = normalizePhone(phone, countryIso);
  if (!normalized) return null;
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeNamePart(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || null;
}

export function normalizeNameParts(fullName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  const normalized = normalizeNamePart(fullName);
  if (!normalized) return { firstName: null, lastName: null };

  const parts = normalized.split(/\s+/);
  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

/**
 * Extract and hash the first name from a full name string.
 */
export function hashFirstName(fullName: string | null | undefined): string | null {
  const { firstName } = normalizeNameParts(fullName);
  return hashSHA256(firstName);
}

/**
 * Extract and hash the last name (everything after the first word) from a full name string.
 */
export function hashLastName(fullName: string | null | undefined): string | null {
  const { lastName } = normalizeNameParts(fullName);
  return hashSHA256(lastName);
}

/**
 * Normalize a date of birth to Meta's required YYYYMMDD format.
 * Accepts a Date, a YYYY-MM-DD ISO string, or a full ISO datetime string.
 * Returns null for missing/invalid values.
 */
export function formatDateOfBirth(
  value: Date | string | null | undefined
): string | null {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{8}$/.test(value)) return value;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}${match[2]}${match[3]}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Normalize and hash a date of birth (YYYYMMDD -> SHA-256 hex).
 */
export function hashDateOfBirth(
  value: Date | string | null | undefined
): string | null {
  const normalized = formatDateOfBirth(value);
  if (!normalized) return null;
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash an external identifier (reservation id, user id, etc.) with SHA-256.
 * Per Meta CAPI spec, external_id should be trimmed + lowercased before hashing.
 */
export function hashExternalId(value: string | null | undefined): string | null {
  if (!value) return null;
  return hashSHA256(value);
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
