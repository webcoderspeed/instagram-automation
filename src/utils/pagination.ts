/**
 * Pagination Utilities
 * Provides standardized functions for handling pagination
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(
  options: PaginationOptions = {}
): { page: number; limit: number; offset: number } {
  const {
    page = 1,
    limit = options.defaultLimit || 10,
    maxLimit = 100
  } = options;

  // Validate and sanitize page
  const validPage = Math.max(1, Math.floor(Number(page)) || 1);
  
  // Validate and sanitize limit
  const validLimit = Math.min(
    maxLimit,
    Math.max(1, Math.floor(Number(limit)) || options.defaultLimit || 10)
  );

  // Calculate offset
  const offset = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    offset
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

/**
 * Create complete pagination result
 */
export function createPaginationResult(
  page: number,
  limit: number,
  total: number
): PaginationResult {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  return {
    page,
    limit,
    offset,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

/**
 * Generate pagination links for API responses
 */
export function generatePaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  total: number,
  queryParams: Record<string, string> = {}
): {
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
} {
  const totalPages = Math.ceil(total / limit);
  const links: Record<string, string> = {};

  // Build query string
  const buildUrl = (targetPage: number): string => {
    const params = new URLSearchParams({
      ...queryParams,
      page: targetPage.toString(),
      limit: limit.toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  // First page link
  if (page > 1) {
    links.first = buildUrl(1);
  }

  // Previous page link
  if (page > 1) {
    links.previous = buildUrl(page - 1);
  }

  // Next page link
  if (page < totalPages) {
    links.next = buildUrl(page + 1);
  }

  // Last page link
  if (page < totalPages) {
    links.last = buildUrl(totalPages);
  }

  return links;
}

/**
 * Validate pagination parameters from request
 */
export function validatePaginationParams(
  page: unknown,
  limit: unknown,
  options: {
    maxLimit?: number;
    defaultLimit?: number;
  } = {}
): { isValid: boolean; errors: string[]; page?: number; limit?: number } {
  const errors: string[] = [];
  let validPage: number | undefined;
  let validLimit: number | undefined;

  // Validate page
  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
      errors.push('Page must be a positive integer');
    } else {
      validPage = pageNum;
    }
  } else {
    validPage = 1;
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit);
    const maxLimit = options.maxLimit || 100;
    
    if (isNaN(limitNum) || limitNum < 1 || !Number.isInteger(limitNum)) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > maxLimit) {
      errors.push(`Limit cannot exceed ${maxLimit}`);
    } else {
      validLimit = limitNum;
    }
  } else {
    validLimit = options.defaultLimit || 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    page: validPage,
    limit: validLimit
  };
}

/**
 * Extract pagination info from database result
 */
export function extractPaginationFromResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): {
  data: T[];
  pagination: PaginationMeta;
  hasMore: boolean;
} {
  return {
    data,
    pagination: calculatePaginationMeta(page, limit, total),
    hasMore: page * limit < total
  };
}

/**
 * Create cursor-based pagination (for large datasets)
 */
export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  previousCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Encode cursor for pagination
 */
export function encodeCursor(value: string | number | Date): string {
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return Buffer.from(stringValue).toString('base64');
}

/**
 * Decode cursor for pagination
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid cursor format');
  }
}