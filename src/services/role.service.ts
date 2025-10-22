/**
 * Role and Permission Service
 * Centralized service for managing user roles, permissions, and subscription-based access control
 */

import { UserDocument, UserRole, UserRoleType } from "../models/user.model";
import {
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionPlanType,
} from "../models/subscription.model";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from "../constants/permissions";
import logger from "../utils/logger";

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  requiredPlan?: SubscriptionPlanType;
  currentPlan?: SubscriptionPlanType;
}

export interface SubscriptionLimits {
  maxPlatformAccounts: number;
  maxAutomations: number;
  maxPostsPerMonth: number;
  maxStorageGB: number;
  analyticsRetentionDays: number;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  teamMembers: number;
  advancedAnalytics: boolean;
  bulkOperations: boolean;
}

export interface UsageCheck {
  canPerform: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  reason?: string;
}

class RoleService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user: UserDocument, permission: string): boolean {
    // Map user model roles to permission system roles
    const roleMapping: Record<UserRoleType, keyof typeof ROLE_PERMISSIONS> = {
      [UserRole.ADMIN]: 'admin',
      [UserRole.USER]: 'user',
      [UserRole.MODERATOR]: 'manager'
    };

    const permissionRole = roleMapping[user.role];
    
    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[permissionRole] || [];
    if (rolePermissions.includes(permission as any)) {
      return true;
    }

