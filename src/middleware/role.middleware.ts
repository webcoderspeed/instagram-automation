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
   * Check if user has required permission
   */
  requirePermission(permission: PermissionType) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        const userPermissions = req.user.permissions || [];

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
        if (!req.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        const userPermissions = req.user.permissions || [];

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
        if (!req.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        const userRole = req.user.role;
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

/**
 * Simple route protection levels
 */
export const ProtectionLevels = {
  PUBLIC: 'PUBLIC',
  AUTHENTICATED: 'AUTHENTICATED', 
  VERIFIED_USER: 'VERIFIED_USER',
  ADMIN_ONLY: 'ADMIN_ONLY',
  ANALYTICS_ACCESS: 'ANALYTICS_ACCESS',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  INTEGRATION_MANAGER: 'INTEGRATION_MANAGER',
  CONNECT_ACCOUNT: 'CONNECT_ACCOUNT'
} as const;

export type ProtectionLevel = typeof ProtectionLevels[keyof typeof ProtectionLevels];

/**
 * Create protected route middleware
 */
export const createProtectedRoute = (level: ProtectionLevel) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Public routes - no protection needed
      if (level === ProtectionLevels.PUBLIC) {
        return next();
      }

      // All other levels require authentication
      await new Promise<void>((resolve, reject) => {
        authMiddleware.authenticate(req, res, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Verified user level requires email verification
      if (level === ProtectionLevels.VERIFIED_USER || 
          level === ProtectionLevels.ADMIN_ONLY ||
          level === ProtectionLevels.ANALYTICS_ACCESS ||
          level === ProtectionLevels.CONTENT_MANAGER ||
          level === ProtectionLevels.INTEGRATION_MANAGER ||
          level === ProtectionLevels.CONNECT_ACCOUNT) {
        await new Promise<void>((resolve, reject) => {
          authMiddleware.requireEmailVerified(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Admin only level requires admin role
      if (level === ProtectionLevels.ADMIN_ONLY) {
        if (!req.user || req.user.role !== 'ADMIN') {
          throw ApiError.forbidden('Admin access required');
        }
      }

      // Role-based access for specific features
      if (level === ProtectionLevels.ANALYTICS_ACCESS) {
        if (!req.user?.permissions?.includes(PERMISSIONS.ANALYTICS_READ)) {
          throw ApiError.forbidden('Analytics access required');
        }
      }

      if (level === ProtectionLevels.CONTENT_MANAGER) {
        if (!req.user?.permissions?.includes(PERMISSIONS.POST_CREATE)) {
          throw ApiError.forbidden('Content management access required');
        }
      }

      if (level === ProtectionLevels.INTEGRATION_MANAGER) {
        if (!req.user?.permissions?.includes(PERMISSIONS.WEBHOOK_UPDATE)) {
          throw ApiError.forbidden('Integration management access required');
        }
      }

      if (level === ProtectionLevels.CONNECT_ACCOUNT) {
        if (!req.user?.permissions?.includes(PERMISSIONS.USER_UPDATE)) {
          throw ApiError.forbidden('Account connection access required');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const roleMiddleware = new RoleMiddleware();