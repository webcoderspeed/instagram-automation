/**
 * Role-based Access Control Middleware
 * Handles user roles, permissions, and subscription-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { UserRole } from '../models/user.model';
import { SubscriptionModel } from '../models/subscription.model';
import logger from '../utils/logger';

// Define permissions for different features
export const Permissions = {
  // User management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Admin permissions
  ADMIN_PANEL: 'admin:panel',
  ADMIN_USERS: 'admin:users',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_SETTINGS: 'admin:settings',
  
  // Content management
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_SCHEDULE: 'content:schedule',
  
  // Automation
  AUTOMATION_CREATE: 'automation:create',
  AUTOMATION_READ: 'automation:read',
  AUTOMATION_UPDATE: 'automation:update',
  AUTOMATION_DELETE: 'automation:delete',
  AUTOMATION_EXECUTE: 'automation:execute',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ADVANCED: 'analytics:advanced',
  
  // Integrations
  INTEGRATION_CONNECT: 'integration:connect',
  INTEGRATION_DISCONNECT: 'integration:disconnect',
  INTEGRATION_MANAGE: 'integration:manage',
  
  // Billing
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];

// Role-based permissions mapping
export const RolePermissions: Record<string, PermissionType[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permissions)
  ],
  [UserRole.MODERATOR]: [
    // Moderator permissions
    Permissions.USER_READ,
    Permissions.CONTENT_CREATE,
    Permissions.CONTENT_READ,
    Permissions.CONTENT_UPDATE,
    Permissions.CONTENT_DELETE,
    Permissions.CONTENT_SCHEDULE,
    Permissions.AUTOMATION_READ,
    Permissions.ANALYTICS_READ,
    Permissions.INTEGRATION_CONNECT,
    Permissions.INTEGRATION_DISCONNECT,
    Permissions.BILLING_READ,
  ],
  [UserRole.USER]: [
    // Basic user permissions
    Permissions.USER_READ,
    Permissions.CONTENT_CREATE,
    Permissions.CONTENT_READ,
    Permissions.CONTENT_UPDATE,
    Permissions.CONTENT_DELETE,
    Permissions.ANALYTICS_READ,
    Permissions.INTEGRATION_CONNECT,
    Permissions.INTEGRATION_DISCONNECT,
    Permissions.BILLING_READ,
  ]
};

// Subscription tier limits
export const SubscriptionLimits = {
  FREE: {
    maxPosts: 10,
    maxAutomations: 1,
    maxConnectedAccounts: 1,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
  },
  BASIC: {
    maxPosts: 100,
    maxAutomations: 5,
    maxConnectedAccounts: 3,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
  },
  PRO: {
    maxPosts: 1000,
    maxAutomations: 20,
    maxConnectedAccounts: 10,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: false,
  },
  ENTERPRISE: {
    maxPosts: -1, // unlimited
    maxAutomations: -1, // unlimited
    maxConnectedAccounts: -1, // unlimited
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
  }
};

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

        const userRole = req.user.role;
        const userPermissions = RolePermissions[userRole] || [];

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

        const userRole = req.user.role;
        const userPermissions = RolePermissions[userRole] || [];

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

  /**
   * Check subscription limits
   */
  requireSubscriptionFeature(feature: keyof typeof SubscriptionLimits.FREE) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        // Get user's subscription
        const subscription = await SubscriptionModel.findById(req.user.id);
        if (!subscription) {
          throw ApiError.forbidden('No active subscription found');
        }

        const subscriptionTier = subscription.plan.toUpperCase() as keyof typeof SubscriptionLimits;
        const limits = SubscriptionLimits[subscriptionTier] || SubscriptionLimits.FREE;

        // Check if feature is available for this subscription tier
        if (feature === 'advancedAnalytics' && !limits.advancedAnalytics) {
          throw ApiError.forbidden('Advanced analytics requires Pro or Enterprise subscription');
        }

        if (feature === 'prioritySupport' && !limits.prioritySupport) {
          throw ApiError.forbidden('Priority support requires Pro or Enterprise subscription');
        }

        if (feature === 'customBranding' && !limits.customBranding) {
          throw ApiError.forbidden('Custom branding requires Enterprise subscription');
        }

        // Attach subscription info to request
        req.subscription = {
          tier: subscriptionTier,
          limits: limits
        };

        next();
      } catch (error: unknown) {
        logger.error('Subscription check failed:', error);
        next(error);
      }
    };
  }

  /**
   * Check usage limits based on subscription
   */
  checkUsageLimit(limitType: 'maxPosts' | 'maxAutomations' | 'maxConnectedAccounts') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw ApiError.unauthorized('User not authenticated');
        }

        // Get user's subscription
        const subscription = await SubscriptionModel.findById(req.user.id);
        if (!subscription) {
          throw ApiError.forbidden('No active subscription found');
        }

        const subscriptionTier = subscription.plan.toUpperCase() as keyof typeof SubscriptionLimits;
        const limits = SubscriptionLimits[subscriptionTier] || SubscriptionLimits.FREE;
        const limit = limits[limitType];

        // -1 means unlimited
        if (limit === -1) {
          next();
          return;
        }

        // Check current usage (this would need to be implemented based on your data models)
        let currentUsage = 0;
        
        switch (limitType) {
          case 'maxPosts':
            // Get user's post count - implement based on your post model
            currentUsage = 0; // placeholder
            break;
          case 'maxAutomations':
            // Get user's automation count - implement based on your automation model
            currentUsage = 0; // placeholder
            break;
          case 'maxConnectedAccounts':
            // Count non-null platform accounts
            const connectedAccounts = req.user.connectedAccounts;
            currentUsage = connectedAccounts ? Object.values(connectedAccounts).filter(account => account !== null && account !== undefined).length : 0;
            break;
        }

        if (currentUsage >= limit) {
          throw ApiError.forbidden(`${limitType} limit reached. Upgrade your subscription to continue.`);
        }

        next();
      } catch (error: unknown) {
        logger.error('Usage limit check failed:', error);
        next(error);
      }
    };
  }

  /**
   * Admin only access
   */
  requireAdmin(req: Request, res: Response, next: NextFunction): void {
    this.requireRole(UserRole.ADMIN)(req, res, next);
  }

  /**
   * Moderator or Admin access
   */
  requireModerator(req: Request, res: Response, next: NextFunction): void {
    this.requireRole([UserRole.ADMIN, UserRole.MODERATOR])(req, res, next);
  }
}

export const roleMiddleware = new RoleMiddleware();