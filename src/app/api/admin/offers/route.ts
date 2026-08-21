import { NextRequest, NextResponse } from 'next/server';
import { serverGetOffers, serverUpsertOffer, serverDeleteOffer } from '@/lib/server-db';
import { requireAdmin } from '@/lib/admin-auth';
import { Offer } from '@/lib/types';

export async function GET(request: NextRequest) {
  const adminError = requireAdmin(request);
  if (adminError) return adminError;

  const offers = await serverGetOffers();
  return NextResponse.json({ offers });
}

export async function POST(request: NextRequest) {
  const adminError = requireAdmin(request);
  if (adminError) return adminError;

  const body = await request.json();
  const { action, offer, level } = body;

  if (action === 'delete' && typeof level === 'number') {
    const offers = await serverDeleteOffer(level);
    return NextResponse.json({ offers });
  }

  if (offer?.level && offer?.title) {
    const offers = await serverUpsertOffer(offer as Offer);
    return NextResponse.json({ offers });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
