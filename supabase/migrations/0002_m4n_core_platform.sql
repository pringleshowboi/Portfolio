-- ============================================================
-- M4N-CORE PLATFORM SCHEMA
-- tenants (org) -> monitored_assets -> scan_results -> cve_matches
-- tenants -> api_keys -> usage_log
-- RLS enabled on every table. Anon/default policy = deny all.
-- Service role bypasses RLS (used by server code only).
-- ============================================================

-- ============================================================
-- TENANTS (client organizations)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    tier VARCHAR(30) NOT NULL DEFAULT 'starter', -- starter / growth / enterprise
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active / suspended / cancelled
    popia_consent BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_tier ON tenants(tier);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_self_read ON tenants;
CREATE POLICY tenants_self_read ON tenants
    FOR SELECT
    USING (auth.jwt() ->> 'tenant_id' = id::text);

DROP POLICY IF EXISTS tenants_admin_deny ON tenants;
CREATE POLICY tenants_admin_deny ON tenants
    FOR ALL
    USING (false) WITH CHECK (false);

DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

-- ============================================================
-- MONITORED_ASSETS (domains per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS monitored_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(512) NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_scanned_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (tenant_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant ON monitored_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_domain ON monitored_assets(domain);

ALTER TABLE monitored_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assets_tenant_rw ON monitored_assets;
CREATE POLICY assets_tenant_rw ON monitored_assets
    FOR ALL
    USING (auth.jwt() ->> 'tenant_id' = tenant_id::text)
    WITH CHECK (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- ============================================================
-- SCAN_RESULTS (Strix/LeadClaw output per asset)
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES monitored_assets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{name:"Nginx", version:"1.24"}]
    open_ports JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{port:443, service:"https", banner:"..."}]
    dns_records JSONB NOT NULL DEFAULT '{}'::jsonb,
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    scan_source VARCHAR(32) NOT NULL DEFAULT 'leadclaw', -- leadclaw / strix / combined
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_scan_asset ON scan_results(asset_id);
CREATE INDEX IF NOT EXISTS idx_scan_tenant ON scan_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scan_scanned_at ON scan_results(scanned_at DESC);

ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scan_tenant_read ON scan_results;
CREATE POLICY scan_tenant_read ON scan_results
    FOR SELECT
    USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- ============================================================
-- CVE_MATCHES (CVE feed diffed against scan_results.tech_stack)
-- ============================================================
CREATE TABLE IF NOT EXISTS cve_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES monitored_assets(id) ON DELETE SET NULL,
    cve_id VARCHAR(32) NOT NULL,                       -- CVE-2024-12345
    severity VARCHAR(16) NOT NULL DEFAULT 'medium',   -- low / medium / high / critical
    cvss_score NUMERIC(4,2),
    tech_match JSONB NOT NULL DEFAULT '{}'::jsonb,    -- {name:"Nginx", version:"1.24", matched_by:"cpe_match"}
    status VARCHAR(20) NOT NULL DEFAULT 'new',        -- new / acked / resolved
    description TEXT,
    cve_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, cve_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_cve_tenant ON cve_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cve_status ON cve_matches(status);
CREATE INDEX IF NOT EXISTS idx_cve_severity ON cve_matches(severity);
CREATE INDEX IF NOT EXISTS idx_cve_cveid ON cve_matches(cve_id);

ALTER TABLE cve_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cve_tenant_rw ON cve_matches;
CREATE POLICY cve_tenant_rw ON cve_matches
    FOR ALL
    USING (auth.jwt() ->> 'tenant_id' = tenant_id::text)
    WITH CHECK (auth.jwt() ->> 'tenant_id' = tenant_id::text);

DROP TRIGGER IF EXISTS cve_updated_at ON cve_matches;
CREATE TRIGGER cve_updated_at
    BEFORE UPDATE ON cve_matches
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

-- ============================================================
-- API_KEYS (SHA-256 hashed only; never raw)
-- Key format: sk_live_[base64(32 random bytes)] -> show once on creation
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash BYTEA NOT NULL UNIQUE,              -- sha256(raw_key)
    key_prefix VARCHAR(16) NOT NULL,             -- sk_live_xxxx (for lookup hints, never a secret)
    label VARCHAR(128),
    tier VARCHAR(30) NOT NULL DEFAULT 'starter',
    rate_limit_daily INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_apikeys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apikeys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_apikeys_active ON api_keys(revoked_at) WHERE revoked_at IS NULL;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS apikeys_tenant_ro ON api_keys;
CREATE POLICY apikeys_tenant_ro ON api_keys
    FOR SELECT
    USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- ============================================================
-- USAGE_LOG (rate limiting / billing telemetry)
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_log (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint VARCHAR(128) NOT NULL,
    method VARCHAR(16),
    status_code SMALLINT,
    response_ms INTEGER,
    client_ip INET,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_key_time ON usage_log(api_key_id, called_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tenant_time ON usage_log(tenant_id, called_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_called_at ON usage_log(called_at DESC);

ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_tenant_ro ON usage_log;
CREATE POLICY usage_tenant_ro ON usage_log
    FOR SELECT
    USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- ============================================================
-- Rate-limit helper: count today's usage for an api_key
-- ============================================================
CREATE OR REPLACE FUNCTION api_key_daily_usage(p_api_key_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM usage_log
    WHERE api_key_id = p_api_key_id
      AND called_at >= DATE_TRUNC('day', NOW());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- SEED: a demo/sandbox tenant so the /portal templates work
-- ============================================================
INSERT INTO tenants (slug, display_name, contact_email, tier, status, popia_consent) VALUES
    ('m4n-demo', 'M4N Demo Tenant', 'demo@m4n.co.za', 'starter', 'active', true)
ON CONFLICT (slug) DO NOTHING;
