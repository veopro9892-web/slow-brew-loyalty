import { destroyAdminSession } from '@/lib/admin-auth';

export async function POST() {
  return destroyAdminSession();
}
