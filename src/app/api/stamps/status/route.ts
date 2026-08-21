import { NextRequest, NextResponse } from 'next/server';
import { getRequestByCustomerId } from '@/lib/stamp-request';

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
  }

  const req = getRequestByCustomerId(customerId);
  return NextResponse.json({ request: req });
}
