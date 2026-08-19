import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { listLeads, updateLeadStatus } from '@/lib/db';
import type { LeadStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as LeadStatus | null;
  const source = searchParams.get('source') as 'contact' | 'risk-scan' | 'demo' | null;
  const sortBy = searchParams.get('sortBy') as 'created_at' | 'status' | 'source' | 'email' | 'name' | null;
  const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;

  const { data, error } = await listLeads({
    status: status ?? undefined,
    source: source ?? undefined,
    sortBy: sortBy ?? undefined,
    sortDir: sortDir ?? undefined,
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

    const validStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { error } = await updateLeadStatus(id, status);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Lead PATCH error:', err);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
