/**
 * User Routes
 * API routes for user management and profile operations
 */

import { Router } from 'express';
import { roleMiddleware } from '../middleware/role.middleware';
import { validate } from '../validators/common.validator';
import { generalRateLimit } from '../middleware/rate-limit.middleware';
import { UserController } from '../controllers/user.controller';
import { updateProfileSchema, upgradeRoleSchema } from '../validators/user.validator';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const userController = new UserController();

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (Authenticated User with USER_READ permission)
 */
router.get(
  '/profile',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  userController.getProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private (Verified User with USER_UPDATE permission)
 */
router.put(
  '/profile',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updateProfileSchema),
  userController.getProfile // Note: This should be updateProfile method when implemented
);

/**
 * @route   GET /api/users/roles
 * @desc    Get available roles for upgrade
 * @access  Private (Verified User with USER_READ permission)
 */
router.get(
  '/roles',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  userController.getAvailableRoles
);

/**
 * @route   PUT /api/users/role/upgrade
 * @desc    Upgrade user role
 * @access  Private (Verified User with USER_ROLE_CHANGE permission)
 */
router.put(
  '/role/upgrade',
  roleMiddleware.requirePermission(PERMISSIONS.USER_ROLE_CHANGE),
  generalRateLimit.middleware(), // Add rate limiting to prevent abuse
  validate(upgradeRoleSchema),
  userController.upgradeRole
);

// Admin-level user management routes
// TODO: Implement these methods in UserController

/**
 * @route   GET /api/users/list
 * @desc    Get list of all users (Admin only)
 * @access  Private (Admin with USER_LIST permission)
 */
// router.get(
//   '/list',
//   roleMiddleware.requirePermission(PERMISSIONS.USER_LIST),
//   userController.getAllUsers
// );

/**
 * @route   POST /api/users/invite
 * @desc    Invite new user (Admin/Manager only)
 * @access  Private (Admin/Manager with USER_INVITE permission)
 */
// router.post(
//   '/invite',
//   roleMiddleware.requirePermission(PERMISSIONS.USER_INVITE),
//   generalRateLimit.middleware(),
//   userController.inviteUser
// );

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user account (Admin only)
 * @access  Private (Admin with USER_DELETE permission)
 */
// router.delete(
//   '/:userId',
//   roleMiddleware.requirePermission(PERMISSIONS.USER_DELETE),
//   generalRateLimit.middleware(),
//   userController.deleteUser
// );

/**
 * @route   PUT /api/users/:userId/role
 * @desc    Change user role (Admin only)
 * @access  Private (Admin with USER_ROLE_CHANGE permission)
 */
// router.put(
//   '/:userId/role',
//   roleMiddleware.requirePermission(PERMISSIONS.USER_ROLE_CHANGE),
//   generalRateLimit.middleware(),
//   userController.changeUserRole
// );

export default router;