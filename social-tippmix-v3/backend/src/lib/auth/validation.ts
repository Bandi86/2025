export function validateInputs(
  inputs: Record<string, any>,
  rules: Record<string, (value: any) => boolean>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  let valid = true

  for (const [key, rule] of Object.entries(rules)) {
    if (!rule(inputs[key])) {
      errors.push(`Invalid value for ${key}`)
      valid = false
    }
  }

  return { valid, errors }
}
export function validateUsername(username: string): boolean {
  return typeof username === 'string' && username.length >= 3
}
export function validateEmail(email: string): boolean {
  return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}
export function validatePassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8
}

export function validatePost(post: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  let valid = true

  if (typeof post.title !== 'string' || post.title.length < 3) {
    errors.push('Invalid title')
    valid = false
  }

  if (typeof post.content !== 'string' || post.content.length < 10) {
    errors.push('Invalid content')
    valid = false
  }

  return { valid, errors }
}
