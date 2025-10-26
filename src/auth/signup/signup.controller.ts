/**
 * Signup Controller
 * Handles HTTP requests for user registration and email verification
 */

import { Request, Response, NextFunction } from 'express';
import { signupService } from './signup.service';
import { ApiError } from '../../utils/api-error';
import { sendSuccess, sendError, createMeta } from '../../utils/response-builder';
import logger from '../../utils/logger';
import { HttpStatus } from '../../types';

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  language?: string;
  role?: string;
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
      const { email, username, password, firstName, lastName, timezone, language }: SignupRequest = req.body;



      const result = await signupService.signup({
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        timezone,
        language,
      });

      logger.info(`User signup successful: ${email}`);

      sendSuccess(res, {
        message: result.message,
        data: {
          userId: result.user._id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          emailVerified: result.user.isEmailVerified
        }
      }, HttpStatus.CREATED, createMeta({ requestId: req.headers['x-request-id'] as string }));

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
      // Handle token from both query params (GET) and body (POST)
      const token = req.query.token as string || req.body.token;

      if (!token) {
        throw ApiError.badRequest('Verification token is required');
      }

      const user = await signupService.verifyEmail(token);

      logger.info(`Email verified successfully: ${user.email}`);

      sendSuccess(res, {
        message: 'Email verified successfully',
        data: {
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.isEmailVerified
        }
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

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

      sendSuccess(res, {
        message: 'Verification email sent successfully'
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));

    } catch (error: unknown) {
      logger.error('Resend verification controller error:', error);
      next(error);
    }
  }


}

export const signupController = new SignupController();