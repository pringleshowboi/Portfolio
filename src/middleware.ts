import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_session';
const ADMIN_ROUTES = ['/admin'];
const PUBLIC_ROUTES = ['/admin/login'];

const isProd = process.env.NODE_ENV === 'production';

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (isProd) {
      throw new Error(
        '[MIDDLEWARE FATAL] Missing ADMIN_JWT_SECRET in production env (Vercel → Project → Settings → Environment Variables). ' +
        'Without this, admin sessions cannot be verified. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    return new TextEncoder().encode('dev-secret-change-me-please-32chars!!');
  }
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return !!payload && (payload as { role?: string }).role === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  if (!isAdminRoute) return NextResponse.next();

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r));
  const isLoginPage = pathname === '/admin/login';

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyToken(token) : false;

  if (valid && isLoginPage) {
    const homeUrl = new URL('/admin/leads', request.url);
    return NextResponse.redirect(homeUrl);
  }

  if (!valid && !isLoginPage && !isPublic) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!valid && pathname === '/admin') {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (valid && pathname === '/admin') {
    const leadsUrl = new URL('/admin/leads', request.url);
    return NextResponse.redirect(leadsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
