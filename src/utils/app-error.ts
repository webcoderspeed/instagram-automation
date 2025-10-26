/**
 * App Error Class
 * Custom error class for application-specific errors
 */

import { ApiError } from './api-error';

/**
 * AppError class - extends ApiError for application-specific error handling
 */
export class AppError extends ApiError {
  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(statusCode, message, code, details, isOperational);
    this.name = 'AppError';
  }

  /**
   * Create a validation error (400)
   */
  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  /**
   * Create a business logic error (400)
   */
  static businessLogic(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, 'BUSINESS_LOGIC_ERROR', details);
  }

  /**
   * Create a resource not found error (404)
   */
  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  /**
   * Create an unauthorized error (401)
   */
  static unauthorized(message: string = 'Unauthorized access'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  /**
   * Create a forbidden error (403)
   */
  static forbidden(message: string = 'Access forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  /**
   * Create a conflict error (409)
   */
  static conflict(message: string, code?: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 409, code || 'CONFLICT_ERROR', details);
  }

  /**
   * Create a rate limit error (429)
   */
  static rateLimit(message: string = 'Rate limit exceeded'): AppError {
    return new AppError(message, 429, 'RATE_LIMIT_ERROR');
  }

  /**
   * Create an external service error (502)
   */
  static externalService(service: string, details?: Record<string, unknown>): AppError {
    return new AppError(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      details
    );
  }
}

export default AppError;