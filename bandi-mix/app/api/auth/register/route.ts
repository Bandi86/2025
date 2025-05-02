import { validateRegisterInput } from '@/lib/auth/validateUser';
import { signJwt } from '@/lib/auth/jwt';
import { errorResponse } from '@/lib/auth/error';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';


export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    const valid = validateRegisterInput({ username, email, password });
    if (!valid.valid) {
      return errorResponse(400, valid.message!);
    }
    const existingUser = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return errorResponse(409, 'A felhasználónév vagy email már foglalt.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { username, email, password: hashedPassword },
    });
    const token = signJwt({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    return new Response(JSON.stringify({ token }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return errorResponse(500, 'Szerverhiba.');
  }
}
