/**
 * Password Reset Service
 * Handles forgot password and reset password functionality
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel, UserDocument } from '../../models/user.model';
import { NotificationModel, NotificationType, NotificationChannel, NotificationPriority } from '../../models/notification.model';
import { ApiError } from '../../utils/api-error';
import { emailService } from '../../services/email.service';
import logger from '../../utils/logger';

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class PasswordResetService {
  /**
   * Send password reset email
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      const { email } = data;

      // Find user by email
      const user = await UserModel.findOne({ 
        email: email.toLowerCase().trim(),
        deletedAt: null 
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);

      // Create notification
      await this.createPasswordResetNotification(user.id);

      logger.info(`Password reset email sent to: ${user.email}`);

    } catch (error: unknown) {
      logger.error('Forgot password error:', error);
      throw ApiError.internal('Failed to process password reset request');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      const { token, newPassword, confirmPassword } = data;

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw ApiError.badRequest('Passwords do not match');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw ApiError.badRequest('Password must be at least 8 characters long');
      }

      // Find user by reset token
      const user = await UserModel.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        deletedAt: null
      });

      if (!user) {
        throw ApiError.badRequest('Invalid or expired reset token');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user password and clear reset token
      user.passwordHash = passwordHash;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.loginAttempts = 0; // Reset login attempts
      user.lockUntil = undefined;
      await user.save();

      // Create notification
      await this.createPasswordChangedNotification(user.id);

      logger.info(`Password reset successful for user: ${user.email}`);

    } catch (error: unknown) {
      logger.error('Reset password error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to reset password');
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const { userId, currentPassword, newPassword, confirmPassword } = data;

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw ApiError.badRequest('New passwords do not match');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw ApiError.badRequest('Password must be at least 8 characters long');
      }

      // Find user
      const user = await UserModel.findById(userId).select('+passwordHash');
      
      if (!user || user.deletedAt) {
        throw ApiError.notFound('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        throw ApiError.badRequest('Current password is incorrect');
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      
      if (isSamePassword) {
        throw ApiError.badRequest('New password must be different from current password');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user password
      user.passwordHash = passwordHash;
      await user.save();

      // Create notification
      await this.createPasswordChangedNotification(user.id);

      logger.info(`Password changed successfully for user: ${user.email}`);

    } catch (error: unknown) {
      logger.error('Change password error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to change password');
    }
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token: string): Promise<UserDocument> {
    try {
      const user = await UserModel.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        deletedAt: null
      });

      if (!user) {
        throw ApiError.badRequest('Invalid or expired reset token');
      }

      return user;

    } catch (error: unknown) {
      logger.error('Verify reset token error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to verify reset token');
    }
  }

  /**
   * Generate password reset token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(user: UserDocument, token: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.firstName || user.username,
        resetUrl
      });

    } catch (error: unknown) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Create password reset notification
   */
  private async createPasswordResetNotification(userId: string): Promise<void> {
    try {
      await NotificationModel.create({
        userId,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        title: 'Password Reset Requested',
        message: 'A password reset was requested for your account. If this wasn\'t you, please contact support immediately.',
        data: {
          action: 'password_reset_requested',
          timestamp: new Date()
        }
      });

    } catch (error: unknown) {
      logger.error('Failed to create password reset notification:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Create password changed notification
   */
  private async createPasswordChangedNotification(userId: string): Promise<void> {
    try {
      await NotificationModel.create({
        userId,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        title: 'Password Changed',
        message: 'Your password has been successfully changed. If this wasn\'t you, please contact support immediately.',
        data: {
          action: 'password_changed',
          timestamp: new Date()
        }
      });

    } catch (error: unknown) {
      logger.error('Failed to create password changed notification:', error);
      // Don't throw error as this is not critical
    }
  }
}

export const passwordResetService = new PasswordResetService();