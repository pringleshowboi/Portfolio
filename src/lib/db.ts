import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TENANT_TIER_RATE_LIMITS_DAILY } from './types';
import nodeCrypto from 'node:crypto';
import { parsePhoneNumberFromString, isValidNumberForRegion } from 'libphonenumber-js';
import type {
  Lead,
  StackVendor,
  LeadSource,
  LeadStatus,
  StackNfrStatus,
  StackTier,
  Tenant,
  TenantTier,
  TenantStatus,
  MonitoredAsset,
  ScanResult,
  ScanSource,
  CveMatch,
  CveMatchStatus,
  CveSeverity,
  ApiKey,
  CreatedApiKey,
  UsageLog,
  ScrapeRun,
  QuoteLineItem,
} from './types';

let cachedClient: SupabaseClient | null = null;
let clientInitLogged = false;

const isProd = process.env.NODE_ENV === 'production';

function assertDbEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0 && !clientInitLogged) {
    clientInitLogged = true;
    const level = isProd ? 'error' : 'warn';
    const msg =
      `[DB ${level.toUpperCase()}] Missing required Supabase env vars: ${missing.join(', ')}. ` +
      (isProd
        ? 'These MUST be set in Vercel → Project → Settings → Environment Variables → Production. ' +
          'Leads/stack dashboards will show zero data, all writes (contact form, demo requests, lead inserts) will silently fail. '
        : 'Set them in .env.local for local development. ') +
      'Get values from Supabase → Project Settings → API (SUPABASE_URL = Project URL, SUPABASE_SERVICE_ROLE_KEY = service_role secret, NOT the anon key).';
    if (isProd) console.error(msg);
    else console.warn(msg);
  }
  return { url, key };
}

function getClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, key } = assertDbEnv();

  if (!url || !key) {
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}

export async function isDbAvailable(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const { error } = await client.from('leads').select('id', { count: 'exact', head: true }).limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// PROJECT REQUESTS (/configure quote builder)
// ============================================================

export interface CreateProjectRequestInput {
  project_type: string;
  style?: string | null;
  features: string[];
  notes?: string | null;
  billing_model: string;
  line_items: QuoteLineItem[];
  estimated_total_zar: number;
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
}

export async function createProjectRequest(
  input: CreateProjectRequestInput
): Promise<{ error?: string; id?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client
    .from('project_requests')
    .insert({
      project_type: input.project_type,
      style: input.style ?? null,
      features: input.features,
      notes: input.notes?.trim() || null,
      billing_model: input.billing_model,
      line_items: input.line_items,
      estimated_total_zar: input.estimated_total_zar,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      company_name: input.company_name?.trim() || null,
      status: 'new',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] createProjectRequest error:', error);
    return { error: error.message };
  }

  return { id: data.id };
}

export async function markProjectRequestPdfSent(id: string): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };
  const { error } = await client.from('project_requests').update({ pdf_sent: true }).eq('id', id);
  if (error) return { error: error.message };
  return {};
}

// ============================================================
// LEADS
// ============================================================

export function isValidSouthAfricanPhone(rawPhone: string | null | undefined): boolean {
  if (!rawPhone) return false;
  const trimmed = rawPhone.trim();
  if (!trimmed) return false;
  try {
    const parsed = parsePhoneNumberFromString(trimmed, 'ZA');
    if (!parsed) return isValidNumberForRegion(trimmed, 'ZA');
    return parsed.isValid() && parsed.country === 'ZA';
  } catch {
    return false;
  }
}

export function computeDataQualityScore(opts: {
  email_verified?: boolean;
  phone_verified?: boolean;
  company_name?: string | null;
  website?: string | null;
}): number {
  let score = 0;
  if (opts.email_verified === true) score++;
  if (opts.phone_verified === true) score++;
  if (opts.company_name && opts.company_name.trim().length > 0) score++;
  if (opts.website && opts.website.trim().length > 0) score++;
  return score;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  message?: string;
  source: LeadSource;
  company_name?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  region?: string | null;
  source_url?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  data_quality?: number | null;
  enrichment?: Record<string, unknown> | null;
}

