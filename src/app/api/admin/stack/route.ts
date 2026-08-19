import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { listStackVendors, updateStackVendorStatus } from '@/lib/db';
import type { StackNfrStatus, StackTier } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier') as StackTier | null;

  const { data, error } = await listStackVendors({
    tier: tier ?? undefined,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const valid: StackNfrStatus[] = ['not_started', 'nfr_requested', 'active', 'partner'];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { error } = await updateStackVendorStatus(id, status);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Stack PATCH error:', err);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
