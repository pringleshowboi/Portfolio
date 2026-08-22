import { NextResponse } from 'next/server';
import { listStackVendors } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public endpoint: returns ONLY vendors that are actually active/partner
 * in the stack_status table, with non-sensitive fields. Used by the public
 * site so deployed-stack claims always match the DB.
 */
export async function GET() {
  const { data, error } = await listStackVendors();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const active = (data ?? [])
    .filter((v) => v.nfr_partner_status === 'active' || v.nfr_partner_status === 'partner')
    .map((v) => ({
      vendor_name: v.vendor_name,
      tier: v.tier,
      nfr_partner_status: v.nfr_partner_status,
    }));

  return NextResponse.json({ data: active });
}
