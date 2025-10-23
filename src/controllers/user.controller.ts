/**
 * User Controller
 * Handles user management operations including role upgrades
 */

import { Request, Response } from 'express';
import { UserModel, UserRoleType } from '../models/user.model';
import { ROLES } from '../constants/permissions';
import { ApiError } from '../utils/api-error';
import { sendSuccess } from '../utils/response-builder';
import { createMeta } from '../utils/response-builder';
import { roleService } from '../services/role.service';

export class UserController {
  private roleService = roleService;

  constructor() {
    this.roleService = roleService;
  }

  /**
   * Get current user profile
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const user = await UserModel.findById(userId).select('-password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      sendSuccess(res, {
        user
      }, 200, createMeta());
    } catch (error) {
      throw error;
    }
  };

  /**
   * Upgrade user role
   * Allows users to upgrade their role with restrictions
   */
  public upgradeRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      const { role } = req.body;

      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      if (!role) {
        throw new ApiError(400, 'Role is required');
      }

      // Define allowed role upgrades
      const ALLOWED_UPGRADE_ROLES: UserRoleType[] = [ROLES.USER, ROLES.MANAGER];
      
      if (!ALLOWED_UPGRADE_ROLES.includes(role)) {
        throw new ApiError(400, 'Invalid role. Only USER and MANAGER roles are allowed for upgrade');
      }

      // Get current user
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if user is trying to downgrade from admin (prevent admin downgrade)
      if (user.role === ROLES.ADMIN) {
        throw new ApiError(403, 'Admin users cannot change their role');
      }

      // Validate role hierarchy - prevent unauthorized upgrades
      if (role === ROLES.MANAGER && user.role === ROLES.USER) {
        // Allow USER to upgrade to MANAGER
        // In a real application, you might want to add additional checks here
        // such as subscription level, approval process, etc.
      } else if (role === ROLES.USER && user.role === ROLES.MANAGER) {
        // Allow MANAGER to downgrade to USER
      } else if (user.role === role) {
        throw new ApiError(400, 'User already has the requested role');
      }

      // Update user role
      user.role = role;
      await user.save();

      // Return updated user without password
      const updatedUser = await UserModel.findById(userId).select('-password');

      sendSuccess(res, {
        user: updatedUser
      }, 200, createMeta());
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get available roles for upgrade
   */
  public getAvailableRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Define available roles based on current role
      let availableRoles: { role: UserRoleType; description: string; canUpgrade: boolean }[] = [];

      if (user.role === ROLES.USER) {
        availableRoles = [
          {
            role: ROLES.USER,
            description: 'Basic user with standard features',
            canUpgrade: false // Current role
          },
          {
            role: ROLES.MANAGER,
            description: 'Manager with additional content management features',
            canUpgrade: true
          }
        ];
      } else if (user.role === ROLES.MANAGER) {
        availableRoles = [
          {
            role: ROLES.USER,
            description: 'Basic user with standard features',
            canUpgrade: true // Can downgrade
          },
          {
            role: ROLES.MANAGER,
            description: 'Manager with additional content management features',
            canUpgrade: false // Current role
          }
        ];
      } else if (user.role === ROLES.ADMIN) {
        availableRoles = [
          {
            role: ROLES.ADMIN,
            description: 'Administrator with full system access',
            canUpgrade: false // Current role, cannot change
          }
        ];
      }

      sendSuccess(res, {
        currentRole: user.role,
        availableRoles
      }, 200, createMeta());
    } catch (error) {
      throw error;
    }
  };
}