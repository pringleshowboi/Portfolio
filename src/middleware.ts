// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

// The routes you want to protect
export const config = {
  matcher: ['/studio/:path*'],
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    // Example: 'Basic YWRtaW46cGFzc3dvcmQ='
    const authValue = basicAuth.split(' ')[1];
    const [user, password] = atob(authValue).split(':');

    const ADMIN_USER = process.env.ADMIN_USER; // Set in Vercel
    const ADMIN_PASS = process.env.ADMIN_PASS; // Set in Vercel

    // Check against environment variables
    if (user === ADMIN_USER && password === ADMIN_PASS) {
      return NextResponse.next();
    }
  }

  // If authentication fails, prompt the user
  url.pathname = '/api/auth';
  return new NextResponse('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Studio"',
    },
  });
}