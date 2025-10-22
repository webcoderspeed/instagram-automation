/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/api-error';
import { AuthenticatedUser } from '../types/user.types';
import logger from '../utils/logger';
import { env } from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

class AuthMiddleware {
  /**
   * Authenticate user using JWT token
   */
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get token from Authorization header or cookies
      let token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        token = req.cookies?.accessToken;
      }

      if (!token) {
        throw ApiError.unauthorized('Access token is required');
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Get user from database
      const user = await UserModel.findById(decoded.userId).select('-password');
      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Check if user is deleted
      if (user.deletedAt) {
        throw ApiError.unauthorized('Account is deactivated');
      }

      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt || new Date(),
        connectedAccounts: user.platformAccounts || []
      } as AuthenticatedUser;

      next();
    } catch (error: unknown) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('JWT verification failed:', error.message);
        next(ApiError.unauthorized('Invalid access token'));
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.error('JWT token expired:', error.message);
        next(ApiError.unauthorized('Access token has expired'));
      } else {
        logger.error('Authentication middleware error:', error);
        next(error);
      }
    }
  }

  /**
   * Check if user has required role
   */
  requireRole(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
          throw ApiError.forbidden('Insufficient permissions');
        }

        next();
      } catch (error: unknown) {
        logger.error('Role check middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Check if user is admin
   */
  requireAdmin(req: Request, res: Response, next: NextFunction): void {
    this.requireRole('admin')(req, res, next);
  }

  /**
   * Check if user has verified email
   */
  requireEmailVerified(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      if (!req.user.isEmailVerified) {
        throw ApiError.forbidden('Email verification required');
      }

      next();
    } catch (error: unknown) {
      logger.error('Email verification middleware error:', error);
      next(error);
    }
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get token from Authorization header or cookies
      let token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        token = req.cookies?.accessToken;
      }

      if (!token) {
        // No token provided, continue without authentication
        next();
        return;
      }

      // Verify JWT token
      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        next();
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // Get user from database
      const user = await UserModel.findById(decoded.userId).select('-password');
      if (user && !user.deletedAt) {
        // Attach user to request
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt || new Date(),
          connectedAccounts: user.platformAccounts || []
        } as AuthenticatedUser;
      }

      next();
    } catch (error: unknown) {
      // For optional auth, we don't fail on token errors
      logger.debug('Optional auth failed:', error);
      next();
    }
  }
}

export const authMiddleware = new AuthMiddleware();

