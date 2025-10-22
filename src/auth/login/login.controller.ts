/**
 * Login Controller
 * Handles HTTP requests for user authentication and session management
 */

import { Request, Response, NextFunction } from 'express';
import { loginService } from './login.service';
import { ApiError } from '../../utils/api-error';
import logger from '../../utils/logger';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

class LoginController {
  /**
   * Handle user login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe }: LoginRequest = req.body;

      const result = await loginService.login({
        email: email.toLowerCase().trim(),
        password,
        rememberMe: rememberMe ?? false
      }, req);

      logger.info(`User login successful: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user._id,
            email: result.user.email,
            username: result.user.username,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            isEmailVerified: result.user.isEmailVerified,
            lastLoginAt: result.user.lastLoginAt
          }
        }
      });

    } catch (error: unknown) {
      logger.error('Login controller error:', error);
      next(error);
    }
  }

  /**
   * Handle user logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.user?.id;

      await loginService.logout(req);

      logger.info(`User logout: ${userId || 'unknown'}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error: unknown) {
      logger.error('Logout controller error:', error);
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
          }
        }
      });

    } catch (error: unknown) {
      logger.error('Get profile controller error:', error);
      next(error);
    }
  }

  /**
   * Check session status
   */
  async checkSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAuthenticated = loginService.isAuthenticated(req);
      const user = loginService.getCurrentUser(req);

      res.status(200).json({
        success: true,
        data: {
          isAuthenticated,
          user: isAuthenticated ? user : null
        }
      });

    } catch (error: unknown) {
      logger.error('Check session controller error:', error);
      next(error);
    }
  }

  /**
   * Refresh session (extend expiration)
   */
  async refreshSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!loginService.isAuthenticated(req)) {
        throw ApiError.unauthorized('User not authenticated');
      }

      loginService.refreshSession(req);

      res.status(200).json({
        success: true,
        message: 'Session refreshed successfully'
      });

    } catch (error: unknown) {
      logger.error('Refresh session controller error:', error);
      next(error);
    }
  }
}

export const loginController = new LoginController();