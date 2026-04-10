import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, summary } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required.' },
        { status: 400 }
      );
    }

    // Send notification to you
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.CONTACT_EMAIL || 'delivered@resend.dev',
      subject: `Demo Request from ${email}`,
      html: `
        <div style="background:#0a0a0a;color:#22c55e;font-family:monospace;padding:20px;border:1px solid #22c55e;">
          <h2 style="color:#eab308;">SECURE DEMO REQUEST</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Conversation Summary:</strong></p>
          <pre style="background:#111;padding:10px;border-left:2px solid #22c55e;white-space:pre-wrap;">${summary || 'No conversation history.'}</pre>
          <p style="margin-top:20px;color:#888;">Action required: Prepare architecture breakdown and schedule demo.</p>
        </div>
      `,
    });

    // Send confirmation to client
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Your Security Architecture Overview — Demo Request Received',
      html: `
        <div style="background:#0a0a0a;color:#22c55e;font-family:monospace;padding:30px;max-width:600px;margin:0 auto;">
          <div style="border:1px solid #22c55e;padding:20px;">
            <h1 style="color:#eab308;font-size:24px;margin:0 0 20px 0;">SECURE INTELLIGENT SYSTEMS</h1>
            <p style="color:#22c55e;font-size:14px;">Your demo request has been received. A senior security architect will prepare a custom architecture breakdown for your environment.</p>
            <div style="background:#111;padding:15px;margin:20px 0;border-left:2px solid #22c55e;">
              <p style="margin:0;color:#888;font-size:12px;">What to expect:</p>
              <ul style="margin:10px 0;padding-left:20px;color:#22c55e;font-size:13px;">
                <li>Personalized attack surface analysis</li>
                <li>Check Point + Splunk stack recommendations</li>
                <li>AI automation opportunities for your workflow</li>
                <li>Custom architecture diagram</li>
              </ul>
            </div>
            <a href="https://calendly.com/your-booking-link" style="display:inline-block;background:#22c55e;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:10px;">Schedule Your Demo</a>
            <p style="color:#555;font-size:11px;margin-top:30px;">This is an automated response from J.A.R.V.I.S. — Secure Intelligent Systems</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send demo error:', error);
    return NextResponse.json(
      { error: 'Failed to send demo request.' },
      { status: 500 }
    );
  }
}