export async function createLead(input: CreateLeadInput): Promise<{ error?: string; id?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const phoneRaw = input.phone?.trim() || null;
  const phoneVerified = input.phone_verified ?? (phoneRaw ? isValidSouthAfricanPhone(phoneRaw) : false);
  const emailVerified = input.email_verified ?? false;
  const companyName = input.company_name?.trim() || null;
  const websiteRaw = input.website?.trim();
  const website = websiteRaw ? websiteRaw.toLowerCase() : null;

  const dataQuality =
    input.data_quality ??
    computeDataQualityScore({
      email_verified: emailVerified,
      phone_verified: phoneVerified,
      company_name: companyName,
      website,
    });

  const { data, error } = await client
    .from('leads')
    .insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      message: input.message?.trim() || null,
      source: input.source,
      status: 'new',
      company_name: companyName,
      phone: phoneRaw,
      website,
      industry: input.industry?.trim() || null,
      region: input.region?.trim() || null,
      source_url: input.source_url?.trim() || null,
      email_verified: emailVerified,
      phone_verified: phoneVerified,
      data_quality: dataQuality,
      enrichment: input.enrichment ?? {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] createLead error:', error);
    return { error: error.message };
  }

  return { id: data.id };
}

export async function listLeads(opts?: {
  status?: LeadStatus;
  source?: LeadSource;
  sortBy?: 'created_at' | 'status' | 'source' | 'email' | 'name' | 'data_quality';
  sortDir?: 'asc' | 'desc';
}): Promise<{ data: Lead[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  let query = client.from('leads').select('*');

  if (opts?.status) query = query.eq('status', opts.status);
  if (opts?.source) query = query.eq('source', opts.source);

  const col = opts?.sortBy ?? 'created_at';
  const dir = opts?.sortDir ?? 'desc';
  query = query.order(col, { ascending: dir === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('[DB] listLeads error:', error);
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as Lead[] };
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { error } = await client.from('leads').update({ status }).eq('id', id);

  if (error) {
    console.error('[DB] updateLeadStatus error:', error);
    return { error: error.message };
  }

  return {};
}

export async function findLeadsByEmail(email: string): Promise<{ data: Lead[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };
  const normalized = email.trim().toLowerCase();
  const { data, error } = await client.from('leads').select('*').eq('email', normalized);
  if (error) {
    console.error('[DB] findLeadsByEmail error:', error);
    return { data: [], error: error.message };
  }
  return { data: (data ?? []) as Lead[] };
}

export async function setLeadEmailVerified(
  id: string,
  email_verified: boolean
): Promise<{ error?: string; data_quality?: number }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const current = await client
    .from('leads')
    .select('phone_verified, company_name, website')
    .eq('id', id)
    .maybeSingle();
  if (current.error || !current.data) {
    return { error: current?.error?.message || 'Lead not found' };
  }

  const patch = {
    email_verified,
    data_quality: computeDataQualityScore({
      email_verified,
      phone_verified: !!current.data.phone_verified,
      company_name: current.data.company_name,
      website: current.data.website,
    }),
  };

  const { error } = await client.from('leads').update(patch).eq('id', id);
  if (error) {
    console.error('[DB] setLeadEmailVerified error:', error);
    return { error: error.message };
  }
  return { data_quality: patch.data_quality };
}

export async function getLeadCounts(): Promise<{
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
}> {
  const { data } = await listLeads();

  const byStatus: Record<LeadStatus, number> = { new: 0, contacted: 0, qualified: 0, closed: 0 };
  const bySource: Record<LeadSource, number> = { contact: 0, 'risk-scan': 0, demo: 0 };

  for (const lead of data) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
  }

  return { total: data.length, byStatus, bySource };
}

/**
 * Dedupe helper used by GHA scrape jobs before insert.
 * Match priority: website > phone > (company_name + email)
 * Returns existing lead id if hit, null if new.
 */
