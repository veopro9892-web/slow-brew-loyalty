import { NextRequest, NextResponse } from 'next/server';
import { serverAdjustStamps } from '@/lib/server-db';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const adminError = requireAdmin(request);
  if (adminError) return adminError;

  const body = await request.json();
  const { customerId, delta } = body;

  if (!customerId || typeof delta !== 'number') {
    return NextResponse.json({ error: 'customerId and delta required' }, { status: 400 });
  }

  const result = await serverAdjustStamps(customerId, delta);
  if (!result.customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customer: result.customer, newReward: result.newReward });
}
