import { NextRequest, NextResponse } from 'next/server';
import { getAdminPin, createAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pin } = body;

  if (!pin || pin !== getAdminPin()) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  return createAdminSession();
}
