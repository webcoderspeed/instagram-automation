/**
 * Login Service
 * Handles user authentication and session management
 */

import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { UserModel, UserDocument } from '../../models/user.model';
import { ApiError } from '../../utils/api-error';
import logger from '../../utils/logger';

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  user: UserDocument;
  success: boolean;
  message: string;
}

class LoginService {
  /**
   * Authenticate user and create session
   */
  async login(data: LoginData, req: Request): Promise<LoginResult> {
    try {
      const { email, password, rememberMe = false } = data;

      // Find user by email
      const user = await UserModel.findOne({ 
        email: email.toLowerCase().trim(),
        deletedAt: null 
      }).select('+passwordHash');

      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw ApiError.unauthorized('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw ApiError.unauthorized('Please verify your email before logging in');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      await user.updateLastLogin();

      // Create session
      req.session.user = {
        id: String(user._id),
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      };
      req.session.isAuthenticated = true;

      // Set session expiration based on rememberMe
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user,
        success: true,
        message: 'Login successful'
      };

    } catch (error: unknown) {
      logger.error('Login error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Login failed');
    }
  }

  /**
   * Logout user (destroy session)
   */
  async logout(req: Request): Promise<void> {
    try {
      const userId = req.session.user?.id;
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error:', err);
          throw ApiError.internal('Logout failed');
        }
      });

      logger.info(`User logged out: ${userId}`);
      
    } catch (error: unknown) {
      logger.error('Logout error:', error);
      throw ApiError.internal('Logout failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(req: Request): boolean {
    return !!(req.session && req.session.isAuthenticated && req.session.user);
  }

  /**
   * Get current user from session
   */
  getCurrentUser(req: Request): any {
    if (this.isAuthenticated(req)) {
      return req.session.user;
    }
    return null;
  }

  /**
   * Refresh session (extend expiration)
   */
  refreshSession(req: Request): void {
    if (this.isAuthenticated(req)) {
      req.session.touch();
    }
  }
}

export const loginService = new LoginService();