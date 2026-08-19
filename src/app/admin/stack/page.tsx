import { listStackVendors } from '@/lib/db';
import StackDashboardClient from './StackDashboardClient';

export const dynamic = 'force-dynamic';

export default async function StackPage() {
  const { data: vendors } = await listStackVendors();

  return <StackDashboardClient initialVendors={vendors} />;
}
