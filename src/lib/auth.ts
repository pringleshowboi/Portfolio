import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET env var is not set');
  }
  return new TextEncoder().encode(secret);
}

export function getAdminCredentials(): { user: string; hash: string } | null {
  const user = process.env.ADMIN_USER;
  const plainPass = process.env.ADMIN_PASS;
  if (!user || !plainPass) return null;
  const hash = bcrypt.hashSync(plainPass, 10);
  return { user, hash };
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const creds = getAdminCredentials();
  if (!creds) return false;
  if (username !== creds.user) return false;
  return bcrypt.compare(password, creds.hash);
}

export async function createSession(): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({ sub: 'admin', role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
