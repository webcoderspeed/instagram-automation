/**
 * Settings Controller
 * Handles HTTP requests for user settings management
 */

import { Response, Request } from 'express';
import asyncHandler from 'express-async-handler';
import { settingsService } from '../services/settings.service';
import { 
  UpdateSettingsRequest,
  UpdateProfileRequest,
  UpdateNotificationSettingsRequest,
  UpdatePrivacySettingsRequest,
  UpdateAutomationSettingsRequest,
  UpdateBillingSettingsRequest,
  UpdateSecuritySettingsRequest,
  SettingsResponse,
  UpdateSettingsResponse
} from '../types/settings.types';
import logger from '../utils/logger';

export class SettingsController {
  /**
   * @route   GET /api/settings
   * @desc    Get all user settings
   * @access  Private
   */
  getSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      const response: SettingsResponse = {
        success: true,
        data: settings
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/profile
   * @desc    Get user profile settings
   * @access  Private
   */
  getProfileSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings.profile
      });
    } catch (error) {
      logger.error('Failed to get profile settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings/profile
   * @desc    Update user profile settings
   * @access  Private
   */
  updateProfileSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateProfileRequest;

    try {
      const updatedProfile = await settingsService.updateProfileSettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: { profile: updatedProfile },
        message: 'Profile settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update profile settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/notifications
   * @desc    Get notification settings
   * @access  Private
   */
  getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings.notifications
      });
    } catch (error) {
      logger.error('Failed to get notification settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings/notifications
   * @desc    Update notification settings
   * @access  Private
   */
  updateNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateNotificationSettingsRequest;

    try {
      const updatedNotifications = await settingsService.updateNotificationSettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: { notifications: updatedNotifications },
        message: 'Notification settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update notification settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/privacy
   * @desc    Get privacy settings
   * @access  Private
   */
  getPrivacySettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings.privacy
      });
    } catch (error) {
      logger.error('Failed to get privacy settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings/privacy
   * @desc    Update privacy settings
   * @access  Private
   */
  updatePrivacySettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdatePrivacySettingsRequest;

    try {
      const updatedPrivacy = await settingsService.updatePrivacySettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: { privacy: updatedPrivacy },
        message: 'Privacy settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update privacy settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/automation
   * @desc    Get automation settings
   * @access  Private
   */
  getAutomationSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings.automation
      });
    } catch (error) {
      logger.error('Failed to get automation settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings/automation
   * @desc    Update automation settings
   * @access  Private
   */
  updateAutomationSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateAutomationSettingsRequest;

    try {
      const updatedAutomation = await settingsService.updateAutomationSettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: { automation: updatedAutomation },
        message: 'Automation settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update automation settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/billing
   * @desc    Get billing settings
   * @access  Private
   */
  getBillingSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings.billing
      });
    } catch (error) {
      logger.error('Failed to get billing settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings/billing
   * @desc    Update billing settings
   * @access  Private
   */
  updateBillingSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateBillingSettingsRequest;

    try {
      const updatedBilling = await settingsService.updateBillingSettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: { billing: updatedBilling },
        message: 'Billing settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update billing settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/security
   * @desc    Get security settings
   * @access  Private
   */
  getSecuritySettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings.security
      });
    } catch (error) {
      logger.error('Failed to get security settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings/security
   * @desc    Update security settings
   * @access  Private
   */
  updateSecuritySettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateSecuritySettingsRequest;

    try {
      const updatedSecurity = await settingsService.updateSecuritySettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: { security: updatedSecurity },
        message: 'Security settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update security settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   PUT /api/settings
   * @desc    Update multiple settings at once
   * @access  Private
   */
  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateSettingsRequest;

    try {
      const updatedSettings = await settingsService.updateSettings(userId, updates);

      const response: UpdateSettingsResponse = {
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   GET /api/settings/export
   * @desc    Export user settings
   * @access  Private
   */
  exportSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const settingsExport = await settingsService.exportSettings(userId);

      res.json({
        success: true,
        data: settingsExport
      });
    } catch (error) {
      logger.error('Failed to export settings:', { error, userId });
      throw error;
    }
  });

  /**
   * @route   POST /api/settings/reset
   * @desc    Reset settings to default values
   * @access  Private
   */
  resetSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { categories } = req.body;

    try {
      const resetSettings = await settingsService.resetSettings(userId, categories);

      const response: SettingsResponse = {
        success: true,
        data: resetSettings,
        message: 'Settings reset to defaults successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to reset settings:', { error, userId });
      throw error;
    }
  });
}

// Export controller instance
export const settingsController = new SettingsController();