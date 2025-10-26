/**
 * Settings Service
 * Handles business logic for user settings management
 */

import { Types } from 'mongoose';
import { UserModel, UserDocument } from '../models/user.model';
import { SubscriptionModel } from '../models/subscription.model';
import { NotificationModel } from '../models/notification.model';
import { 
  UserSettings, 
  UpdateSettingsRequest,
  ProfileSettings,
  NotificationSettings,
  PrivacySettings,
  AutomationSettings,
  BillingSettings,
  SecuritySettings,
  UpdateProfileRequest,
  UpdateNotificationSettingsRequest,
  UpdatePrivacySettingsRequest,
  UpdateAutomationSettingsRequest,
  UpdateBillingSettingsRequest,
  UpdateSecuritySettingsRequest,
  SettingsExport
} from '../types/settings.types';
import { AppError } from '../utils/app-error';
import logger from '../utils/logger';

export class SettingsService {
  /**
   * Get all user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const user = await UserModel.findById(userId)
        .populate('subscriptionId')
        .select('-passwordHash -emailVerificationToken -passwordResetToken -twoFactorSecret');

      if (!user) {
        throw AppError.notFound('User not found');
      }

      const subscription = user.subscriptionId as any;

      // Build settings response
      const settings: UserSettings = {
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          timezone: user.timezone,
          language: user.language
        },
        notifications: {
          email: {
            enabled: user.preferences.notifications.email,
            frequency: 'immediate', // Default, can be enhanced
            types: ['post_published', 'comment_received', 'security_alert'] // Default types
          },
          push: {
            enabled: user.preferences.notifications.push,
            types: ['post_published', 'comment_received', 'security_alert']
          },
          sms: {
            enabled: user.preferences.notifications.sms,
            types: ['security_alert']
          },
          inApp: {
            enabled: true, // Always enabled for in-app
            types: ['post_published', 'comment_received', 'mention_received', 'automation_triggered']
          }
        },
        privacy: {
          profileVisible: user.preferences.privacy.profileVisible,
          analyticsSharing: user.preferences.privacy.analyticsSharing,
          dataExport: true, // Always allow data export
          marketingEmails: true, // Default, can be enhanced
          thirdPartySharing: false // Default secure setting
        },
        automation: {
          autoPost: user.preferences.automation.autoPost,
          autoReply: user.preferences.automation.autoReply,
          autoModeration: false, // Default, can be enhanced
          smartScheduling: true, // Default enabled
          contentSuggestions: true // Default enabled
        },
        billing: {
          autoRenewal: subscription?.autoRenewal || true,
          usageAlerts: {
            enabled: true,
            thresholds: {
              posts: 80, // 80% of limit
              automations: 80,
              storage: 90
            }
          }
        },
        security: {
          twoFactorEnabled: user.twoFactorEnabled,
          loginNotifications: true, // Default enabled
          sessionTimeout: 60, // 1 hour default
          apiKeyAccess: false // Default disabled
        }
      };

      return settings;
    } catch (error) {
      logger.error('Failed to get user settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to retrieve user settings');
    }
  }

  /**
   * Update user profile settings
   */
  async updateProfileSettings(userId: string, updates: UpdateProfileRequest): Promise<ProfileSettings> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update profile fields
      if (updates.firstName !== undefined) user.firstName = updates.firstName;
      if (updates.lastName !== undefined) user.lastName = updates.lastName;
      if (updates.displayName !== undefined) user.displayName = updates.displayName;
      if (updates.bio !== undefined) user.bio = updates.bio;
      if (updates.website !== undefined) user.website = updates.website;
      if (updates.location !== undefined) user.location = updates.location;
      if (updates.timezone !== undefined) user.timezone = updates.timezone;
      if (updates.language !== undefined) user.language = updates.language;

      await user.save();

      logger.info('Profile settings updated:', { userId, updates });

