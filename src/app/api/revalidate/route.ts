import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Securely compares the Sanity signature against the local secret
async function isValidSignature(body: string, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, data);
    const digest = Buffer.from(mac).toString('hex');
    
    // Check if the generated signature matches the one sent by Sanity
    return digest === signature;
}

export async function POST(req: NextRequest) {
    const signature = req.headers.get('sanity-webhook-signature');
    const secret = process.env.SANITY_WEBHOOK_SECRET;

    if (!signature || !secret) {
        return NextResponse.json({ message: 'Missing signature or secret' }, { status: 401 });
    }

    // Read the request body as text to pass to signature verification
    const bodyText = await req.text();

    try {
        if (!await isValidSignature(bodyText, signature, secret)) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }
    } catch (err) {
        console.error('Webhook signature validation failed:', err);
        return NextResponse.json({ message: 'Error validating signature' }, { status: 500 });
    }

    // --- Signature is Valid: Trigger Revalidation ---
    
    // This tells Next.js to re-fetch and rebuild the static data for the homepage (where your posts are likely listed).
    revalidatePath('/');
    
    // You may want to revalidate a specific blog listing page if you have one, e.g.:
    // revalidatePath('/blog');

    console.log('Successfully revalidated site path: /');
    return NextResponse.json({ revalidated: true, now: Date.now() });
}