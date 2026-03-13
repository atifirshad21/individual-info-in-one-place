export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    public remaining: number,
    public resetAt: Date
  ) {
    super("Daily limit reached", 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ProviderError extends AppError {
  constructor(provider: string, message: string) {
    super(`${provider}: ${message}`, 502, "PROVIDER_ERROR");
    this.name = "ProviderError";
  }
}

export class AuthError extends AppError {
  constructor() {
    super("Authentication required", 401, "AUTH_REQUIRED");
    this.name = "AuthError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof RateLimitError && {
          remaining: error.remaining,
          resetAt: error.resetAt,
        }),
      },
      { status: error.statusCode }
    );
  }
  console.error("Unhandled error:", error);
  return Response.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
}
