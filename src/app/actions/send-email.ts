'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !message) {
    return { error: 'Missing required fields' };
  }

  try {
    const data = await resend.emails.send({
      from: 'SECURE_AUDIT_PROTOCOL <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL || 'delivered@resend.dev', // Fallback for testing
      subject: `[SECURE AUDIT] Request from ${name}`,
      replyTo: email,
      text: `AUDIT_PROTOCOL: INITIALIZED\nSENDER: ${name}\nEMAIL: ${email}\n\nPAYLOAD:\n${message}`,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Email error:', error);
    return { error: 'Failed to send email' };
  }
}
