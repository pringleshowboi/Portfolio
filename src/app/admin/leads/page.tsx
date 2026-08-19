import { listLeads } from '@/lib/db';
import LeadsDashboardClient from './LeadsDashboardClient';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const { data: leads } = await listLeads({ sortBy: 'created_at', sortDir: 'desc' });

  return <LeadsDashboardClient initialLeads={leads} />;
}
