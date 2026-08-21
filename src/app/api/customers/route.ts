import { NextRequest, NextResponse } from 'next/server';
import { serverGetAllCustomers, serverCreateCustomer } from '@/lib/server-db';

export async function GET() {
  const customers = await serverGetAllCustomers();
  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, phone } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  }

  const customer = await serverCreateCustomer(name.trim(), email.trim().toLowerCase(), undefined, phone?.trim());
  return NextResponse.json({ customer });
}
