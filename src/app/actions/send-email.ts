'use server';

import { Resend } from 'resend';
import { createLead } from '@/lib/db';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !message) {
    return { error: 'Missing required fields' };
  }

  const resend = getResend();
  let emailSent = true;
  let emailData: unknown = null;

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: 'SECURE_AUDIT_PROTOCOL <onboarding@resend.dev>',
        to: process.env.CONTACT_EMAIL || 'delivered@resend.dev',
        subject: `[SECURE AUDIT] Request from ${name}`,
        replyTo: email,
        text: `AUDIT_PROTOCOL: INITIALIZED\nSENDER: ${name}\nEMAIL: ${email}\n\nPAYLOAD:\n${message}`,
      });
      emailData = result;
    } catch (error) {
      console.error('Email error:', error);
      emailSent = false;
    }
  }

  try {
    await createLead({ name, email, message, source: 'contact' });
  } catch (dbError) {
    console.error('DB lead insert error (contact form):', dbError);
  }

  if (!resend) {
    return { error: 'Email service is not configured' };
  }

  if (!emailSent) {
    return { error: 'Failed to send email' };
  }

  return { success: true, data: emailData };
}
