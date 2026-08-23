import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createProjectRequest, markProjectRequestPdfSent } from '@/lib/db';
import { generateQuotePdf } from '@/lib/quote-pdf';
import {
  calculateQuote,
  formatZar,
  isValidSelection,
  PROJECT_TYPES,
  STYLE_OPTIONS,
  FEATURE_OPTIONS,
} from '@/lib/configurator';

const isProd = process.env.NODE_ENV === 'production';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (isProd) {
      console.error(
        '[RESEND FATAL] Missing RESEND_API_KEY in production env. ' +
        'Configurator submissions will fail with "Email service not configured".'
      );
    }
    return null;
  }
  return new Resend(key);
}

interface ContactDetails {
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
}

function validateContact(input: unknown): { data?: ContactDetails; error?: string } {
  if (!input || typeof input !== 'object') return { error: 'Contact details required.' };
  const c = input as Partial<ContactDetails>;
  const name = c.name?.trim();
  const email = c.email?.trim().toLowerCase();
  if (!name || name.length > 255) return { error: 'Name is required.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'A valid email address is required.' };
  }
  return {
    data: {
      name,
      email,
      phone: typeof c.phone === 'string' ? c.phone.trim() : null,
      company_name: typeof c.company_name === 'string' ? c.company_name.trim() : null,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selection = body?.selection;

    if (!isValidSelection(selection)) {
      return NextResponse.json({ error: 'Invalid project selection.' }, { status: 400 });
    }

    const contact = validateContact(body?.contact);
    if (contact.error || !contact.data) {
      return NextResponse.json(
        { error: contact.error ?? 'Invalid contact details.' },
        { status: 400 }
      );
    }

    // Server-authoritative pricing — never trust the client-side total
    const quote = calculateQuote(selection);

    const notes =
      typeof body?.notes === 'string' && body.notes.trim().length > 0
        ? body.notes.trim().slice(0, 5000)
        : null;

    // Persist the monthly retainer as its own line item so the DB record
    // reflects what the client was quoted. It is deliberately NOT summed
    // into estimated_total_zar (that stays the once-off build estimate).
    const storedLineItems = [
      ...quote.lineItems.map((li) => ({ label: li.label, amount_zar: li.amountZar })),
      ...(quote.monthlyRetainerZar
        ? [{
            label: 'HOSTING & MAINTENANCE RETAINER (/ MONTH)',
            amount_zar: quote.monthlyRetainerZar,
          }]
        : []),
    ];

    const dbResult = await createProjectRequest({
      project_type: selection.projectType,
      style: selection.style ?? null,
      features: selection.features,
      notes,
      billing_model: quote.billing,
      line_items: storedLineItems,
      estimated_total_zar: quote.totalZar,
      ...contact.data,
    });

    if (dbResult.error) {
      console.error('[CONFIGURE] DB insert failed:', dbResult.error);
      return NextResponse.json(
        { error: 'Could not save your request. Please try again or email owen@m4n.co.za directly.' },
        { status: 502 }
      );
    }

    // ---- Build plain-text summary (shared by both emails) ----
    const typeLabel =
      PROJECT_TYPES.find((t) => t.id === selection.projectType)?.label ?? selection.projectType;
    const styleLabel = selection.style
      ? STYLE_OPTIONS.find((s) => s.id === selection.style)?.label ?? selection.style
      : null;
    const featureLabels = selection.features.map(
      (f) => FEATURE_OPTIONS.find((opt) => opt.id === f)?.label ?? f
    );

    const summaryLines = [
      `PROJECT TYPE: ${typeLabel}`,
      styleLabel ? `STYLE / VIBE: ${styleLabel}` : null,
      `FEATURES: ${featureLabels.length > 0 ? featureLabels.join(', ') : 'none selected'}`,
      notes ? `NOTES:\n${notes}` : null,
      '',
      'ESTIMATED BREAKDOWN:',
      ...quote.lineItems.map((li) => `  - ${li.label}: ${formatZar(li.amountZar)}`),
      quote.monthlyRetainerZar
        ? `  - PLUS HOSTING & MAINTENANCE RETAINER: ${formatZar(quote.monthlyRetainerZar)} / MONTH`
        : null,
      `${quote.billing === 'monthly' ? 'ESTIMATED TOTAL / MONTH' : 'ESTIMATED TOTAL'}: ${formatZar(quote.totalZar)}`,
      '',
      '(Estimate only — final scope and price confirmed after consultation.)',
    ].filter((l): l is string => l !== null);

    const referenceId = dbResult.id?.slice(0, 8).toUpperCase() ?? 'PENDING';
    const resend = getResend();
    let emailFailed = false;
    let pdfSent = false;

    // ---- Generate scope-of-work PDF (best effort) ----
    let pdfAttachment: { filename: string; content: Buffer } | null = null;
    if (resend && dbResult.id) {
      try {
        const pdfBytes = await generateQuotePdf({
          referenceId,
          createdAt: new Date(),
          contact: contact.data,
          projectTypeId: selection.projectType,
          styleId: selection.style ?? null,
          features: selection.features,
          notes,
          quote,
        });
        pdfAttachment = {
          filename: `M4N-Estimate-${referenceId}.pdf`,
          content: Buffer.from(pdfBytes),
        };
      } catch (pdfErr) {
        console.error('[CONFIGURE] PDF generation error:', pdfErr);
        // Non-fatal: submission still succeeds without the attachment.
      }
    }

    if (resend) {
      try {
        const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        // Notification + PDF → Owen
        await resend.emails.send({
          from,
          to: process.env.CONTACT_EMAIL || 'owen@m4n.co.za',
          replyTo: contact.data.email,
          subject: `[PROJECT REQUEST ${referenceId}] ${contact.data.name} — ${typeLabel}`,
          text:
            `NEW CONFIGURATOR SUBMISSION (REF: ${referenceId})\n\n` +
            `NAME: ${contact.data.name}\nEMAIL: ${contact.data.email}\n` +
            `PHONE: ${contact.data.phone || 'not provided'}\n` +
            `COMPANY: ${contact.data.company_name || 'not provided'}\n\n` +
            summaryLines.join('\n'),
          ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
        });

        // Confirmation + PDF copy → client
        await resend.emails.send({
          from,
          to: contact.data.email,
          subject: `Your M4N Project Estimate — Ref ${referenceId}`,
          html: `
            <div style="background:#0a0a0a;color:#34d399;font-family:monospace;padding:30px;max-width:600px;margin:0 auto;">
              <div style="border:1px solid #22c55e;padding:24px;">
                <h1 style="color:#facc15;font-size:20px;margin:0 0 16px 0;">M4N // PROJECT CONFIGURATOR</h1>
                <p style="font-size:14px;">Hi ${contact.data.name},</p>
                <p style="font-size:14px;">Your project configuration was received. A PDF scope summary is attached.</p>
                <pre style="background:#111;padding:12px;border-left:2px solid #22c55e;white-space:pre-wrap;font-size:12px;color:#a7f3d0;">${summaryLines.join('\n')}</pre>
                <p style="font-size:12px;color:#888;margin-top:16px;">
                  This is an estimate based on your selections. Final scope and price confirmed after a consultation.
                </p>
                <p style="font-size:13px;color:#34d399;">Ref: ${referenceId}</p>
              </div>
            </div>
          `,
          ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
        });

        pdfSent = !!pdfAttachment;
      } catch (emailErr) {
        console.error('[CONFIGURE] Email send error:', emailErr);
        emailFailed = true; // logged, but the submission itself still succeeded
      }
    }

    void emailFailed;

    if (pdfSent && dbResult.id) {
      const markResult = await markProjectRequestPdfSent(dbResult.id);
      if (markResult.error) {
        console.warn('[CONFIGURE] Could not mark pdf_sent:', markResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      referenceId,
      estimate: {
        billing: quote.billing,
        totalZar: quote.totalZar,
        totalFormatted: formatZar(quote.totalZar),
      },
      emailConfigured: !!resend,
    });
  } catch (error) {
    console.error('[CONFIGURE] Submission error:', error);
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}
