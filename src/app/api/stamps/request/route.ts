import { NextRequest, NextResponse } from 'next/server';
import { createRequest } from '@/lib/stamp-request';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId } = body;

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
  }

  // createRequest validates customerId against server DB and rate-limits
  const req = await createRequest(customerId);
  if (!req) {
    return NextResponse.json({ error: 'Invalid customer or too many pending requests' }, { status: 400 });
  }

  // Don't leak customerId in response — only return the token
  return NextResponse.json({ token: req.token, requestId: req.id });
}
