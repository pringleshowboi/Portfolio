import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const isProd = process.env.NODE_ENV === 'production';

function assertEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) {
    const msg = `Missing required environment variable: ${name} ${
      isProd ? 'in production env (Vercel → Project → Settings → Environment Variables)' : 'in .env.local'
    }`;
    throw new Error(msg);
  }
}

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (isProd) {
      throw new Error(
        '[AUTH FATAL] Missing ADMIN_JWT_SECRET in production env (Vercel → Project → Settings → Environment Variables). ' +
        'Without this, admin session signing cannot work and all /admin/* routes will crash on SSR with a digest-only error. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    return new TextEncoder().encode('dev-secret-change-me-please-32chars!!');
  }
  if (secret.length < 32) {
    throw new Error(
      `[AUTH FATAL] ADMIN_JWT_SECRET must be at least 32 characters for HS256 security. Current length: ${secret.length}. ` +
      `Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  return new TextEncoder().encode(secret);
}

export function getAdminCredentials(): { user: string; hash: string } {
  const user = process.env.ADMIN_USER;
  const plainPass = process.env.ADMIN_PASS;
  assertEnv('ADMIN_USER', user);
  assertEnv('ADMIN_PASS', plainPass);
  const hash = bcrypt.hashSync(plainPass, 10);
  return { user, hash };
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  try {
    const creds = getAdminCredentials();
    if (username !== creds.user) return false;
    return bcrypt.compare(password, creds.hash);
  } catch (err) {
    console.error('[AUTH] verifyCredentials error (likely missing ADMIN_USER/ADMIN_PASS env vars):', err);
    return false;
  }
}

export async function createSession(secure?: boolean): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({ sub: 'admin', role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Only mark Secure when actually served over HTTPS; browsers drop Secure
    // cookies on plain-HTTP origins (e.g. LAN IPs), which silently breaks login.
    secure: secure ?? isProd,
    sameSite: 'lax',
    path: '/admin',
    maxAge: SESSION_TTL_SECONDS,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;

    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return !!payload && payload.role === 'admin';
  } catch {
    return false;
  }
}
