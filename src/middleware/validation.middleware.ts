/**
 * Request Validation Middleware
 * Handles request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';
import logger from '../utils/logger';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validate request using Zod schemas
 */
export function validateRequest(schemas: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          const errors = bodyResult.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }));
          
          throw ApiError.badRequest(`Request body validation failed: ${errors.map(e => e.message).join(', ')}`);
        }
        req.body = bodyResult.data;
      }

      // Validate query parameters
      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          const errors = queryResult.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }));
          
          throw ApiError.badRequest(`Query parameters validation failed: ${errors.map(e => e.message).join(', ')}`);
        }
        req.query = queryResult.data as any;
      }

      // Validate route parameters
      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          const errors = paramsResult.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }));
          
          throw ApiError.badRequest(`Route parameters validation failed: ${errors.map(e => e.message).join(', ')}`);
        }
        req.params = paramsResult.data as any;
      }

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        logger.error('Request validation failed:', { errors });
        next(ApiError.badRequest(`Request validation failed: ${errors.map(e => e.message).join(', ')}`));
      } else {
        logger.error('Validation middleware error:', error);
        next(error);
      }
    }
  };
}

/**
 * Validate only request body
 */
export function validateBody(schema: ZodSchema) {
  return validateRequest({ body: schema });
}

/**
 * Validate only query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validateRequest({ query: schema });
}

/**
 * Validate only route parameters
 */
export function validateParams(schema: ZodSchema) {
  return validateRequest({ params: schema });
}

// Export validation middleware instance
export const validationMiddleware = {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
};