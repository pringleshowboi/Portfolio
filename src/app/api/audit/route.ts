import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import tls from 'node:tls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Lightweight compliance-snapshot check: DNS records, TLS cert,
// email spoofing protection (SPF/DMARC) and security headers.
// Read-only lookups of public data. No port scanning, no probing
// beyond a single standard TLS handshake on 443 + one page fetch.
// ============================================================

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9_-]{1,63}(?<!-))+$/;

function sanitizeDomain(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.split('/')[0];
  d = d.replace(/:\d+$/, '');
  if (!HOSTNAME_RE.test(d)) return null;
  // Reject obvious non-public targets
  if (
    d === 'localhost' ||
    d.endsWith('.localhost') ||
    d.endsWith('.local') ||
    d.endsWith('.internal') ||
    /^(10|127)\./.test(d) ||
    /^192\.168\./.test(d) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(d)
  ) {
    return null;
  }
  return d;
}

interface DnsSummary {
  A: string[];
  NS: string[];
  MX: string[];
  TXT: string[];
}

async function checkDns(domain: string): Promise<DnsSummary> {
  const summary: DnsSummary = { A: [], NS: [], MX: [], TXT: [] };

  const tasks: Array<[keyof DnsSummary, Promise<string[]>]> = [
    ['A', dns.resolve4(domain)],
    ['NS', dns.resolveNs(domain)],
    [
      'MX',
      dns
        .resolveMx(domain)
        .then((mx) =>
          mx.map((m) => (m.exchange ? `${m.priority} ${m.exchange}` : `${m.priority} NULL_MX`))
        ),
    ],
    ['TXT', dns.resolveTxt(domain).then((entries) => entries.map((e) => e.join('')))],
  ];

  await Promise.all(
    tasks.map(async ([key, p]) => {
      try {
        summary[key] = (await p).slice(0, 10);
      } catch {
        summary[key] = [];
      }
    })
  );

  return summary;
}

interface TlsSummary {
  reachable: boolean;
  authorized: boolean;
  authorizationError: string | null;
  issuer: string | null;
  subject: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
}

// TLS distinguished names arrive as nested string/object trees — flatten to one readable value.
function dnameValue(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    for (const item of v) {
      const s = dnameValue(item);
      if (s) return s;
    }
    return null;
  }
  if (v && typeof v === 'object') {
    for (const item of Object.values(v as Record<string, unknown>)) {
      const s = dnameValue(item);
      if (s) return s;
    }
  }
  return null;
}

function checkTls(domain: string, timeoutMs = 6000): Promise<TlsSummary> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: TlsSummary) => {
      if (!settled) {
        settled = true;
        try {
          socket.destroy();
        } catch {
          /* ignore */
        }
        resolve(result);
      }
    };

    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      rejectUnauthorized: false, // inspect even invalid/expired certs honestly
      timeout: timeoutMs,
    });

    socket.once('secureConnect', () => {
      try {
        const cert = socket.getPeerCertificate();
        if (!cert || Object.keys(cert).length === 0) {
          finish({
            reachable: true,
            authorized: false,
            authorizationError: 'No certificate presented',
            issuer: null,
            subject: null,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
          });
          return;
        }
        const validTo = typeof cert.valid_to === 'string' ? cert.valid_to : null;
        let daysRemaining: number | null = null;
        if (validTo) {
          const expiry = new Date(validTo).getTime();
          if (!Number.isNaN(expiry)) {
            daysRemaining = Math.ceil((expiry - Date.now()) / 86_400_000);
          }
        }
        const issuerObj = cert.issuer as unknown as Record<string, unknown> | undefined;
        const subjectObj = cert.subject as unknown as Record<string, unknown> | undefined;
        finish({
          reachable: true,
          authorized: socket.authorized,
          authorizationError: socket.authorized ? null : String(socket.authorizationError ?? 'Certificate not trusted'),
          issuer: issuerObj ? (dnameValue(issuerObj.O) ?? dnameValue(issuerObj.CN)) : null,
          subject: subjectObj ? dnameValue(subjectObj.CN) : null,
          validFrom: typeof cert.valid_from === 'string' ? cert.valid_from : null,
          validTo,
          daysRemaining,
        });
      } catch (err) {
        finish({
          reachable: true,
          authorized: false,
          authorizationError: err instanceof Error ? err.message : 'Certificate inspection failed',
          issuer: null,
          subject: null,
          validFrom: null,
          validTo: null,
          daysRemaining: null,
        });
      }
    });

    socket.once('timeout', () =>
      finish({
        reachable: false,
        authorized: false,
        authorizationError: 'Connection timed out',
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
      })
    );
    socket.once('error', (err: NodeJS.ErrnoException) =>
      finish({
        reachable: false,
        authorized: false,
        authorizationError: err.code ? `${err.code}: ${err.message}` : err.message,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
      })
    );
  });
}

interface EmailAuthSummary {
  spf: boolean;
  dmarc: boolean;
}

async function checkEmailAuth(domain: string, dnsRes: DnsSummary): Promise<EmailAuthSummary> {
  const spf = dnsRes.TXT.some((t) => t.toLowerCase().startsWith('v=spf1'));
  let dmarc = false;
  try {
    const entries = await dns.resolveTxt(`_dmarc.${domain}`);
    dmarc = entries.some((e) => e.join('').toLowerCase().startsWith('v=dmarc1'));
  } catch {
    dmarc = false;
  }
  return { spf, dmarc };
}

interface HeadersSummary {
  reachable: boolean;
  hsts: boolean;
  csp: boolean;
  frameOptions: boolean;
  contentTypeOptions: boolean;
  referrerPolicy: boolean;
}