export async function findExistingLeadKey(opts: {
  website?: string | null;
  phone?: string | null;
  company_name?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const w = opts.website?.trim().toLowerCase();
  const p = opts.phone?.trim();
  const c = opts.company_name?.trim();
  const e = opts.email?.trim().toLowerCase();

  if (w) {
    const { data } = await client.from('leads').select('id').eq('website', w).limit(1).maybeSingle();
    if (data) return data.id;
  }
  if (p) {
    const { data } = await client.from('leads').select('id').eq('phone', p).limit(1).maybeSingle();
    if (data) return data.id;
  }
  if (c && e) {
    const { data } = await client
      .from('leads')
      .select('id')
      .eq('company_name', c)
      .eq('email', e)
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }
  return null;
}

export async function updateLeadEnrichment(
  id: string,
  patch: Partial<Omit<Lead, 'id' | 'created_at' | 'source'>>
): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };
  const { error } = await client.from('leads').update(patch).eq('id', id);
  if (error) return { error: error.message };
  return {};
}

// ============================================================
// SCRAPE RUNS (GHA / cron-job observability)
// ============================================================

export interface StartScrapeRunInput {
  source: string;
  region?: string | null;
  industry?: string | null;
  query_text?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function startScrapeRun(input: StartScrapeRunInput): Promise<{ id?: number; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client
    .from('scrape_runs')
    .insert({
      source: input.source,
      region: input.region ?? null,
      industry: input.industry ?? null,
      query_text: input.query_text ?? null,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: Number(data.id) };
}

export async function finishScrapeRun(
  id: number,
  totals: {
    found_cnt?: number;
    new_cnt?: number;
    dedup_cnt?: number;
    verified_cnt?: number;
    errored_cnt?: number;
    errors?: unknown[] | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const startedAt = await client
    .from('scrape_runs')
    .select('started_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle()
    .then((r) => (r.data?.started_at ? new Date(r.data.started_at) : new Date()));

  const now = new Date();
  const duration_ms =
    startedAt instanceof Date && !Number.isNaN(startedAt.getTime())
      ? Math.round(now.getTime() - startedAt.getTime())
      : null;

  const { error } = await client
    .from('scrape_runs')
    .update({
      ended_at: now.toISOString(),
      duration_ms,
      found_cnt: totals.found_cnt ?? 0,
      new_cnt: totals.new_cnt ?? 0,
      dedup_cnt: totals.dedup_cnt ?? 0,
      verified_cnt: totals.verified_cnt ?? 0,
      errored_cnt: totals.errored_cnt ?? 0,
      errors: totals.errors ?? [],
      metadata: totals.metadata ?? undefined,
    })
    .eq('id', id);

  if (error) return { error: error.message };
  return {};
}

export async function listScrapeRuns(limit = 100): Promise<{ data: ScrapeRun[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  const { data, error } = await client
    .from('scrape_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as unknown as ScrapeRun[] };
}

// ============================================================
// STACK STATUS
// ============================================================

export async function listStackVendors(opts?: {
  tier?: StackTier;
}): Promise<{ data: StackVendor[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  let query = client.from('stack_status').select('*').order('tier', { ascending: true }).order('vendor_name', { ascending: true });

  if (opts?.tier) query = query.eq('tier', opts.tier);

  const { data, error } = await query;

  if (error) {
    console.error('[DB] listStackVendors error:', error);
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as StackVendor[] };
}

export async function updateStackVendorStatus(
  id: string,
  status: StackNfrStatus
): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const updates: Partial<StackVendor> = {
    nfr_partner_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'active' || status === 'partner') {
    updates.connected_at = new Date().toISOString();
  }

  const { error } = await client.from('stack_status').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateStackVendorStatus error:', error);
    return { error: error.message };
  }

  return {};
}

export async function getStackCounts(): Promise<{
  total: number;
  byTier: Record<StackTier, number>;
  byStatus: Record<StackNfrStatus, number>;
}> {
  const { data } = await listStackVendors();

  const byTier: Record<StackTier, number> = { 'Track 1': 0, 'Track 2': 0, 'Track 3': 0 };
  const byStatus: Record<StackNfrStatus, number> = { not_started: 0, nfr_requested: 0, active: 0, partner: 0 };

  for (const v of data) {
    byTier[v.tier] = (byTier[v.tier] ?? 0) + 1;
    byStatus[v.nfr_partner_status] = (byStatus[v.nfr_partner_status] ?? 0) + 1;
  }

  return { total: data.length, byTier, byStatus };
}

// ============================================================
// TENANTS
// ============================================================

export async function listTenants(opts?: {
  tier?: TenantTier;
  status?: TenantStatus;
}): Promise<{ data: Tenant[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  let q = client.from('tenants').select('*').order('created_at', { ascending: false });
  if (opts?.tier) q = q.eq('tier', opts.tier);
  if (opts?.status) q = q.eq('status', opts.status);

  const { data, error } = await q;
  if (error) {
    console.error('[DB] listTenants error:', error);
    return { data: [], error: error.message };
  }
  return { data: (data ?? []) as Tenant[] };
}

export async function getTenantBySlug(slug: string): Promise<{ data?: Tenant; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client.from('tenants').select('*').eq('slug', slug).single();
  if (error) return { error: error.message };
  return { data: data as Tenant };
}

export async function updateTenant(
  id: string,
  patch: Partial<Pick<Tenant, 'display_name' | 'contact_email' | 'tier' | 'status' | 'popia_consent' | 'metadata'>>
): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { error } = await client.from('tenants').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { error: error.message };
  return {};
}

// ============================================================
// MONITORED ASSETS (domains per tenant)
// ============================================================

export async function listAssetsForTenant(tenantId: string): Promise<{ data: MonitoredAsset[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  const { data, error } = await client
    .from('monitored_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('added_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as MonitoredAsset[] };
}

export async function addAsset(tenantId: string, domain: string): Promise<{ id?: string; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client
    .from('monitored_assets')
    .insert({ tenant_id: tenantId, domain: domain.trim().toLowerCase() })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

// ============================================================
// SCAN RESULTS (LeadClaw / Strix output)
// ============================================================

export async function insertScanResult(
  input: Pick<ScanResult, 'asset_id' | 'tenant_id' | 'tech_stack' | 'open_ports' | 'dns_records' | 'headers' | 'scan_source' | 'duration_ms'>
): Promise<{ id?: string; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client
    .from('scan_results')
    .insert({
      asset_id: input.asset_id,
      tenant_id: input.tenant_id,
      tech_stack: input.tech_stack ?? [],
      open_ports: input.open_ports ?? [],
      dns_records: input.dns_records ?? {},
      headers: input.headers ?? {},
      scan_source: input.scan_source ?? ('combined' as ScanSource),
      duration_ms: input.duration_ms ?? null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // Bump last_scanned_at on the asset
  try {
    await client.from('monitored_assets').update({ last_scanned_at: new Date().toISOString() }).eq('id', input.asset_id);
  } catch {
    // non-fatal
  }

  return { id: data.id };
}

export async function listScansForTenant(tenantId: string, limit = 500): Promise<{ data: ScanResult[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  const { data, error } = await client
    .from('scan_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ScanResult[] };
}

// ============================================================
// CVE MATCHES
// ============================================================

export async function listCvesForTenant(
  tenantId: string,
  opts?: { status?: CveMatchStatus; severity?: CveSeverity }
): Promise<{ data: CveMatch[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  let q = client.from('cve_matches').select('*').eq('tenant_id', tenantId).order('first_detected_at', { ascending: false });
  if (opts?.status) q = q.eq('status', opts.status);
  if (opts?.severity) q = q.eq('severity', opts.severity);

  const { data, error } = await q;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as CveMatch[] };
}

export async function upsertCveMatch(row: Omit<CveMatch, 'id' | 'first_detected_at' | 'updated_at' | 'resolved_at'> & { resolved_at?: string | null }): Promise<{ id?: string; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client
    .from('cve_matches')
    .upsert(
      {
        tenant_id: row.tenant_id,
        asset_id: row.asset_id ?? null,
        cve_id: row.cve_id,
        severity: row.severity,
        cvss_score: row.cvss_score ?? null,
        tech_match: row.tech_match ?? {},
        status: row.status,
        description: row.description ?? null,
        cve_references: row.cve_references ?? [],
      },
      { onConflict: 'tenant_id,cve_id,asset_id' }
    )
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateCveMatchStatus(id: string, status: CveMatchStatus): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const patch: Partial<CveMatch> = { status, updated_at: new Date().toISOString() };
  if (status === 'resolved') patch.resolved_at = new Date().toISOString();

  const { error } = await client.from('cve_matches').update(patch).eq('id', id);
  if (error) return { error: error.message };
  return {};
}

export async function getCveCountsForTenant(tenantId: string): Promise<{
  total: number;
  byStatus: Record<CveMatchStatus, number>;
  bySeverity: Record<CveSeverity, number>;
}> {
  const { data } = await listCvesForTenant(tenantId);
  const byStatus: Record<CveMatchStatus, number> = { new: 0, acked: 0, resolved: 0 };
  const bySeverity: Record<CveSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const r of data) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
  }
  return { total: data.length, byStatus, bySeverity };
}

// ============================================================
// API KEYS (SHA-256 HASHED, NEVER STORE RAW)
// Raw key format: sk_live_[base64url(32 random bytes)]
// Stored: key_hash = sha256(raw_key), key_prefix = first 16 chars of raw
// ============================================================

const TIER_LIMITS: Record<TenantTier, number> = {
  starter: TENANT_TIER_RATE_LIMITS_DAILY?.starter ?? 100,
  growth: TENANT_TIER_RATE_LIMITS_DAILY?.growth ?? 2500,
  enterprise: TENANT_TIER_RATE_LIMITS_DAILY?.enterprise ?? 25000,
};

function randomBytesBase64Url(n: number): string {
  if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
    const buf = new Uint8Array(n);
    globalThis.crypto.getRandomValues(buf);
    let bin = '';
    for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
    return nodeCrypto.randomBytes(n).toString('base64url');
  }
  throw new Error('No secure RNG available for API key generation');
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  if (typeof globalThis.crypto !== 'undefined' && 'subtle' in globalThis.crypto) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
    return nodeCrypto.createHash('sha256').update(input).digest('hex');
  }
  throw new Error('No SHA-256 implementation available');
}

export async function createApiKey(
  tenantId: string,
  tier: TenantTier,
  label?: string | null
): Promise<{ data?: CreatedApiKey; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const raw = 'sk_live_' + randomBytesBase64Url(32);
  const hashHex = await sha256Hex(raw);
  const prefix = raw.slice(0, 16);

  const { data, error } = await client
    .from('api_keys')
    .insert({
      tenant_id: tenantId,
      key_hash: Buffer.from(hashHex, 'hex'),
      key_prefix: prefix,
      label: label ?? null,
      tier,
      rate_limit_daily: TIER_LIMITS[tier],
    })
    .select('id, key_prefix')
    .single();

  if (error) return { error: error.message };
  return {
    data: {
      id: data.id,
      raw_key: raw,   // shown ONCE
      key_prefix: data.key_prefix,
    },
  };
}

/**
 * Look up an API key by raw key. Returns the full ApiKey row if valid (not revoked).
 * Uses: sha256(raw_key) = key_hash equality check.
 */
export async function resolveApiKey(rawKey: string): Promise<{ data?: ApiKey & { tenant_tier: TenantTier }; error?: string }> {
  if (!rawKey || typeof rawKey !== 'string') return { error: 'Invalid key' };
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const hashHex = await sha256Hex(rawKey);
  const hashBytes = Buffer.from(hashHex, 'hex');

  const { data, error } = await client
    .from('api_keys')
    .select('*, tenant:tenant_id(tier)')
    .eq('key_hash', hashBytes)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'Key not found' };

  const tRow = (data as unknown as { tenant?: { tier: TenantTier } | null }).tenant;
  const tier: TenantTier = (tRow?.tier ?? data.tier ?? 'starter') as TenantTier;
  const row: ApiKey = {
    id: data.id,
    tenant_id: data.tenant_id,
    key_hash: data.key_hash,
    key_prefix: data.key_prefix,
    label: data.label,
    tier: data.tier,
    rate_limit_daily: data.rate_limit_daily,
    created_at: data.created_at,
    last_used_at: data.last_used_at,
    revoked_at: data.revoked_at,
  };
  return { data: { ...row, tenant_tier: tier } };
}

export async function revokeApiKey(id: string): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };
  const { error } = await client
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  return {};
}

// ============================================================
// USAGE LOG + RATE LIMITING
// ============================================================

export async function writeUsageLog(input: {
  api_key_id?: string | null;
  tenant_id?: string | null;
  endpoint: string;
  method?: string | null;
  status_code?: number | null;
  response_ms?: number | null;
  client_ip?: string | null;
  // AI groundwork (0005)
  action_type?: string | null;
  client_identifier?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  token_count?: number | null;
  cost_usd?: number | null;
}): Promise<{ id?: number; error?: string }> {
  const client = getClient();
  if (!client) return { error: 'DB not configured' };

  const { data, error } = await client
    .from('usage_log')
    .insert({
      api_key_id: input.api_key_id ?? null,
      tenant_id: input.tenant_id ?? null,
      endpoint: input.endpoint,
      method: input.method ?? null,
      status_code: input.status_code ?? null,
      response_ms: input.response_ms ?? null,
      client_ip: input.client_ip ?? null,
      action_type: input.action_type ?? null,
      client_identifier: input.client_identifier ?? null,
      tokens_in: input.tokens_in ?? null,
      tokens_out: input.tokens_out ?? null,
      token_count:
        input.token_count ??
        (input.tokens_in != null || input.tokens_out != null
          ? (input.tokens_in ?? 0) + (input.tokens_out ?? 0)
          : null),
      cost_usd: input.cost_usd ?? null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  if (input.api_key_id) {
    // best-effort touch last_used_at
    try {
      await client.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', input.api_key_id);
    } catch {
      /* ignore */
    }
  }
  return { id: (data as unknown as { id: number }).id };
}

/**
 * Count rows in usage_log for api_key_id during the rolling window.
 * Default window = today (00:00 local DB TZ to now). Pass windowSeconds for rolling.
 */
export async function countUsageSince(
  apiKeyId: string,
  windowSeconds?: number
): Promise<{ count: number; error?: string }> {
  const client = getClient();
  if (!client) return { count: 0, error: 'DB not configured' };

  const since = windowSeconds
    ? new Date(Date.now() - windowSeconds * 1000).toISOString()
    : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const { count, error } = await client
    .from('usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('called_at', since);

  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0 };
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  reset: string; // ISO timestamp for when the window rolls over
}

export async function checkRateLimitByKey(
  resolvedKey: { id: string; tier: TenantTier; rate_limit_daily: number }
): Promise<RateLimitResult> {
  const limit = resolvedKey.rate_limit_daily || TIER_LIMITS[resolvedKey.tier];
  const { count, error } = await countUsageSince(resolvedKey.id);
  const used = error ? 0 : count;
  const resetMidnight = new Date();
  resetMidnight.setHours(24, 0, 0, 0);
  return {
    allowed: used < limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    reset: resetMidnight.toISOString(),
  };
}

export async function listApiKeysForTenant(tenantId: string): Promise<{ data: ApiKey[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  const { data, error } = await client
    .from('api_keys')
    .select('id, tenant_id, key_prefix, label, tier, rate_limit_daily, created_at, last_used_at, revoked_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ApiKey[] };
}

export async function listUsageForTenant(tenantId: string, limit = 500): Promise<{ data: UsageLog[]; error?: string }> {
  const client = getClient();
  if (!client) return { data: [] };

  const { data, error } = await client
    .from('usage_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('called_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as UsageLog[] };
}

// ============================================================
// AI USAGE RATE-LIMITING GROUNDWORK
// Infrastructure only. Nothing calls these yet — future AI-assisted
// features should call checkAiRateLimit() BEFORE running a model
// call and logAiUsage() AFTER it completes.
//
//   const gate = await checkAiRateLimit({
//     clientIdentifier: user.email,
//     actionType: 'chat_completion',
//     maxCallsPerDay: 25,
//     maxCostUsdPerDay: 0.5,
//   });
//   if (!gate.allowed) return tooManyRequests();
//   ... run AI call ...
//   await logAiUsage({ clientIdentifier, actionType, tokensIn, tokensOut, costUsd });
// ============================================================

export interface AiRateLimitOptions {
  /** Who is calling: email, api-key prefix, hashed session id... */
  clientIdentifier: string;
  /** What they are doing: 'chat_completion', 'summarize', 'embedding'... */
  actionType: string;
  /** Max allowed calls in the rolling window (default window = 24h). */
  maxCallsPerDay?: number;
  /** Optional spend ceiling in USD for the same window. */
  maxCostUsdPerDay?: number;
  /** Rolling window length in seconds (default 86400 = 24h). */
  windowSeconds?: number;
}

export interface AiRateLimitResult extends RateLimitResult {
  /** USD already spent by this identifier+action inside the window. */
  costUsedUsd: number;
}

/**
 * Check whether an AI action may proceed for a client identifier.
 * Counts both call volume and (optionally) accumulated estimated cost.
 * Fails OPEN if the DB is unreachable so infrastructure issues never
 * hard-block unrelated features — flip to fail-closed per feature if needed.
 */
export async function checkAiRateLimit(opts: AiRateLimitOptions): Promise<AiRateLimitResult> {
  const windowSeconds = opts.windowSeconds ?? 86400;
  const callLimit = opts.maxCallsPerDay ?? Number.POSITIVE_INFINITY;

  const fallbackReset = new Date(Date.now() + windowSeconds * 1000).toISOString();
  const client = getClient();
  if (!client) {
    console.warn('[AI-RATELIMIT] DB not configured — failing open');
    return { allowed: true, limit: 0, used: 0, remaining: 0, reset: fallbackReset, costUsedUsd: 0 };
  }

  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const [callRes, costRes] = await Promise.all([
    client
      .from('usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('client_identifier', opts.clientIdentifier)
      .eq('action_type', opts.actionType)
      .gte('called_at', since),
    opts.maxCostUsdPerDay != null
      ? client
          .from('usage_log')
          .select('cost_usd')
          .eq('client_identifier', opts.clientIdentifier)
          .eq('action_type', opts.actionType)
          .gte('called_at', since)
      : null,
  ]);

  if (callRes.error) {
    console.error('[AI-RATELIMIT] count query failed:', callRes.error.message);
    // fail open on infra errors
    return { allowed: true, limit: 0, used: 0, remaining: 0, reset: fallbackReset, costUsedUsd: 0 };
  }

  const used = callRes.count ?? 0;

  let costUsedUsd = 0;
  if (costRes && !costRes.error && costRes.data) {
    costUsedUsd = costRes.data.reduce(
      (sum, row) => sum + (typeof row.cost_usd === 'number' ? row.cost_usd : 0),
      0
    );
  }

  const overCalls = used >= callLimit;
  const overCost =
    opts.maxCostUsdPerDay != null ? costUsedUsd >= opts.maxCostUsdPerDay : false;

  return {
    allowed: !overCalls && !overCost,
    limit: Number.isFinite(callLimit) ? callLimit : 0,
    used,
    remaining: Math.max(0, (Number.isFinite(callLimit) ? callLimit : used) - used),
    reset: new Date(Date.now() + windowSeconds * 1000).toISOString(),
    costUsedUsd,
  };
}

/**
 * Record one completed AI action. Best-effort: failures are logged,
 * never thrown — telemetry must not break the caller's response.
 */
export async function logAiUsage(input: {
  clientIdentifier: string;
  actionType: string;
  endpoint?: string;
  tenantId?: string | null;
  apiKeyId?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  costUsd?: number | null;
  statusCode?: number | null;
}): Promise<void> {
  try {
    const result = await writeUsageLog({
      endpoint: input.endpoint ?? `ai:${input.actionType}`,
      action_type: input.actionType,
      client_identifier: input.clientIdentifier,
      tenant_id: input.tenantId ?? null,
      api_key_id: input.apiKeyId ?? null,
      tokens_in: input.tokensIn ?? null,
      tokens_out: input.tokensOut ?? null,
      cost_usd: input.costUsd ?? null,
      status_code: input.statusCode ?? 200,
    });
    if (result.error) {
      console.warn('[AI-USAGE] log failed:', result.error);
    }
  } catch (err) {
    console.warn('[AI-USAGE] log threw:', err);
  }
}
