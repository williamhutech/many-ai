import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Handle recovery flow
  if (req.nextUrl.pathname === '/auth/login' && req.nextUrl.hash && req.nextUrl.hash.includes('type=recovery')) {
    return NextResponse.redirect(new URL(`/auth/updatepassword${req.nextUrl.hash}`, req.url));
  }

  // Protected routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}; 