    // Check user-specific permissions
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: UserDocument, permissions: string[]): boolean {
    return permissions.some((permission) =>
      this.hasPermission(user, permission)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(user: UserDocument, permissions: string[]): boolean {
    return permissions.every((permission) =>
      this.hasPermission(user, permission)
    );
  }

  /**
   * Check if user has a specific role
   */
  hasRole(user: UserDocument, role: string): boolean {
    return user.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: UserDocument, roles: string[]): boolean {
    return roles.includes(user.role);
  }

  /**
   * Check subscription-based permission
   */
  async checkSubscriptionPermission(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    permission: string,
    requiredPlan?: SubscriptionPlanType
  ): Promise<PermissionCheck> {
    // Check basic role permission first
    if (!this.hasPermission(user, permission)) {
      return {
        hasPermission: false,
        reason: "Insufficient role permissions",
      };
    }

    // If no subscription required, allow
    if (!requiredPlan) {
      return { hasPermission: true };
    }

    // Check if user has active subscription
    if (!subscription || !subscription.isActive()) {
      return {
        hasPermission: false,
        reason: "Active subscription required",
        requiredPlan: requiredPlan,
      };
    }

    // Check plan hierarchy
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.BASIC]: 1,
      [SubscriptionPlan.PRO]: 2,
      [SubscriptionPlan.ENTERPRISE]: 3
    };

    const userPlanLevel = planHierarchy[subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      return {
        hasPermission: false,
        reason: "Higher subscription plan required",
        requiredPlan: requiredPlan,
        currentPlan: subscription.plan,
      };
    }

    return { hasPermission: true };
  }

  /**
   * Check usage limits based on subscription
   */
  async checkUsageLimit(
    subscription: SubscriptionDocument | null,
    limitType: keyof SubscriptionLimits,
    currentUsage: number,
    increment: number = 1
  ): Promise<UsageCheck> {
    if (!subscription || !subscription.isActive()) {
      return {
        canPerform: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        reason: "No active subscription",
      };
    }

    const limit = subscription.features[limitType] as number;

    // -1 means unlimited
    if (limit === -1) {
      return {
        canPerform: true,
        currentUsage,
        limit: -1,
        remaining: -1,
      };
    }

    const newUsage = currentUsage + increment;
    const remaining = Math.max(0, limit - currentUsage);

    return {
      canPerform: newUsage <= limit,
      currentUsage,
      limit,
      remaining,
      reason: newUsage > limit ? `${limitType} limit exceeded` : undefined,
    };
  }

  /**
   * Get user's effective permissions (role + user-specific)
   */
  getUserPermissions(user: UserDocument): string[] {
    // Map user model roles to permission system roles
    const roleMapping: Record<UserRoleType, keyof typeof ROLE_PERMISSIONS> = {
      [UserRole.ADMIN]: 'admin',
      [UserRole.USER]: 'user',
      [UserRole.MODERATOR]: 'manager'
    };

    const permissionRole = roleMapping[user.role];
    const rolePermissions = ROLE_PERMISSIONS[permissionRole] || [];
    const userPermissions = user.permissions || [];
    
    // Combine and deduplicate
    return [...new Set([...rolePermissions, ...userPermissions])];
  }

  /**
   * Grant permission to user
   */
  async grantPermission(user: UserDocument, permission: string): Promise<void> {
    if (!user.permissions) {
      user.permissions = [];
    }

    if (!user.permissions.includes(permission)) {
      user.permissions.push(permission);
      await user.save();
      logger.info(`Permission granted: ${permission} to user ${user.email}`);
    }
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(
    user: UserDocument,
    permission: string
  ): Promise<void> {
    if (user.permissions) {
      user.permissions = user.permissions.filter((p) => p !== permission);
      await user.save();
      logger.info(`Permission revoked: ${permission} from user ${user.email}`);
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(user: UserDocument, newRole: string): Promise<void> {
    const oldRole = user.role;
    user.role = newRole as any;
    await user.save();
    logger.info(
      `Role changed: ${oldRole} -> ${newRole} for user ${user.email}`
    );
  }

  /**
   * Check if user can perform action based on role, permissions, and subscription
   */
  async canPerformAction(
    user: UserDocument,
    subscription: SubscriptionDocument | null,
    action: {
      permission: string;
      requiredPlan?: SubscriptionPlanType;
      usageCheck?: {
        type: keyof SubscriptionLimits;
        currentUsage: number;
        increment?: number;
      };
    }
  ): Promise<{
    allowed: boolean;
    reason?: string;
    permissionCheck?: PermissionCheck;
    usageCheck?: UsageCheck;
  }> {
    // Check permission
    const permissionCheck = await this.checkSubscriptionPermission(
      user,
      subscription,
      action.permission,
      action.requiredPlan
    );

    if (!permissionCheck.hasPermission) {
      return {
        allowed: false,
        reason: permissionCheck.reason,
        permissionCheck,
      };
    }

    // Check usage limits if specified
    if (action.usageCheck && subscription) {
      const usageCheck = await this.checkUsageLimit(
        subscription,
        action.usageCheck.type,
        action.usageCheck.currentUsage,
        action.usageCheck.increment
      );

      if (!usageCheck.canPerform) {
        return {
          allowed: false,
          reason: usageCheck.reason,
          permissionCheck,
          usageCheck,
        };
      }

      return {
        allowed: true,
        permissionCheck,
        usageCheck,
      };
    }

    return {
      allowed: true,
      permissionCheck,
    };
  }

  /**
   * Get subscription limits for a plan
   */
  getSubscriptionLimits(plan: SubscriptionPlanType): SubscriptionLimits {
    const limits: Record<SubscriptionPlanType, SubscriptionLimits> = {
      [SubscriptionPlan.FREE]: {
        maxPlatformAccounts: 1,
        maxAutomations: 3,
        maxPostsPerMonth: 30,
        maxStorageGB: 1,
        analyticsRetentionDays: 30,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        webhooks: false,
        teamMembers: 1,
        advancedAnalytics: false,
        bulkOperations: false,
      },
      [SubscriptionPlan.BASIC]: {
        maxPlatformAccounts: 3,
        maxAutomations: 10,
        maxPostsPerMonth: 100,
        maxStorageGB: 5,
        analyticsRetentionDays: 90,
        prioritySupport: false,
        customBranding: false,
        apiAccess: true,
        webhooks: false,
        teamMembers: 3,
        advancedAnalytics: false,
        bulkOperations: true,
      },
      [SubscriptionPlan.PRO]: {
        maxPlatformAccounts: 10,
        maxAutomations: 50,
        maxPostsPerMonth: 500,
        maxStorageGB: 25,
        analyticsRetentionDays: 365,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        webhooks: true,
        teamMembers: 10,
        advancedAnalytics: true,
        bulkOperations: true,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxPlatformAccounts: -1, // unlimited
        maxAutomations: -1, // unlimited
        maxPostsPerMonth: -1, // unlimited
        maxStorageGB: 100,
        analyticsRetentionDays: -1, // unlimited
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        webhooks: true,
        teamMembers: -1, // unlimited
        advancedAnalytics: true,
        bulkOperations: true,
      },
    };

    return limits[plan];
  }

  /**
   * Validate role assignment
   */
  canAssignRole(assignerRole: UserRoleType, targetRole: UserRoleType): boolean {
    // Map user model roles to permission roles for comparison
    const roleMapping: Record<UserRoleType, string> = {
      [UserRole.ADMIN]: ROLES.ADMIN,
      [UserRole.USER]: ROLES.USER,
      [UserRole.MODERATOR]: ROLES.MANAGER
    };

    const assignerPermissionRole = roleMapping[assignerRole];
    const targetPermissionRole = roleMapping[targetRole];

    // Only super admin can assign super admin role (not available in user model)
    if (targetPermissionRole === ROLES.SUPER_ADMIN) {
      return assignerPermissionRole === ROLES.SUPER_ADMIN;
    }

    // Admin can assign admin, manager, user roles
    if (assignerPermissionRole === ROLES.ADMIN) {
      return [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER].includes(targetPermissionRole as any);
    }

    // Manager can assign user roles
    if (assignerPermissionRole === ROLES.MANAGER) {
      return [ROLES.USER].includes(targetPermissionRole as any);
    }

    return false;
  }
}

export const roleService = new RoleService();
export { PERMISSIONS, ROLES, ROLE_PERMISSIONS };