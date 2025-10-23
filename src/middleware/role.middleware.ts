/**
 * Role-based Access Control Middleware
 * Consolidated middleware for authentication, permissions, and route protection
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { PERMISSIONS } from '../constants/permissions';
import { authMiddleware } from './auth.middleware';
import logger from '../utils/logger';

// Export permissions for easy access
export const Permissions = PERMISSIONS;
export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

class RoleMiddleware {
  /**
   * Check if user has required permission (includes authentication and email verification)
   */
  requirePermission(permission: PermissionType) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // First ensure user is authenticated
        if (!req.session?.user) {
          // Try to authenticate first
          await new Promise<void>((resolve, reject) => {
            authMiddleware.authenticate(req, res, (err?: unknown) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Ensure email is verified
        if (!req.session?.user?.isEmailVerified) {
          await new Promise<void>((resolve, reject) => {
            authMiddleware.requireEmailVerified(req, res, (err?: unknown) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Check permission
        const userPermissions = req.session?.user?.permissions || [];
        if (!userPermissions.includes(permission)) {
          throw ApiError.forbidden(`Permission required: ${permission}`);
        }

        next();
      } catch (error: unknown) {
        logger.error('Permission check failed:', error);
        next(error);
      }
    };
  }

  /**
   * Check if user has any of the required permissions
   */
  requireAnyPermission(permissions: PermissionType[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.session?.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        const userPermissions = req.session?.user?.permissions || [];

        const hasPermission = permissions.some(permission => 
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          throw ApiError.forbidden(`One of these permissions required: ${permissions.join(', ')}`);
        }

        next();
      } catch (error: unknown) {
        logger.error('Permission check failed:', error);
        next(error);
      }
    };
  }

  /**
   * Check if user has required role
   */
  requireRole(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.session?.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        const userRole = req.session?.user?.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
          throw ApiError.forbidden(`Role required: ${allowedRoles.join(' or ')}`);
        }

        next();
      } catch (error: unknown) {
        logger.error('Role check failed:', error);
        next(error);
      }
    };
  }
}

export const roleMiddleware = new RoleMiddleware();