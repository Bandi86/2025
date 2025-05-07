export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message)
  }
}

export function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
