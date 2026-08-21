import { NextRequest, NextResponse } from 'next/server';
import { serverCreateCustomer, serverFindCustomerById } from '@/lib/server-db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, name, email } = body;

  if (!customerId || !email) {
    return NextResponse.json({ error: 'customerId and email required' }, { status: 400 });
  }

  // Ensure this customer exists on the server (sync registration)
  let serverCustomer = serverFindCustomerById(customerId);
  if (!serverCustomer) {
    // Customer registered locally but not on server yet — push them
    serverCustomer = serverCreateCustomer(name || 'Unknown', email.toLowerCase());
  }

  return NextResponse.json({ customer: serverCustomer });
}
