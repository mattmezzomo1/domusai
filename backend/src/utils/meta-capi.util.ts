/**
 * Meta Conversions API (CAPI) - Server-Side Event Sender
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Sends a "Lead" event when a public reservation is successfully created.
 * Uses Node's built-in https module — no extra dependencies needed.
 */

import { request } from 'https';
import { hashEmail, hashPhone, hashFirstName, hashLastName } from './meta.util';

export interface MetaCapiLeadPayload {
  pixelId: string;
  accessToken: string;
  eventId: string;           // Must match the eventID sent to the browser Pixel
  eventSourceUrl?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string | null;       // _fbp cookie
  fbc?: string | null;       // _fbc cookie (from fbclid query param)
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  testEventCode?: string;    // For Meta Event Manager testing
}

/**
 * Send a Lead event to Meta Conversions API (server-side).
 * Failures are caught and logged — they must NOT break the reservation flow.
 */
export async function sendMetaLeadEvent(payload: MetaCapiLeadPayload): Promise<void> {
  const {
    pixelId,
    accessToken,
    eventId,
    eventSourceUrl,
    clientIpAddress,
    clientUserAgent,
    fbp,
    fbc,
    email,
    phone,
    fullName,
    testEventCode,
  } = payload;

  if (!pixelId || !accessToken) {
    // Restaurant has no Meta credentials configured — skip silently
    return;
  }

  // Build hashed user_data — only include keys with actual values
  const userData: Record<string, string> = {};
  const em = hashEmail(email);
  const ph = hashPhone(phone);
  const fn = hashFirstName(fullName);
  const ln = hashLastName(fullName);
  if (em) userData.em = em;
  if (ph) userData.ph = ph;
  if (fn) userData.fn = fn;
  if (ln) userData.ln = ln;
  if (clientIpAddress) userData.client_ip_address = clientIpAddress;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const eventPayload: Record<string, any> = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: eventSourceUrl || undefined,
        user_data: userData,
      },
    ],
  };

  if (testEventCode) {
    eventPayload.test_event_code = testEventCode;
  }

  const body = JSON.stringify(eventPayload);
  const path = `/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  return new Promise((resolve) => {
    const req = request(
      {
        hostname: 'graph.facebook.com',
        port: 443,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[MetaCAPI] Lead event sent successfully. event_id=${eventId}`);
          } else {
            console.error(`[MetaCAPI] Error response ${res.statusCode}: ${data}`);
          }
          resolve();
        });
      }
    );

    req.on('error', (err) => {
      console.error('[MetaCAPI] Request failed:', err.message);
      resolve(); // Never reject — CAPI errors must not break the reservation
    });

    req.write(body);
    req.end();
  });
}

