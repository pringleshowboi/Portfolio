// Run: node scripts/run-migrations.cjs
// Executes every .sql file in supabase/migrations/ in lexical order
// via Supabase REST SQL RPC. Uses env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[MIGRATE] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const REST_URL = SUPABASE_URL.replace(/\/$/, '');

async function runSql(sql) {
  const res = await fetch(`${REST_URL}/rest/v1/rpc/pg_sleep`, { method: 'POST' }).catch(() => null);
  // The generic SQL exec endpoint is Project API: rest/v1/ with the `Prefer: params=single-object`
  // pattern — actually Supabase exposes a rpc/exec fn if the sql-editor extension is enabled.
  // Fallback: use the REST batch exec endpoint that all Supabase projects expose:
  return await fetch(`${REST_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'params=single-object',
    },
    body: JSON.stringify({ query: sql }),
  });
}

// Supabase exposes a special `rpc/exec` SQL runner on newer projects, otherwise we fall back
// to issuing individual REST calls per statement is not practical, so use the well-known
// "sql" RPC that the dashboard itself uses when available.
async function execSqlStatements(sqlStatements) {
  const combined = sqlStatements.join('\n\n');

  // Try dashboard SQL exec RPC first
  let r = await fetch(`${REST_URL}/rest/v1/rpc/sql`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: combined }),
  });

  if (r.ok || (r.status !== 404 && r.status !== 401)) {
    return r;
  }

  // Fallback: use the public "exec" RPC if present
  return await fetch(`${REST_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ sql: combined }),
  });
}

(async () => {
  const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`[MIGRATE] Found ${files.length} migration(s) in ${migrationsDir}`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    process.stdout.write(`  → ${file} ... `);
    const resp = await execSqlStatements([sql]);
    const text = await resp.text().catch(() => '');
    if (resp.ok) {
      console.log('OK');
    } else {
      console.log(`FAILED (HTTP ${resp.status})`);
      console.log('  Body:', text.slice(0, 1200));
      process.exit(2);
    }
  }

  console.log('[MIGRATE] All migrations applied successfully.');
})().catch((err) => {
  console.error('[MIGRATE] Fatal:', err && err.message ? err.message : err);
  process.exit(99);
});
