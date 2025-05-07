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
  if (!password || password.length < 8) {
    return { valid: false, message: 'A jelszó legalább 8 karakter legyen.' };
  }
  return { valid: true };
}

export function validateLoginInput({ username, password }: { username: string; password: string }) {
  if (!username || username.length < 3) {
    return { valid: false, message: 'A felhasználónév legalább 3 karakter legyen.' };
  }
  if (!password) {
    return { valid: false, message: 'A jelszó megadása kötelező.' };
  }
  return { valid: true };
}
