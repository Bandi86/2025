import { randomUUID } from 'crypto';
import { ApiError, NotFoundError } from '../lib/error';
import { getDatabase } from '../db/database';

// User létrehozása
export async function createUser(data: { username: string; email: string; password: string }) {
  const db = await getDatabase();
  const id = randomUUID();
  try {
    const result = await db.run(
      'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      id,
      data.username,
      data.email,
      data.password
    );
    return { id, ...data };
  } catch (err) {
    console.error('User creation error:', err);
    throw new ApiError(500, 'User creation failed');
  }
}

// User bejelentkezése
export async function loginUser(
  username: string,
  password: string
): Promise<{ id: number; username: string; email: string }> {
  const db = await getDatabase();
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) throw new NotFoundError('User not found');
    // Ellenőrizzük a jelszót (itt bcrypt vagy más hash algoritmus használata szükséges)
    if (user.password !== password) throw new ApiError(401, 'Invalid password');
    return { id: user.id, username: user.username, email: user.email };
  } catch (err) {
    throw new ApiError(500, 'Login failed');
  }
}

// User lekérdezése id alapján
export async function getUserById(id: string) {
  const db = await getDatabase();
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  } catch (err) {
    console.error('Get user by ID error:', err);
    throw new ApiError(500, 'User fetch failed');
  }
}

// User frissítése
export async function updateUser(
  id: string,
  data: Partial<{ username: string; email: string; password: string }>
) {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push((data as any)[key]);
  }
  if (fields.length === 0) throw new ApiError(400, 'No data to update');
  values.push(id);

  try {
    const result = await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);
    if (result.changes === 0) throw new NotFoundError('User not found');
    return getUserById(id);
  } catch (err) {
    console.error('Update user error:', err);
    throw new ApiError(500, 'User update failed');
  }
}

// User törlése
export async function deleteUser(id: string) {
  const db = await getDatabase();
  try {
    const result = await db.run('DELETE FROM users WHERE id = ?', id);
    if (result.changes === 0) throw new NotFoundError('User not found');
    return { deleted: true, id };
  } catch (err) {
    console.error('Delete user error:', err);
    throw new ApiError(500, 'User deletion failed');
  }
}

// User keresése email alapján
export async function getUserByEmail(email: string) {
  const db = await getDatabase();
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) throw new NotFoundError('User not found');
    return user;
  } catch (err) {
    // Eredeti hiba továbbdobása, ha NotFoundError
    if (err instanceof NotFoundError) {
      throw err;
    }
    // Egyéb hibáknál logolunk és ApiError-t dobunk
    console.error('Get user by email error:', err);
    throw new ApiError(500, 'User fetch failed');
  }
}

// User keresése username alapján
export async function getUserByUsername(username: string) {
  const db = await getDatabase();
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) throw new NotFoundError('User not found');
    return user;
  } catch (err) {
    // Eredeti hiba továbbdobása, ha NotFoundError
    if (err instanceof NotFoundError) {
      throw err;
    }
    // Egyéb hibáknál logolunk és ApiError-t dobunk
    console.error('Get user by username error:', err);
    throw new ApiError(500, 'User fetch failed');
  }
}

// User keresése username VAGY email alapján
export async function getUserByUsernameOrEmail(usernameOrEmail: string) {
  const db = await getDatabase();
  try {
    // Ha @ jel van benne, akkor email
    const isEmail = usernameOrEmail.includes('@');
    const column = isEmail ? 'email' : 'username';

    const user = await db.get(`SELECT * FROM users WHERE ${column} = ?`, usernameOrEmail);
    if (!user) throw new NotFoundError('User not found');
    return user;
  } catch (err) {
    // Eredeti hiba továbbdobása, ha NotFoundError
    if (err instanceof NotFoundError) {
      throw err;
    }
    // Egyéb hibáknál logolunk és ApiError-t dobunk
    console.error('Get user by username or email error:', err);
    throw new ApiError(500, 'User fetch failed');
  }
}
