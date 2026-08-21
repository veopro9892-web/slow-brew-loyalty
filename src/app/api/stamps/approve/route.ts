import { NextRequest, NextResponse } from 'next/server';
import { approveRequest, denyRequest } from '@/lib/stamp-request';
import { serverAddStamp } from '@/lib/server-db';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const adminError = requireAdmin(request);
  if (adminError) return adminError;

  const body = await request.json();
  const { token, action } = body;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  if (action === 'deny') {
    const req = await denyRequest(token);
    if (!req) {
      return NextResponse.json({ error: 'Request not found or already resolved' }, { status: 404 });
    }
    return NextResponse.json({ success: true, status: 'denied' });
  }

  const req = await approveRequest(token);
  if (!req) {
    return NextResponse.json({ error: 'Request not found or already resolved' }, { status: 404 });
  }

  // Auto-approve: add the stamp to the customer's server record
  const result = await serverAddStamp(req.customerId);

  // Don't leak customerId — only return status
  return NextResponse.json({
    success: true,
    status: 'approved',
    newReward: result.newReward,
  });
}
