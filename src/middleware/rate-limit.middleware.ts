import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from './error.middleware';
import logger from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  middleware() {
    return asyncHandler((req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const now = Date.now();
      
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
      } else {
        this.store[key].count++;
      }

      const { count, resetTime } = this.store[key];
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.maxRequests - count).toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      });

      if (count > this.maxRequests) {
        logger.warn(`Rate limit exceeded for IP: ${key}`);
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        // Set Retry-After header
        res.set('Retry-After', retryAfter.toString());
        
        // Throw ApiError to be handled by error middleware
        const error = ApiError.tooManyRequests(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          { retryAfter }
        );
        throw error;
      }

      next();
    });
  }
}

// Create rate limiters for different endpoints
export const generalRateLimit = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = new RateLimiter(15 * 60 * 1000, 10); // 10 auth requests per 15 minutes
export const webhookRateLimit = new RateLimiter(60 * 1000, 50); // 50 webhook requests per minute

// Specific rate limiters for auth endpoints
export const rateLimitMiddleware = {
  signup: new RateLimiter(60 * 60 * 1000, 5).middleware(), // 5 signups per hour
  login: new RateLimiter(15 * 60 * 1000, 10).middleware(), // 10 login attempts per 15 minutes
  emailVerification: new RateLimiter(60 * 60 * 1000, 3).middleware(), // 3 email verifications per hour
  passwordReset: new RateLimiter(60 * 60 * 1000, 3).middleware(), // 3 password reset attempts per hour
  refreshToken: new RateLimiter(60 * 60 * 1000, 20).middleware(), // 20 token refreshes per hour
};