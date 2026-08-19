-- ============================================================
-- COMMON: moddatetime trigger (auto-updated updated_at columns)
-- ============================================================
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- LEADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'contact',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Server-side only — no anon access, only service_role
DROP POLICY IF EXISTS leads_admin_all ON leads;
CREATE POLICY leads_admin_all ON leads
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- ============================================================
-- STACK_STATUS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS stack_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(255) NOT NULL UNIQUE,
    tier VARCHAR(50) NOT NULL,
    nfr_partner_status VARCHAR(30) NOT NULL DEFAULT 'not_started',
    vendor_url TEXT,
    notes TEXT,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stack_tier ON stack_status(tier);
CREATE INDEX IF NOT EXISTS idx_stack_status ON stack_status(nfr_partner_status);

ALTER TABLE stack_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stack_admin_all ON stack_status;
CREATE POLICY stack_admin_all ON stack_status
    FOR ALL
    USING (false)
    WITH CHECK (false);

DROP TRIGGER IF EXISTS stack_status_updated_at ON stack_status;
CREATE TRIGGER stack_status_updated_at
    BEFORE UPDATE ON stack_status
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

-- Seed initial vendors from the services page
INSERT INTO stack_status (vendor_name, tier, nfr_partner_status, vendor_url, notes) VALUES
    ('Check Point Infinity', 'Track 1', 'active', 'https://www.checkpoint.com', 'Quantum firewall, Harmony endpoint, CloudGuard'),
    ('Splunk SIEM/SOAR', 'Track 1', 'active', 'https://www.splunk.com', 'SIEM, SOAR, ITSI, Observability platform'),
    ('TheHive', 'Track 2', 'not_started', 'https://thehive-project.org', 'Incident response platform'),
    ('Wazuh', 'Track 2', 'not_started', 'https://wazuh.com', 'EDR / XDR platform'),
    ('MISP', 'Track 2', 'not_started', 'https://www.misp-project.org', 'Threat intelligence platform'),
    ('Shuffle SOAR', 'Track 2', 'not_started', 'https://shuffler.io', 'Open source SOAR alternative'),
    ('OpenVAS / Greenbone', 'Track 3', 'not_started', 'https://www.greenbone.net', 'Vulnerability scanning'),
    ('Velociraptor', 'Track 3', 'not_started', 'https://docs.velociraptor.app', 'Digital forensics & IR'),
    ('Grafana', 'Track 3', 'not_started', 'https://grafana.com', 'Dashboards & telemetry')
ON CONFLICT (vendor_name) DO NOTHING;
