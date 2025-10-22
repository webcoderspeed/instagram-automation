/**
 * Login Controller
 * Handles HTTP requests for user authentication and token management
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

export interface RefreshTokenRequest {
  refreshToken: string;
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
      });

      logger.info(`User login successful: ${email}`);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.expiresIn * 1000 // Convert to milliseconds
      });

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
          },
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error: unknown) {
      logger.error('Login controller error:', error);
      next(error);
    }
  }

  /**
   * Handle token refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;
      
      // Try to get refresh token from cookie if not in body
      const tokenToUse = refreshToken || req.cookies?.refreshToken;

      if (!tokenToUse) {
        throw ApiError.unauthorized('Refresh token is required');
      }

      const result = await loginService.refreshToken({
        refreshToken: tokenToUse
      });

      logger.info('Token refreshed successfully');

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.expiresIn * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error: unknown) {
      logger.error('Token refresh controller error:', error);
      next(error);
    }
  }

  /**
   * Handle user logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (userId) {
        await loginService.logout(userId);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

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

      // In a real app, you might want to fetch fresh user data
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
   * Verify token endpoint
   */
  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Access token is required');
      }

      const token = authHeader.substring(7);
      const decoded = loginService.verifyAccessToken(token);

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          expiresAt: new Date(decoded.exp * 1000)
        }
      });

    } catch (error: unknown) {
      logger.error('Token verification controller error:', error);
      next(error);
    }
  }
}

export const loginController = new LoginController();