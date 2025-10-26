import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId: string;
    stack?: string;
  };
}

export const errorHandler = (
  err: AppError | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode: number = err instanceof ApiError ? err.statusCode : (err.statusCode || 500);
  
  const errorResponse: ErrorResponse = err instanceof ApiError 
    ? {
        success: false,
        error: err.toJSON()
      }
    : {
        success: false,
        error: {
          message: err.message || 'Internal Server Error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          requestId: 'unknown',
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
      };

  // Log error details
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};