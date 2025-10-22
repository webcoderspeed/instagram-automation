import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../utils/api-error';
import { authMiddleware } from '../auth.middleware';
import { roleMiddleware, PermissionType, Permissions } from '../role.middleware';
import { UserRole, UserRoleType } from '../../models/user.model';
import { SubscriptionPlan, SubscriptionPlanType } from '../../models/subscription.model';

/**
 * Protected route configurations
 */
export interface RouteProtection {
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  requiredRole?: UserRoleType;
  requiredPermission?: PermissionType;
  subscriptionLimit?: {
    type: 'maxPosts' | 'maxAutomations' | 'maxConnectedAccounts';
    action?: 'create' | 'update' | 'delete';
  };
  minimumPlan?: SubscriptionPlanType;
}

/**
 * Create a protected route middleware with specified protections
 */
export const protectedRoute = (protection: RouteProtection) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Apply authentication if required
      if (protection.requireAuth !== false) {
        await new Promise<void>((resolve, reject) => {
          authMiddleware.authenticate(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Check email verification if required
      if (protection.requireEmailVerification) {
        await new Promise<void>((resolve, reject) => {
          authMiddleware.requireEmailVerified(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Check role if required
      if (protection.requiredRole) {
        await new Promise<void>((resolve, reject) => {
          roleMiddleware.requireRole(protection.requiredRole!)(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Check permission if required
      if (protection.requiredPermission) {
        await new Promise<void>((resolve, reject) => {
          roleMiddleware.requirePermission(protection.requiredPermission!)(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Check subscription limit if required
      if (protection.subscriptionLimit) {
        await new Promise<void>((resolve, reject) => {
          roleMiddleware.checkUsageLimit(protection.subscriptionLimit!.type)(req, res, (err?: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Check minimum plan if required
      if (protection.minimumPlan && req.subscription) {
        const planHierarchy: Record<string, number> = {
          [SubscriptionPlan.FREE]: 0,
          [SubscriptionPlan.BASIC]: 1,
          [SubscriptionPlan.PRO]: 2,
          [SubscriptionPlan.ENTERPRISE]: 3
        };

        const userPlanLevel = planHierarchy[req.subscription.tier] || 0;
        const requiredPlanLevel = planHierarchy[protection.minimumPlan];

        if (userPlanLevel < requiredPlanLevel) {
          throw new ApiError(403, `This feature requires ${protection.minimumPlan} plan or higher`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Predefined protection levels for common use cases
 */
export const ProtectionLevels = {
  // Public routes (no protection)
  PUBLIC: {},

  // Basic authenticated user
  AUTHENTICATED: {
    requireAuth: true
  },

  // Verified user only
  VERIFIED_USER: {
    requireAuth: true,
    requireEmailVerification: true
  },

  // Admin only
  ADMIN_ONLY: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredRole: UserRole.ADMIN
  },

  // Content management
  CONTENT_MANAGER: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.CONTENT_UPDATE
  },

  // Analytics access
  ANALYTICS_ACCESS: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.ANALYTICS_READ
  },

  // Automation management
  AUTOMATION_MANAGER: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.AUTOMATION_READ
  },

  // User management (admin)
  USER_MANAGER: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.USER_WRITE
  },

  // Integration management
  INTEGRATION_MANAGER: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.INTEGRATION_MANAGE
  },

  // Billing access
  BILLING_ACCESS: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.BILLING_MANAGE
  },

  // Premium features (Pro plan or higher)
  PREMIUM_FEATURE: {
    requireAuth: true,
    requireEmailVerification: true,
    minimumPlan: SubscriptionPlan.PRO
  },

  // Enterprise features
  ENTERPRISE_FEATURE: {
    requireAuth: true,
    requireEmailVerification: true,
    minimumPlan: SubscriptionPlan.ENTERPRISE
  },

  // Post creation with limits
  CREATE_POST: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.CONTENT_CREATE,
    subscriptionLimit: {
      type: 'maxPosts' as const,
      action: 'create' as const
    }
  },

  // Automation creation with limits
  CREATE_AUTOMATION: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.AUTOMATION_CREATE,
    subscriptionLimit: {
      type: 'maxAutomations' as const,
      action: 'create' as const
    }
  },

  // Connect social accounts with limits
  CONNECT_ACCOUNT: {
    requireAuth: true,
    requireEmailVerification: true,
    requiredPermission: Permissions.INTEGRATION_CONNECT,
    subscriptionLimit: {
      type: 'maxConnectedAccounts' as const,
      action: 'create' as const
    }
  }
};

/**
 * Middleware factory for specific route protections
 */
export const createProtectedRoute = (level: keyof typeof ProtectionLevels) => {
  return protectedRoute(ProtectionLevels[level]);
};

/**
 * Quick access middleware functions
 */
export const requireAuthentication = protectedRoute(ProtectionLevels.AUTHENTICATED);
export const requireVerifiedUser = protectedRoute(ProtectionLevels.VERIFIED_USER);
export const requireAdmin = protectedRoute(ProtectionLevels.ADMIN_ONLY);
export const requirePremium = protectedRoute(ProtectionLevels.PREMIUM_FEATURE);
export const requireEnterprise = protectedRoute(ProtectionLevels.ENTERPRISE_FEATURE);

/**
 * Feature-specific middleware
 */
export const canCreatePost = protectedRoute(ProtectionLevels.CREATE_POST);
export const canCreateAutomation = protectedRoute(ProtectionLevels.CREATE_AUTOMATION);
export const canConnectAccount = protectedRoute(ProtectionLevels.CONNECT_ACCOUNT);
export const canManageContent = protectedRoute(ProtectionLevels.CONTENT_MANAGER);
export const canViewAnalytics = protectedRoute(ProtectionLevels.ANALYTICS_ACCESS);
export const canManageAutomation = protectedRoute(ProtectionLevels.AUTOMATION_MANAGER);
export const canManageUsers = protectedRoute(ProtectionLevels.USER_MANAGER);
export const canManageIntegrations = protectedRoute(ProtectionLevels.INTEGRATION_MANAGER);
export const canAccessBilling = protectedRoute(ProtectionLevels.BILLING_ACCESS);