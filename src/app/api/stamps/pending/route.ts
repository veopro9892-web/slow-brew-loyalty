import { NextRequest, NextResponse } from 'next/server';
import { getPendingRequests } from '@/lib/stamp-request';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const adminError = requireAdmin(request);
  if (adminError) return adminError;

  const requests = await getPendingRequests();
  return NextResponse.json({ requests });
}
