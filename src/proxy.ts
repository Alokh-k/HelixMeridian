import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isHrPath = pathname.startsWith('/hr') && pathname !== '/hr/login';
  const isHrApiPath = pathname.startsWith('/api/hr') && pathname !== '/api/hr/login' && pathname !== '/api/hr/logout';

  if (isHrPath || isHrApiPath) {
    const token = request.cookies.get('helix_admin_session')?.value;
    const isValid = token ? await verifySession(token) : false;

    if (!isValid) {
      if (isHrApiPath) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/hr/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/hr/:path*', '/api/hr/:path*'],
};
