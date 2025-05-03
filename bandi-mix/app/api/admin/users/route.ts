import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/middleware/adminAuth';

export async function GET(req: NextRequest) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  const users = await db.user.findMany({
    select: { id: true, username: true, email: true, isAdmin: true, isPaid: true },
  });
  return new Response(JSON.stringify(users), { status: 200 });
}
