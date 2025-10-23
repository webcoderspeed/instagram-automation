/**
 * Settings Routes
 * API routes for user settings management
 */

import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../validators/common.validator';
import {
  updateProfileSettingsSchema,
  updateNotificationSettingsSchema,
  updatePrivacySettingsSchema,
  updateAutomationSettingsSchema,
  updateBillingSettingsSchema,
  updateSecuritySettingsSchema,
  updateSettingsSchema,
  resetSettingsSchema,
} from '../validators/settings.validator';

const router = Router();

// Note: Authentication and email verification are now handled by requirePermission middleware

/**
 * @route   GET /api/settings
 * @desc    Get all user settings
 * @access  Private (USER_READ permission required)
 */
router.get(
  '/',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  settingsController.getSettings
);

/**
 * @route   PUT /api/settings
 * @desc    Update multiple settings at once
 * @access  Private (USER_UPDATE permission required)
 */
router.put(
  '/',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

/**
 * @route   GET /api/settings/export
 * @desc    Export user settings
 * @access  Private (USER_READ permission required)
 */
router.get(
  '/export',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  settingsController.exportSettings
);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to default values
 * @access  Private (USER_UPDATE permission required)
 */
router.post(
  '/reset',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(resetSettingsSchema),
  settingsController.resetSettings
);

// Profile Settings Routes
/**
 * @route   GET /api/settings/profile
 * @desc    Get user profile settings
 * @access  Private (USER_READ permission required)
 */
router.get(
  '/profile',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  settingsController.getProfileSettings
);

/**
 * @route   PUT /api/settings/profile
 * @desc    Update user profile settings
 * @access  Private (USER_UPDATE permission required)
 */
router.put(
  '/profile',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updateProfileSettingsSchema),
  settingsController.updateProfileSettings
);

// Notification Settings Routes
/**
 * @route   GET /api/settings/notifications
 * @desc    Get user notification settings
 * @access  Private (USER_READ permission required)
 */
router.get(
  '/notifications',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  settingsController.getNotificationSettings
);

/**
 * @route   PUT /api/settings/notifications
 * @desc    Update user notification settings
 * @access  Private (USER_UPDATE permission required)
 */
router.put(
  '/notifications',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updateNotificationSettingsSchema),
  settingsController.updateNotificationSettings
);

// Privacy Settings Routes
/**
 * @route   GET /api/settings/privacy
 * @desc    Get user privacy settings
 * @access  Private (USER_READ permission required)
 */
router.get(
  '/privacy',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  settingsController.getPrivacySettings
);

/**
 * @route   PUT /api/settings/privacy
 * @desc    Update user privacy settings
 * @access  Private (USER_UPDATE permission required)
 */
router.put(
  '/privacy',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updatePrivacySettingsSchema),
  settingsController.updatePrivacySettings
);

// Automation Settings Routes
/**
 * @route   GET /api/settings/automation
 * @desc    Get user automation settings
 * @access  Private (AUTOMATION_READ permission required)
 */
router.get(
  '/automation',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_READ),
  settingsController.getAutomationSettings
);

/**
 * @route   PUT /api/settings/automation
 * @desc    Update user automation settings
 * @access  Private (AUTOMATION_UPDATE permission required)
 */
router.put(
  '/automation',
  roleMiddleware.requirePermission(PERMISSIONS.AUTOMATION_UPDATE),
  validate(updateAutomationSettingsSchema),
  settingsController.updateAutomationSettings
);

// Billing Settings Routes
/**
 * @route   GET /api/settings/billing
 * @desc    Get user billing settings
 * @access  Private (SUBSCRIPTION_READ permission required)
 */
router.get(
  '/billing',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_READ),
  settingsController.getBillingSettings
);

/**
 * @route   PUT /api/settings/billing
 * @desc    Update user billing settings
 * @access  Private (SUBSCRIPTION_UPDATE permission required)
 */
router.put(
  '/billing',
  roleMiddleware.requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  validate(updateBillingSettingsSchema),
  settingsController.updateBillingSettings
);

// Security Settings Routes
/**
 * @route   GET /api/settings/security
 * @desc    Get user security settings
 * @access  Private (USER_READ permission required)
 */
router.get(
  '/security',
  roleMiddleware.requirePermission(PERMISSIONS.USER_READ),
  settingsController.getSecuritySettings
);

/**
 * @route   PUT /api/settings/security
 * @desc    Update user security settings
 * @access  Private (USER_UPDATE permission required)
 */
router.put(
  '/security',
  roleMiddleware.requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updateSecuritySettingsSchema),
  settingsController.updateSecuritySettings
);

export default router;