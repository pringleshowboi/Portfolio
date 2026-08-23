export type LeadSource = 'contact' | 'risk-scan' | 'demo';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed';

// ------------------------------------------------------------
// Project Requests — /configure quote builder
// ------------------------------------------------------------
export type ProjectRequestStatus = 'new' | 'contacted' | 'scoped' | 'won' | 'lost';

export interface QuoteLineItem {
  label: string;
  amount_zar: number;
}

export interface ProjectRequest {
  id: string;
  project_type: string;
  style: string | null;
  features: string[];
  notes: string | null;
  billing_model: string;
  line_items: QuoteLineItem[];
  estimated_total_zar: number;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  status: ProjectRequestStatus;
  pdf_sent: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  created_at: string;
  company_name: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  region: string | null;
  source_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  data_quality: number | null;
  enrichment: Record<string, unknown>;
}

// ------------------------------------------------------------
// Scrape Runs — GHA / cron-job observability
// ------------------------------------------------------------
export interface ScrapeRun {
  id: number;
  source: string;              // 'places_api' | 'cape_town_info' | ...
  region: string | null;
  industry: string | null;
  query_text: string | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  found_cnt: number;
  new_cnt: number;
  dedup_cnt: number;
  verified_cnt: number;
  errored_cnt: number;
  errors: unknown[];
  metadata: Record<string, unknown>;
}

export type StackTier = 'Track 1' | 'Track 2' | 'Track 3';
export type StackNfrStatus = 'not_started' | 'nfr_requested' | 'active' | 'partner';

export interface StackVendor {
  id: string;
  vendor_name: string;
  tier: StackTier;
  nfr_partner_status: StackNfrStatus;
  vendor_url: string | null;
  notes: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAD_SOURCES: LeadSource[] = ['contact', 'risk-scan', 'demo'];
export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'closed'];
export const STACK_TIERS: StackTier[] = ['Track 1', 'Track 2', 'Track 3'];
export const STACK_STATUSES: StackNfrStatus[] = ['not_started', 'nfr_requested', 'active', 'partner'];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'NEW',
  contacted: 'CONTACTED',
  qualified: 'QUALIFIED',
  closed: 'CLOSED',
};

export const STACK_STATUS_LABELS: Record<StackNfrStatus, string> = {
  not_started: 'NOT STARTED',
  nfr_requested: 'NFR REQUESTED',
  active: 'ACTIVE',
  partner: 'PARTNER',
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  qualified: 'bg-green-500/20 text-green-400 border-green-500/50',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};

export const STACK_STATUS_COLORS: Record<StackNfrStatus, string> = {
  not_started: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  nfr_requested: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  active: 'bg-green-500/20 text-green-400 border-green-500/50',
  partner: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
};

// ============================================================
// M4N PLATFORM TYPES
// ============================================================

export type TenantTier = 'starter' | 'growth' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'cancelled';

export interface Tenant {
  id: string;
  slug: string;
  display_name: string;
  contact_email: string | null;
  tier: TenantTier;
  status: TenantStatus;
  popia_consent: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const TENANT_TIERS: TenantTier[] = ['starter', 'growth', 'enterprise'];
export const TENANT_STATUSES: TenantStatus[] = ['active', 'suspended', 'cancelled'];

export const TENANT_TIER_RATE_LIMITS_DAILY: Record<TenantTier, number> = {
  starter: 100,
  growth: 2500,
  enterprise: 25000,
};

export const TENANT_TIER_LABELS: Record<TenantTier, string> = {
  starter: 'STARTER',
  growth: 'GROWTH',
  enterprise: 'ENTERPRISE',
};

export const TENANT_TIER_COLORS: Record<TenantTier, string> = {
  starter: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  growth: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
};

// ------------------------------------------------------------
// Monitored Assets
// ------------------------------------------------------------
export interface MonitoredAsset {
  id: string;
  tenant_id: string;
  domain: string;
  added_at: string;
  last_scanned_at: string | null;
  metadata: Record<string, unknown>;
}

// ------------------------------------------------------------
// Scan Results
// ------------------------------------------------------------
export interface TechStackItem {
  name: string;
  version?: string;
  category?: string;
  confidence?: number;
}

export interface OpenPortItem {
  port: number;
  service?: string;
  banner?: string;
  state?: 'open' | 'filtered' | 'closed';
}

export type ScanSource = 'leadclaw' | 'strix' | 'combined';

export interface ScanResult {
  id: string;
  asset_id: string;
  tenant_id: string;
  tech_stack: TechStackItem[];
  open_ports: OpenPortItem[];
  dns_records: Record<string, unknown>;
  headers: Record<string, unknown>;
  scan_source: ScanSource;
  scanned_at: string;
  duration_ms: number | null;
}

// ------------------------------------------------------------
// CVE Matches
// ------------------------------------------------------------
export type CveSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CveMatchStatus = 'new' | 'acked' | 'resolved';

export interface CveMatch {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  cve_id: string;
  severity: CveSeverity;
  cvss_score: number | null;
  tech_match: Record<string, unknown>;
  status: CveMatchStatus;
  description: string | null;
  cve_references: unknown[];
  first_detected_at: string;
  resolved_at: string | null;
  updated_at: string;
}

export const CVE_SEVERITIES: CveSeverity[] = ['low', 'medium', 'high', 'critical'];
export const CVE_MATCH_STATUSES: CveMatchStatus[] = ['new', 'acked', 'resolved'];

export const CVE_SEVERITY_LABELS: Record<CveSeverity, string> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

export const CVE_SEVERITY_COLORS: Record<CveSeverity, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
};

// ------------------------------------------------------------
// API Keys (hashed only)
// ------------------------------------------------------------
export interface ApiKey {
  id: string;
  tenant_id: string;
  key_hash: Uint8Array | string; // BYTEA — stored as hex/buffer
  key_prefix: string;            // sk_live_xxxx (not a secret)
  label: string | null;
  tier: TenantTier;
  rate_limit_daily: number;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface CreatedApiKey {
  id: string;
  raw_key: string;   // shown ONCE on creation
  key_prefix: string;
}

// ------------------------------------------------------------
// Usage Log
// ------------------------------------------------------------
export interface UsageLog {
  id: number;
  api_key_id: string | null;
  tenant_id: string | null;
  endpoint: string;
  method: string | null;
  status_code: number | null;
  response_ms: number | null;
  client_ip: string | null;
  called_at: string;
  // AI groundwork (0005) — infrastructure only, not yet wired to any feature
  action_type: string | null;
  client_identifier: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  token_count: number | null;
  cost_usd: number | null;
}
