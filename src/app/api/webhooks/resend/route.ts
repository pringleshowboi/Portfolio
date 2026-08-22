import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { findLeadsByEmail, setLeadEmailVerified } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isProd = process.env.NODE_ENV === 'production';

type ResendEvent =
  | { type: 'email.bounced'; data: { email_to: string[] | string; email_id?: string; created_at?: string; [k: string]: unknown } }
  | { type: 'email.complained'; data: { email_to: string[] | string; email_id?: string; created_at?: string; [k: string]: unknown } }
  | { type: string; data: Record<string, unknown> };

function getWebhookSecret(): string | null {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (isProd) {
      console.error(
        '[RESEND WEBHOOK FATAL] Missing RESEND_WEBHOOK_SECRET in production env (Vercel → Project → Settings → Environment Variables). ' +
        'Set this to the "Signing Secret" shown in Resend → Webhooks after creating the endpoint at /api/webhooks/resend. ' +
        'Without it, all bounce/complaint webhook payloads will be rejected as unverified to prevent spoofing.'
      );
    }
    return null;
  }
  return secret;
}

export async function POST(req: NextRequest) {
  const secret = getWebhookSecret();

  try {
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn(
        '[RESEND WEBHOOK] Rejected: missing Svix signature headers (svix-id, svix-timestamp, svix-signature). ' +
        'This usually means the request is not actually from Resend, or the endpoint was called directly for testing.'
      );
      return NextResponse.json(
        { error: 'Missing svix signature headers — Resend webhooks are signed with svix-* headers. Endpoint cannot be called directly.' },
        { status: 400 }
      );
    }

    const payloadString = await req.text();

    if (secret) {
      try {
        const wh = new Webhook(secret);
        const headers = {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        };
        wh.verify(payloadString, headers);
      } catch (verifyErr) {
        console.error('[RESEND WEBHOOK] Signature verification FAILED. Possible spoofed request or wrong RESEND_WEBHOOK_SECRET.', verifyErr);
        return NextResponse.json(
          { error: 'Invalid webhook signature. Check RESEND_WEBHOOK_SECRET matches Resend dashboard signing secret.' },
          { status: 401 }
        );
      }
    }

    let event: ResendEvent;
    try {
      event = JSON.parse(payloadString) as ResendEvent;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const type = event.type;

    if (type !== 'email.bounced' && type !== 'email.complained') {
      return NextResponse.json({ ok: true, handled: false, reason: `Event type ${type} is not bounce/complaint — ignored.` });
    }

    const emailToRaw = (event.data as { email_to?: string[] | string }).email_to;
    const recipients: string[] = Array.isArray(emailToRaw)
      ? emailToRaw
      : typeof emailToRaw === 'string'
        ? [emailToRaw]
        : [];

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, handled: false, reason: 'No email_to recipients found in payload.' });
    }

    const results: Record<string, { leads_updated: number; leads_found: number; errors: string[] }> = {};

    for (const recipient of recipients) {
      const email = typeof recipient === 'string' ? recipient.trim().toLowerCase() : '';
      if (!email) continue;

      const { data: leads, error: findError } = await findLeadsByEmail(email);
      if (findError) {
        results[email] = { leads_updated: 0, leads_found: 0, errors: [findError] };
        continue;
      }

      let updated = 0;
      const errors: string[] = [];

      for (const lead of leads) {
        const { error } = await setLeadEmailVerified(lead.id, false);
        if (error) {
          errors.push(`lead ${lead.id}: ${error}`);
        } else {
          updated++;
        }
      }

      results[email] = { leads_found: leads.length, leads_updated: updated, errors };

      if (isProd) {
        console.log(
          `[RESEND WEBHOOK] ${type} → email=${email} leads_found=${leads.length} leads_email_unverified=${updated} errors=${errors.length}`
        );
      }
    }

    return NextResponse.json({
      ok: true,
      handled: true,
      event: type,
      results,
    });
  } catch (err) {
    console.error('[RESEND WEBHOOK] Unhandled processing error:', err);
    return NextResponse.json(
      { error: isProd ? 'Internal webhook processing error.' : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: '/api/webhooks/resend',
      subscribe_to: ['email.bounced', 'email.complained'],
      signature: 'Svix (svix-id, svix-timestamp, svix-signature headers). Secret env var: RESEND_WEBHOOK_SECRET.',
      setup:
        '1. In Resend → Webhooks → Create endpoint: POST https://YOUR_DOMAIN/api/webhooks/resend. ' +
        '2. Select events: email.bounced + email.complained. ' +
        '3. Copy the displayed "Signing Secret" and add as RESEND_WEBHOOK_SECRET in Vercel → Project → Settings → Environment Variables → Production. ' +
        '4. Redeploy for env var to take effect.',
    },
    { status: 200 }
  );
}
