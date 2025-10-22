/**
 * API Error Class
 * Custom error class for consistent API error handling
 */

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a Bad Request error (400)
   */
  static badRequest(message: string, code?: string, details?: unknown): ApiError {
    return new ApiError(400, message, code, details);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message: string = 'Unauthorized', code?: string, details?: unknown): ApiError {
    return new ApiError(401, message, code, details);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message: string = 'Forbidden', code?: string, details?: unknown): ApiError {
    return new ApiError(403, message, code, details);
  }

  /**
   * Create a Not Found error (404)
   */
  static notFound(message: string = 'Not Found', code?: string, details?: unknown): ApiError {
    return new ApiError(404, message, code, details);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message: string, code?: string, details?: unknown): ApiError {
    return new ApiError(409, message, code, details);
  }

  /**
   * Create an Unprocessable Entity error (422)
   */
  static unprocessableEntity(message: string, code?: string, details?: unknown): ApiError {
    return new ApiError(422, message, code, details);
  }

  /**
   * Create a Too Many Requests error (429)
   */
  static tooManyRequests(message: string = 'Too Many Requests', code?: string, details?: unknown): ApiError {
    return new ApiError(429, message, code, details);
  }

  /**
   * Create an Internal Server error (500)
   */
  static internal(message: string = 'Internal Server Error', code?: string, details?: unknown): ApiError {
    return new ApiError(500, message, code, details);
  }

  /**
   * Create a Service Unavailable error (503)
   */
  static serviceUnavailable(message: string = 'Service Unavailable', code?: string, details?: unknown): ApiError {
    return new ApiError(503, message, code, details);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        message: this.message,
        statusCode: this.statusCode,
        code: this.code,
        details: this.details,
        timestamp: new Date().toISOString()
      }
    };
  }
}