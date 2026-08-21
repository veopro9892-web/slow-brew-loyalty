import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SESSION_COOKIE = 'slowbrew_admin_session';
const ADMIN_SESSION_VALUE = 'authenticated';

export function getAdminPin(): string {
  return process.env.ADMIN_PIN || '9892';
}

export function isAdminSession(req: NextRequest): boolean {
  return req.cookies.get(ADMIN_SESSION_COOKIE)?.value === ADMIN_SESSION_VALUE;
}

export function createAdminSession(): NextResponse {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, ADMIN_SESSION_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return res;
}

export function destroyAdminSession(): NextResponse {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

/**
 * Middleware-style check: returns NextResponse error if not admin, or null if OK.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

