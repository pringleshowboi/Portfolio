-- ============================================================
-- LEADS ENRICHMENT + SCRAPE RUNS (M4N CRM-side)
-- Apollo-style B2B lead enrichment columns + GitHub Actions cron observability
-- ============================================================

-- 10 new CRM/enrichment columns on leads — all nullable, safe idempotent ALTERs
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS company_name   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone          VARCHAR(50),
    ADD COLUMN IF NOT EXISTS website        VARCHAR(512),
    ADD COLUMN IF NOT EXISTS industry       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS region         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source_url     TEXT,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS data_quality   SMALLINT,
    ADD COLUMN IF NOT EXISTS enrichment     JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Dedup + lookup indexes
CREATE INDEX IF NOT EXISTS idx_leads_company   ON leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_phone     ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_website   ON leads(website);
CREATE INDEX IF NOT EXISTS idx_leads_region    ON leads(region);
CREATE INDEX IF NOT EXISTS idx_leads_industry  ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_quality   ON leads(data_quality DESC NULLS LAST);

-- ============================================================
-- SCRAPE_RUNS — GHA / cron-job observability table
-- Each row = 1 Places API / directory scrape batch
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_runs (
    id          BIGSERIAL PRIMARY KEY,
    source      VARCHAR(64) NOT NULL,     -- e.g. 'places_api', 'cape_town_info', 'yellowpages_za', 'bizboostza', 'nearmesa', 'cylex', 'cipc_lookup'
    region      VARCHAR(100),             -- e.g. 'Cape Town', 'Johannesburg'
    industry    VARCHAR(100),             -- optional filter used
    query_text  TEXT,                     -- the actual search string / URL pattern (debug)
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ,
    duration_ms INTEGER,
    found_cnt   INT NOT NULL DEFAULT 0,   -- raw candidates pulled
    new_cnt     INT NOT NULL DEFAULT 0,   -- actually inserted (after dedup by website/phone)
    dedup_cnt   INT NOT NULL DEFAULT 0,   -- skipped: matched existing lead
    verified_cnt INT NOT NULL DEFAULT 0,  -- emails that passed verify step
    errored_cnt INT NOT NULL DEFAULT 0,
    errors      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of {row, msg, url}
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb   -- arbitrary: gh-run-id, source commit, quota-used, etc
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_source  ON scrape_runs(source, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_region  ON scrape_runs(region, started_at DESC);

ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scraper_runs_admin_deny ON scrape_runs;
CREATE POLICY scraper_runs_admin_deny ON scrape_runs
    FOR ALL
    USING (false) WITH CHECK (false);   -- server/service-role only
