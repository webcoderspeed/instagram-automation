/**
 * Signup Controller
 * Handles HTTP requests for user registration and email verification
 */

import { Request, Response, NextFunction } from 'express';
import { signupService } from './signup.service';
import { ApiError } from '../../utils/api-error';
import logger from '../../utils/logger';

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms?: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

class SignupController {
  /**
   * Handle user signup
   */
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password, firstName, lastName, acceptTerms }: SignupRequest = req.body;

      // Validate required fields
      if (!email || !username || !password || !firstName || !lastName) {
        throw ApiError.badRequest('Missing required fields: email, username, password, firstName, lastName');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw ApiError.badRequest('Invalid email format');
      }

      // Validate password strength
      if (password.length < 8) {
        throw ApiError.badRequest('Password must be at least 8 characters long');
      }

      // Check terms acceptance (optional but recommended)
      if (acceptTerms === false) {
        throw ApiError.badRequest('You must accept the terms and conditions');
      }

      const result = await signupService.signup({
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      logger.info(`User signup successful: ${email}`);

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          userId: result.user._id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          emailVerified: result.user.isEmailVerified
        }
      });

    } catch (error: unknown) {
      logger.error('Signup controller error:', error);
      next(error);
    }
  }

  /**
   * Handle email verification
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token }: VerifyEmailRequest = req.body;

      if (!token) {
        throw ApiError.badRequest('Verification token is required');
      }

      const user = await signupService.verifyEmail(token);

      logger.info(`Email verified successfully: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.isEmailVerified
        }
      });

    } catch (error: unknown) {
      logger.error('Email verification controller error:', error);
      next(error);
    }
  }

  /**
   * Handle resend verification email
   */
  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: ResendVerificationRequest = req.body;

      if (!email) {
        throw ApiError.badRequest('Email is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw ApiError.badRequest('Invalid email format');
      }

      await signupService.resendVerificationEmail(email.toLowerCase().trim());

      logger.info(`Verification email resent: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error: unknown) {
      logger.error('Resend verification controller error:', error);
      next(error);
    }
  }


}

export const signupController = new SignupController();