/**
 * Settings Routes
 * API routes for user settings management
 */

import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createProtectedRoute } from '../middleware/guards/protected-routes.middleware';
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

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/settings
 * @desc    Get all user settings
 * @access  Private (Verified User)
 */
router.get(
  '/',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getSettings
);

/**
 * @route   PUT /api/settings
 * @desc    Update multiple settings at once
 * @access  Private (Verified User)
 */
router.put(
  '/',
  createProtectedRoute('VERIFIED_USER'),
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

/**
 * @route   GET /api/settings/export
 * @desc    Export user settings
 * @access  Private (Verified User)
 */
router.get(
  '/export',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.exportSettings
);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to default values
 * @access  Private (Verified User)
 */
router.post(
  '/reset',
  createProtectedRoute('VERIFIED_USER'),
  validate(resetSettingsSchema),
  settingsController.resetSettings
);

// Profile Settings Routes
/**
 * @route   GET /api/settings/profile
 * @desc    Get user profile settings
 * @access  Private (Verified User)
 */
router.get(
  '/profile',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getProfileSettings
);

/**
 * @route   PUT /api/settings/profile
 * @desc    Update user profile settings
 * @access  Private (Verified User)
 */
router.put(
  '/profile',
  createProtectedRoute('VERIFIED_USER'),
  validate(updateProfileSettingsSchema),
  settingsController.updateProfileSettings
);

// Notification Settings Routes
/**
 * @route   GET /api/settings/notifications
 * @desc    Get notification settings
 * @access  Private (Verified User)
 */
router.get(
  '/notifications',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getNotificationSettings
);

/**
 * @route   PUT /api/settings/notifications
 * @desc    Update notification settings
 * @access  Private (Verified User)
 */
router.put(
  '/notifications',
  createProtectedRoute('VERIFIED_USER'),
  validate(updateNotificationSettingsSchema),
  settingsController.updateNotificationSettings
);

// Privacy Settings Routes
/**
 * @route   GET /api/settings/privacy
 * @desc    Get privacy settings
 * @access  Private (Verified User)
 */
router.get(
  '/privacy',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getPrivacySettings
);

/**
 * @route   PUT /api/settings/privacy
 * @desc    Update privacy settings
 * @access  Private (Verified User)
 */
router.put(
  '/privacy',
  createProtectedRoute('VERIFIED_USER'),
  validate(updatePrivacySettingsSchema),
  settingsController.updatePrivacySettings
);

// Automation Settings Routes
/**
 * @route   GET /api/settings/automation
 * @desc    Get automation settings
 * @access  Private (Verified User)
 */
router.get(
  '/automation',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getAutomationSettings
);

/**
 * @route   PUT /api/settings/automation
 * @desc    Update automation settings
 * @access  Private (Verified User)
 */
router.put(
  '/automation',
  createProtectedRoute('VERIFIED_USER'),
  validate(updateAutomationSettingsSchema),
  settingsController.updateAutomationSettings
);

// Billing Settings Routes
/**
 * @route   GET /api/settings/billing
 * @desc    Get billing settings
 * @access  Private (Verified User)
 */
router.get(
  '/billing',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getBillingSettings
);

/**
 * @route   PUT /api/settings/billing
 * @desc    Update billing settings
 * @access  Private (Verified User)
 */
router.put(
  '/billing',
  createProtectedRoute('VERIFIED_USER'),
  validate(updateBillingSettingsSchema),
  settingsController.updateBillingSettings
);

// Security Settings Routes
/**
 * @route   GET /api/settings/security
 * @desc    Get security settings
 * @access  Private (Verified User)
 */
router.get(
  '/security',
  createProtectedRoute('VERIFIED_USER'),
  settingsController.getSecuritySettings
);

/**
 * @route   PUT /api/settings/security
 * @desc    Update security settings
 * @access  Private (Verified User)
 */
router.put(
  '/security',
  createProtectedRoute('VERIFIED_USER'),
  validate(updateSecuritySettingsSchema),
  settingsController.updateSecuritySettings
);

export default router;