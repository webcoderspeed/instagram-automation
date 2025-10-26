import { UserModel, UserDocument } from '../models/user.model';
import { 
  NotificationSettings, 
  EmailNotificationType,
  PushNotificationType,
  SmsNotificationType,
  InAppNotificationType
} from '../types/settings.types';
import logger from '../utils/logger';
import { AppError } from '../utils/app-error';

// Unified notification type for all channels
export type NotificationType = 
  | 'post_published'
  | 'comment_received'
  | 'message_received'
  | 'mention_received'
  | 'automation_triggered'
  | 'account_connected'
  | 'account_disconnected'
  | 'subscription_updated'
  | 'security_alert';

export interface NotificationData {
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  actionUrl?: string;
}

export interface NotificationHistoryItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: 'email' | 'push' | 'sms' | 'in_app';
  status: 'sent' | 'delivered' | 'failed' | 'read';
  createdAt: Date;
  readAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Notification Service
 * 
 * Handles sending notifications to users based on their preferences
 * and manages notification delivery across different channels.
 */
export class NotificationService {
  /**
   * Send a notification to a user based on their preferences
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const notificationSettings = user.preferences?.notifications;
      if (!notificationSettings) {
        logger.debug('No notification preferences found for user', { userId });
        return;
      }

      // Check user notification preferences (using simple boolean preferences from user model)
      const preferences = user.preferences?.notifications;
      const shouldSendEmail = preferences?.email ?? true;
      const shouldSendPush = preferences?.push ?? true;
      const shouldSendSms = preferences?.sms ?? false;
      const shouldSendInApp = true; // Always send in-app notifications

      // Send notifications through enabled channels
      const promises: Promise<void>[] = [];

      if (shouldSendEmail) {
        promises.push(this.sendEmailNotification(user, type, data));
      }

      if (shouldSendPush) {
        promises.push(this.sendPushNotification(user, type, data));
      }

      if (shouldSendSms) {
        promises.push(this.sendSmsNotification(user, type, data));
      }

      if (shouldSendInApp) {
        promises.push(this.sendInAppNotification(user, type, data));
      }

      // Execute all notifications concurrently
      await Promise.allSettled(promises);

      logger.info('Notification sent successfully', {
        userId,
        type,
        channels: {
          email: shouldSendEmail,
          push: shouldSendPush,
          sms: shouldSendSms,
          inApp: shouldSendInApp,
        },
      });
    } catch (error) {
      logger.error('Failed to send notification', {
        userId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotification(
    userIds: string[],
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    try {
      const promises = userIds.map(userId => 
        this.sendNotification(userId, type, data).catch(error => {
          logger.error('Failed to send notification to user', { userId, error });
          return null; // Don't fail the entire batch for one user
        })
      );

      await Promise.allSettled(promises);

      logger.info('Bulk notification sent', {
        userCount: userIds.length,
        type,
      });
    } catch (error) {
      logger.error('Failed to send bulk notification', {
        userCount: userIds.length,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: NotificationType;
      channel?: 'email' | 'push' | 'sms' | 'in_app';
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    notifications: NotificationHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // This would typically query a notifications collection/table
    // For now, returning a placeholder structure
    const { page = 1, limit = 20 } = options;
    
    logger.info('Getting notification history', { userId, options });

    return {
      notifications: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      // This would typically update the read status in a notifications collection
      logger.info('Marking notifications as read', { userId, notificationIds });
    } catch (error) {
      logger.error('Failed to mark notifications as read', {
        userId,
        notificationIds,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // This would typically query a notifications collection for unread count
      logger.debug('Getting unread notification count', { userId });
      return 0; // Placeholder
    } catch (error) {
      logger.error('Failed to get unread notification count', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Test notification delivery for a user
   */
  async testNotification(
    userId: string,
    channel: 'email' | 'push' | 'sms' | 'in_app'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const testData = {
        title: 'Test Notification',
        message: 'This is a test notification to verify your settings.',
        metadata: { test: true },
        priority: 'normal' as const,
      };

      switch (channel) {
        case 'email':
          await this.sendEmailNotification(user, 'security_alert', testData);
          break;
        case 'push':
          await this.sendPushNotification(user, 'security_alert', testData);
          break;
        case 'sms':
          await this.sendSmsNotification(user, 'security_alert', testData);
          break;
        case 'in_app':
          await this.sendInAppNotification(user, 'security_alert', testData);
          break;
        default:
          throw AppError.validation('Invalid notification channel');
      }

      return {
        success: true,
        message: `Test notification sent successfully via ${channel}`,
      };
    } catch (error) {
      logger.error('Failed to send test notification', {
        userId,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send test notification',
      };
    }
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    channelSettings: { enabled?: boolean; types?: NotificationType[] } | undefined,
    type: NotificationType
  ): boolean {
    if (!channelSettings || !channelSettings.enabled) {
      return false;
    }

    if (!channelSettings.types || channelSettings.types.length === 0) {
      return true; // If no specific types are configured, send all
    }

    return channelSettings.types.includes(type);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    user: UserDocument,
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    try {
      // This would integrate with an email service (SendGrid, AWS SES, etc.)
      logger.info('Sending email notification', {
        userId: user._id,
        email: user.email,
        type,
        title: data.title,
      });

      // Placeholder for actual email sending logic
      // await emailService.send({
      //   to: user.email,
      //   subject: data.title,
      //   template: this.getEmailTemplate(type),
      //   data: {
      //     user: user.toPublicJSON(),
      //     ...data,
      //   },
      // });
    } catch (error) {
      logger.error('Failed to send email notification', {
        userId: user._id,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    user: UserDocument,
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    try {
      // This would integrate with a push notification service (FCM, APNs, etc.)
      logger.info('Sending push notification', {
        userId: user._id,
        type,
        title: data.title,
      });

      // Placeholder for actual push notification logic
      // await pushService.send({
      //   userId: user._id,
      //   title: data.title,
      //   body: data.message,
      //   data: data.metadata,
      //   priority: data.priority,
      //   actionUrl: data.actionUrl,
      // });
    } catch (error) {
      logger.error('Failed to send push notification', {
        userId: user._id,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    user: UserDocument,
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    try {
      const phoneNumber = user.phoneNumber;
      if (!phoneNumber) {
        logger.warn('No phone number configured for SMS notifications', {
          userId: user._id,
        });
        return;
      }

      // This would integrate with an SMS service (Twilio, AWS SNS, etc.)
      logger.info('Sending SMS notification', {
        userId: user._id,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
        type,
        title: data.title,
      });

      // Placeholder for actual SMS sending logic
      // await smsService.send({
      //   to: phoneNumber,
      //   message: `${data.title}: ${data.message}`,
      //   priority: data.priority,
      // });
    } catch (error) {
      logger.error('Failed to send SMS notification', {
        userId: user._id,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    user: UserDocument,
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    try {
      // This would store the notification in a database for in-app display
      logger.info('Sending in-app notification', {
        userId: user._id,
        type,
        title: data.title,
      });

      // Placeholder for actual in-app notification storage
      // await InAppNotification.create({
      //   userId: user._id,
      //   type,
      //   title: data.title,
      //   message: data.message,
      //   metadata: data.metadata,
      //   priority: data.priority,
      //   actionUrl: data.actionUrl,
      //   isRead: false,
      //   createdAt: new Date(),
      // });

      // Optionally emit real-time notification via WebSocket
      // socketService.emitToUser(user._id, 'notification', {
      //   type,
      //   title: data.title,
      //   message: data.message,
      //   actionUrl: data.actionUrl,
      // });
    } catch (error) {
      logger.error('Failed to send in-app notification', {
        userId: user._id,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get email template for notification type
   */
  private getEmailTemplate(type: NotificationType): string {
    const templates: Record<NotificationType, string> = {
      post_published: 'post-published',
      comment_received: 'comment-received',
      message_received: 'message-received',
      mention_received: 'mention-received',
      automation_triggered: 'automation-triggered',
      account_connected: 'account-connected',
      account_disconnected: 'account-disconnected',
      subscription_updated: 'subscription-updated',
      security_alert: 'security-alert',
    };

    return templates[type] || 'default';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();