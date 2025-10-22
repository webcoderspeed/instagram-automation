/**
 * Response Builder Utilities
 * Provides standardized functions for building API responses
 */

import { 
  ApiResponse, 
  SuccessResponse, 
  ErrorResponse, 
  ApiError, 
  ApiMeta,
  PaginatedApiResponse 
} from '../types/api.types';

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiMeta
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  error: ApiError,
  meta?: ApiMeta
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Creates a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  options?: {
    requestId?: string;
    timestamp?: string;
    version?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  }
): PaginatedApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNext: pagination.page < pagination.totalPages,
        hasPrev: pagination.page > 1
      },
      requestId: options?.requestId ?? 'unknown',
      timestamp: options?.timestamp ?? new Date().toISOString(),
      version: options?.version ?? '1.0.0',
      ...(options?.rateLimit && { rateLimit: options.rateLimit })
    }
  };
}

/**
 * Creates a simple success response with message
 */
export function createMessageResponse(
  message: string,
  data?: Record<string, unknown>
): SuccessResponse<{ message: string } & Record<string, unknown>> {
  return createSuccessResponse({
    message,
    ...data
  });
}

/**
 * Creates a response for created resources
 */
export function createCreatedResponse<T>(
  data: T,
  message: string = 'Resource created successfully'
): SuccessResponse<T & { message: string }> {
  return createSuccessResponse({
    ...data as Record<string, unknown>,
    message
  } as T & { message: string });
}

/**
 * Creates a response for updated resources
 */
export function createUpdatedResponse<T>(
  data: T,
  message: string = 'Resource updated successfully'
): SuccessResponse<T & { message: string }> {
  return createSuccessResponse({
    ...data as Record<string, unknown>,
    message
  } as T & { message: string });
}

/**
 * Creates a response for deleted resources
 */
export function createDeletedResponse(
  message: string = 'Resource deleted successfully'
): SuccessResponse<{ message: string }> {
  return createSuccessResponse({ message });
}

/**
 * Utility for building meta information
 */
export function createMeta(options: {
  requestId?: string;
  timestamp?: string;
  version?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
} = {}): ApiMeta {
  return {
    requestId: options.requestId ?? 'unknown',
    timestamp: options.timestamp ?? new Date().toISOString(),
    version: options.version ?? process.env.npm_package_version ?? '1.0.0',
    rateLimit: options.rateLimit
  };
}

/**
 * Helper function to calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    offset: (page - 1) * limit
  };
}

/**
 * Type-safe response wrapper for Express handlers
 */
export function sendResponse<T>(
  res: any,
  statusCode: number,
  response: ApiResponse<T>
): void {
  res.status(statusCode).json(response);
}

/**
 * Quick success response sender
 */
export function sendSuccess<T>(
  res: any,
  data: T,
  statusCode: number = 200,
  meta?: ApiMeta
): void {
  sendResponse(res, statusCode, createSuccessResponse(data, meta));
}

/**
 * Quick error response sender
 */
export function sendError(
  res: any,
  error: any,
  statusCode?: number,
  meta?: ApiMeta
): void {
  const code = statusCode ?? error?.statusCode ?? 500;
  sendResponse(res, code, createErrorResponse(error, meta));
}