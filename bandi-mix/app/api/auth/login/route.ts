import { validateLoginInput } from '@/lib/auth/validateUser';
import { signJwt } from '@/lib/auth/jwt';
import { errorResponse } from '@/lib/auth/error';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const valid = validateLoginInput({ email, password });
    if (!valid.valid) {
      return errorResponse(400, valid.message!);
    }
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(401, 'Hibás email vagy jelszó.');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return errorResponse(401, 'Hibás email vagy jelszó.');
    }
    const token = signJwt({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return errorResponse(500, 'Szerverhiba.');
  }
}
