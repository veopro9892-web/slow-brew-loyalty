import { NextRequest, NextResponse } from 'next/server';
import { serverGetAllCustomers, serverCreateCustomer } from '@/lib/server-db';

export async function GET() {
  const customers = serverGetAllCustomers();
  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  }

  const customer = serverCreateCustomer(name.trim(), email.trim().toLowerCase());
  return NextResponse.json({ customer });
}