// One plain page fetch of the public site to read security response headers.
function checkHeaders(domain: string, timeoutMs = 6000): Promise<HeadersSummary> {
  const empty: HeadersSummary = {
    reachable: false,
    hsts: false,
    csp: false,
    frameOptions: false,
    contentTypeOptions: false,
    referrerPolicy: false,
  };
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    fetch(`https://${domain}/`, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'm4n-co-za-compliance-snapshot' },
    })
      .then((res) => {
        clearTimeout(timer);
        const h = res.headers;
        const cspValue = h.get('content-security-policy') ?? '';
        resolve({
          reachable: true,
          hsts: h.has('strict-transport-security'),
          csp: h.has('content-security-policy'),
          frameOptions: h.has('x-frame-options') || cspValue.includes('frame-ancestors'),
          contentTypeOptions: h.has('x-content-type-options'),
          referrerPolicy: h.has('referrer-policy'),
        });
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(empty);
      });
  });
}

function buildLogs(domain: string, dnsRes: DnsSummary, tlsRes: TlsSummary, emailRes: EmailAuthSummary, headersRes: HeadersSummary): string[] {
  const logs: string[] = [];

  const dnsResolved = Object.values(dnsRes).some((arr) => arr.length > 0);
  if (dnsResolved) {
    logs.push(`CHECKING_PUBLIC_DNS_HYGIENE: OK`);
    if (dnsRes.A.length) logs.push(`A_RECORDS: ${dnsRes.A.join(', ')}`);
    else logs.push(`A_RECORDS: NONE FOUND`);
    if (dnsRes.NS.length) logs.push(`NS_RECORDS: ${dnsRes.NS.join(', ')}`);
    if (dnsRes.MX.length) logs.push(`MX_RECORDS: ${dnsRes.MX.join(', ')}`);
    else logs.push(`MX_RECORDS: NONE (no mail exchanger published)`);
    logs.push(`TXT_RECORDS: ${dnsRes.TXT.length} record(s) found`);
  } else {
    logs.push(`CHECKING_PUBLIC_DNS_HYGIENE: FAILED — NO PUBLIC RECORDS FOUND FOR ${domain.toUpperCase()}`);
  }

  if (tlsRes.reachable) {
    if (tlsRes.daysRemaining !== null && tlsRes.daysRemaining < 0) {
      logs.push(`ASSESSING_TLS_POSTURE: EXPIRED CERTIFICATE (${Math.abs(tlsRes.daysRemaining)} days ago)`);
    } else if (tlsRes.authorized) {
      logs.push(
        `ASSESSING_TLS_POSTURE: VALID${tlsRes.daysRemaining !== null ? ` (${tlsRes.daysRemaining} days remaining)` : ''}`
      );
    } else {
      logs.push(`ASSESSING_TLS_POSTURE: INVALID — ${tlsRes.authorizationError ?? 'untrusted certificate'}`);
    }
    if (tlsRes.issuer) logs.push(`CERT_ISSUER: ${tlsRes.issuer}`);
    if (tlsRes.subject) logs.push(`CERT_SUBJECT_CN: ${tlsRes.subject}`);
    if (tlsRes.validTo) logs.push(`CERT_EXPIRY_DATE: ${new Date(tlsRes.validTo).toUTCString()}`);
  } else {
    logs.push(`ASSESSING_TLS_POSTURE: UNREACHABLE — ${tlsRes.authorizationError ?? 'no response on port 443'}`);
  }

  logs.push(`EMAIL_SPOOFING_PROTECTION (SPF): ${emailRes.spf ? 'PRESENT' : 'ABSENT — consider publishing a v=spf1 record'}`);
  logs.push(`DMARC_POLICY (_dmarc.${domain}): ${emailRes.dmarc ? 'PRESENT' : 'ABSENT — publish a DMARC record to protect your domain'}`);

  if (headersRes.reachable) {
    const headerChecks: Array<[string, boolean]> = [
      ['HSTS', headersRes.hsts],
      ['CSP', headersRes.csp],
      ['X-FRAME-OPTIONS', headersRes.frameOptions],
      ['X-CONTENT-TYPE-OPTIONS', headersRes.contentTypeOptions],
      ['REFERRER-POLICY', headersRes.referrerPolicy],
    ];
    const present = headerChecks.filter(([, ok]) => ok).map(([name]) => name);
    logs.push(`REVIEWING_SECURITY_HEADERS: ${present.length}/5 PRESENT${present.length ? ` — ${present.join(', ')}` : ''}`);
  } else {
    logs.push(`REVIEWING_SECURITY_HEADERS: SKIPPED — site did not respond to the page fetch`);
  }

  logs.push('SNAPSHOT_COMPLETE. RESULTS ABOVE REFLECT LIVE CHECKS ONLY.');
  return logs;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const domain = sanitizeDomain((body as { domain?: unknown })?.domain);
  if (!domain) {
    return NextResponse.json(
      { error: 'Enter a valid public domain, e.g. example.co.za' },
      { status: 400 }
    );
  }

  try {
    const overallTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Snapshot timed out')), 15_000)
    );

    const [dnsRes, tlsRes, headersRes] = await Promise.race([
      Promise.all([checkDns(domain), checkTls(domain), checkHeaders(domain)]),
      overallTimeout,
    ]);
    const emailRes = await checkEmailAuth(domain, dnsRes);

    return NextResponse.json({
      data: {
        domain,
        checked_at: new Date().toISOString(),
        dns: dnsRes,
        tls: tlsRes,
        email: emailRes,
        headers: headersRes,
        logs: buildLogs(domain, dnsRes, tlsRes, emailRes, headersRes),
      },
    });
  } catch (err) {
    console.error('[AUDIT] check failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Live check failed. Try again shortly.' },
      { status: 500 }
    );
  }
}
