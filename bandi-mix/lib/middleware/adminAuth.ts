import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';

export async function adminAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Nincs token!' }), { status: 401 });
  }
  const token = auth.replace('Bearer ', '');
  const user = verifyJwt(token) as any;
  if (!user || !user.isAdmin) {
    return new Response(JSON.stringify({ error: 'Nincs jogosultság!' }), { status: 403 });
  }
  return user;
}
