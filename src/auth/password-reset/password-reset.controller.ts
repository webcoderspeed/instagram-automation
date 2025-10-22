/**
 * Password Reset Controller
 * Handles HTTP requests for password reset functionality
 */

import { Request, Response, NextFunction } from 'express';
import { passwordResetService } from './password-reset.service';
import { ApiError } from '../../utils/api-error';
import logger from '../../utils/logger';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyResetTokenRequest {
  token: string;
}

class PasswordResetController {
  /**
   * Handle forgot password request
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      // Validate required fields
      if (!email) {
        throw ApiError.badRequest('Email is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw ApiError.badRequest('Invalid email format');
      }

      await passwordResetService.forgotPassword({
        email: email.toLowerCase().trim()
      });

      logger.info(`Password reset requested for: ${email}`);

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });

    } catch (error: unknown) {
      logger.error('Forgot password controller error:', error);
      next(error);
    }
  }

  /**
   * Handle password reset with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword, confirmPassword }: ResetPasswordRequest = req.body;

      // Validate required fields
      if (!token || !newPassword || !confirmPassword) {
        throw ApiError.badRequest('Token, new password, and confirm password are required');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw ApiError.badRequest('Password must be at least 8 characters long');
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw ApiError.badRequest('Passwords do not match');
      }

      // Additional password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(newPassword)) {
        throw ApiError.badRequest('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }

      await passwordResetService.resetPassword({
        token,
        newPassword,
        confirmPassword
      });

      logger.info('Password reset completed successfully');

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });

    } catch (error: unknown) {
      logger.error('Reset password controller error:', error);
      next(error);
    }
  }

  /**
   * Handle password change for authenticated user
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw ApiError.badRequest('Current password, new password, and confirm password are required');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw ApiError.badRequest('Password must be at least 8 characters long');
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw ApiError.badRequest('New passwords do not match');
      }

      // Additional password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(newPassword)) {
        throw ApiError.badRequest('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }

      await passwordResetService.changePassword({
        userId,
        currentPassword,
        newPassword,
        confirmPassword
      });

      logger.info(`Password changed successfully for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Password has been changed successfully.'
      });

    } catch (error: unknown) {
      logger.error('Change password controller error:', error);
      next(error);
    }
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token }: VerifyResetTokenRequest = req.body;

      if (!token) {
        throw ApiError.badRequest('Reset token is required');
      }

      const user = await passwordResetService.verifyResetToken(token);

      res.status(200).json({
        success: true,
        message: 'Reset token is valid',
        data: {
          email: user.email,
          tokenValid: true
        }
      });

    } catch (error: unknown) {
      logger.error('Verify reset token controller error:', error);
      next(error);
    }
  }
}

export const passwordResetController = new PasswordResetController();