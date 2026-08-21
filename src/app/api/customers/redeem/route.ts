import { NextRequest, NextResponse } from 'next/server';
import { serverRedeemReward } from '@/lib/server-db';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const adminError = requireAdmin(request);
  if (adminError) return adminError;

  const body = await request.json();
  const { customerId, rewardId } = body;

  if (!customerId || !rewardId) {
    return NextResponse.json({ error: 'customerId and rewardId required' }, { status: 400 });
  }

  const customer = serverRedeemReward(customerId, rewardId);
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customer });
}
