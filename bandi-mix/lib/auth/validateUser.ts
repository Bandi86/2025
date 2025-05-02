// validateUser.ts
// Felhasználói input validáció regisztrációhoz és bejelentkezéshez

export function validateRegisterInput({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) {
  if (!username || username.length < 3) {
    return { valid: false, message: 'A felhasználónév legalább 3 karakter legyen.' };
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { valid: false, message: 'Érvénytelen email cím.' };
  }
  if (!password || password.length < 6) {
    return { valid: false, message: 'A jelszó legalább 6 karakter legyen.' };
  }
  return { valid: true };
}

export function validateLoginInput({ email, password }: { email: string; password: string }) {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { valid: false, message: 'Érvénytelen email cím.' };
  }
  if (!password) {
    return { valid: false, message: 'A jelszó megadása kötelező.' };
  }
  return { valid: true };
}