      return {
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        website: user.website,
        location: user.location,
        timezone: user.timezone,
        language: user.language
      };
    } catch (error) {
      logger.error('Failed to update profile settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update profile settings');
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string, 
    updates: UpdateNotificationSettingsRequest
  ): Promise<NotificationSettings> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update notification preferences
      if (updates.email?.enabled !== undefined) {
        user.preferences.notifications.email = updates.email.enabled;
      }
      if (updates.push?.enabled !== undefined) {
        user.preferences.notifications.push = updates.push.enabled;
      }
      if (updates.sms?.enabled !== undefined) {
        user.preferences.notifications.sms = updates.sms.enabled;
      }

      await user.save();

      logger.info('Notification settings updated:', { userId, updates });

      // Return updated notification settings
      return {
        email: {
          enabled: user.preferences.notifications.email,
          frequency: 'immediate',
          types: ['post_published', 'comment_received', 'security_alert']
        },
        push: {
          enabled: user.preferences.notifications.push,
          types: ['post_published', 'comment_received', 'security_alert']
        },
        sms: {
          enabled: user.preferences.notifications.sms,
          types: ['security_alert']
        },
        inApp: {
          enabled: true,
          types: ['post_published', 'comment_received', 'mention_received', 'automation_triggered']
        }
      };
    } catch (error) {
      logger.error('Failed to update notification settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update notification settings');
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string, 
    updates: UpdatePrivacySettingsRequest
  ): Promise<PrivacySettings> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update privacy preferences
      if (updates.profileVisible !== undefined) {
        user.preferences.privacy.profileVisible = updates.profileVisible;
      }
      if (updates.analyticsSharing !== undefined) {
        user.preferences.privacy.analyticsSharing = updates.analyticsSharing;
      }

      await user.save();

      logger.info('Privacy settings updated:', { userId, updates });

      return {
        profileVisible: user.preferences.privacy.profileVisible,
        analyticsSharing: user.preferences.privacy.analyticsSharing,
        dataExport: true,
        marketingEmails: true,
        thirdPartySharing: false
      };
    } catch (error) {
      logger.error('Failed to update privacy settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update privacy settings');
    }
  }

  /**
   * Update automation settings
   */
  async updateAutomationSettings(
    userId: string, 
    updates: UpdateAutomationSettingsRequest
  ): Promise<AutomationSettings> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update automation preferences
      if (updates.autoPost !== undefined) {
        user.preferences.automation.autoPost = updates.autoPost;
      }
      if (updates.autoReply !== undefined) {
        user.preferences.automation.autoReply = updates.autoReply;
      }

      await user.save();

      logger.info('Automation settings updated:', { userId, updates });

      return {
        autoPost: user.preferences.automation.autoPost,
        autoReply: user.preferences.automation.autoReply,
        autoModeration: false,
        smartScheduling: true,
        contentSuggestions: true
      };
    } catch (error) {
      logger.error('Failed to update automation settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update automation settings');
    }
  }

  /**
   * Update billing settings
   */
  async updateBillingSettings(
    userId: string, 
    updates: UpdateBillingSettingsRequest
  ): Promise<BillingSettings> {
    try {
      const user = await UserModel.findById(userId).populate('subscriptionId');
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const subscription = user.subscriptionId as any;
      if (!subscription) {
        throw AppError.notFound('No active subscription found');
      }

      // Update billing settings in subscription
      if (updates.autoRenewal !== undefined) {
        subscription.autoRenewal = updates.autoRenewal;
        await subscription.save();
      }

      logger.info('Billing settings updated:', { userId, updates });

      return {
        autoRenewal: subscription.autoRenewal,
        usageAlerts: {
          enabled: true,
          thresholds: {
            posts: 80,
            automations: 80,
            storage: 90
          }
        }
      };
    } catch (error) {
      logger.error('Failed to update billing settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update billing settings');
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    userId: string, 
    updates: UpdateSecuritySettingsRequest
  ): Promise<SecuritySettings> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update security settings
      if (updates.twoFactorEnabled !== undefined) {
        user.twoFactorEnabled = updates.twoFactorEnabled;
        
        // If disabling 2FA, clear the secret
        if (!updates.twoFactorEnabled) {
          user.twoFactorSecret = undefined;
        }
      }

      await user.save();

      logger.info('Security settings updated:', { userId, updates });

      return {
        twoFactorEnabled: user.twoFactorEnabled,
        loginNotifications: true,
        sessionTimeout: 60,
        apiKeyAccess: false
      };
    } catch (error) {
      logger.error('Failed to update security settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update security settings');
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateSettings(userId: string, updates: UpdateSettingsRequest): Promise<Partial<UserSettings>> {
    try {
      const result: Partial<UserSettings> = {};

      // Update each category if provided
      if (updates.profile) {
        result.profile = await this.updateProfileSettings(userId, updates.profile);
      }

      if (updates.notifications) {
        result.notifications = await this.updateNotificationSettings(userId, updates.notifications);
      }

      if (updates.privacy) {
        result.privacy = await this.updatePrivacySettings(userId, updates.privacy);
      }

      if (updates.automation) {
        result.automation = await this.updateAutomationSettings(userId, updates.automation);
      }

      if (updates.billing) {
        result.billing = await this.updateBillingSettings(userId, updates.billing);
      }

      if (updates.security) {
        result.security = await this.updateSecuritySettings(userId, updates.security);
      }

      logger.info('Multiple settings updated:', { userId, categories: Object.keys(result) });

      return result;
    } catch (error) {
      logger.error('Failed to update settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update settings');
    }
  }

  /**
   * Export user settings
   */
  async exportSettings(userId: string): Promise<SettingsExport> {
    try {
      const settings = await this.getUserSettings(userId);

      return {
        version: '1.0',
        exportedAt: new Date(),
        userId,
        settings
      };
    } catch (error) {
      logger.error('Failed to export settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to export settings');
    }
  }

  /**
   * Reset settings to default
   */
  async resetSettings(userId: string, categories?: string[]): Promise<UserSettings> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const allCategories = ['notifications', 'privacy', 'automation'];
      const categoriesToReset = categories || allCategories;

      // Reset specified categories to defaults
      if (categoriesToReset.includes('notifications')) {
        user.preferences.notifications = {
          email: true,
          push: true,
          sms: false
        };
      }

      if (categoriesToReset.includes('privacy')) {
        user.preferences.privacy = {
          profileVisible: true,
          analyticsSharing: false
        };
      }

      if (categoriesToReset.includes('automation')) {
        user.preferences.automation = {
          autoPost: false,
          autoReply: false
        };
      }

      await user.save();

      logger.info('Settings reset to defaults:', { userId, categories: categoriesToReset });

      return this.getUserSettings(userId);
    } catch (error) {
      logger.error('Failed to reset settings:', { error, userId });
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to reset settings');
    }
  }
}

export const settingsService = new SettingsService();