import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Common Validation Utilities
 * 
 * Shared validation schemas and middleware for request validation
 * across all endpoints in the application.
 */

// Common parameter schemas
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).refine((n) => n > 0, { message: 'Page must be positive' }).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).refine((n) => n > 0 && n <= 100, { message: 'Limit must be between 1 and 100' }).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
    filters: z.record(z.string(), z.string()).optional(),
  }),
});

// Date range schema
export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
  }),
}).refine(
  (data) => {
    if (data.query.startDate && data.query.endDate) {
      return new Date(data.query.startDate) <= new Date(data.query.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before end date',
    path: ['query', 'endDate'],
  }
);

// File upload schema
export const fileUploadSchema = z.object({
  body: z.object({
    files: z.array(z.object({
      filename: z.string().min(1, 'Filename is required'),
      mimetype: z.string().regex(/^(image|video)\//, 'Only image and video files are allowed'),
      size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
      buffer: z.instanceof(Buffer).optional(),
      url: z.string().url().optional(),
    })).min(1, 'At least one file is required').max(10, 'Maximum 10 files allowed'),
  }),
});

// Webhook verification schema
export const webhookVerificationSchema = z.object({
  query: z.object({
    'hub.mode': z.literal('subscribe'),
    'hub.challenge': z.string().min(1, 'Challenge is required'),
    'hub.verify_token': z.string().min(1, 'Verify token is required'),
  }),
});

// Generic response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }).optional(),
  }).optional(),
});

/**
 * Validation middleware factory
 * Creates Express middleware for validating requests against Zod schemas
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request against the schema
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });

      // Attach validated data to request object
      req.validatedData = validatedData;
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation error:', {
          url: req.url,
          method: req.method,
          errors: errorMessages,
        });

        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errorMessages,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Handle unexpected errors
      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error during validation',
          code: 'INTERNAL_ERROR',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Optional validation middleware
 * Validates request but doesn't fail if validation errors occur
 */
export const validateOptional = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });

      req.validatedData = validatedData;
    } catch (error) {
      // Log but don't fail the request
      if (error instanceof ZodError) {
        logger.debug('Optional validation failed:', {
          url: req.url,
          method: req.method,
          errors: error.issues,
        });
      }
    }
    
    next();
  };
};

/**
 * Sanitize input middleware
 * Removes potentially dangerous characters from input
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  
  next();
};

// Export types for TypeScript inference
export type IdParamInput = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type WebhookVerificationInput = z.infer<typeof webhookVerificationSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;

// Extend Express Request interface to include validated data
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}