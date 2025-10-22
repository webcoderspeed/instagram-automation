/**
 * Login Service
 * Handles user authentication, JWT token generation, and login security
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class LoginService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Authenticate user and generate tokens
   */
  async login(data: LoginData): Promise<LoginResult> {
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
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
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

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Calculate expiration time
      const expiresIn = rememberMe ? 
        this.parseTimeToSeconds(this.JWT_REFRESH_EXPIRES_IN) : 
        this.parseTimeToSeconds(this.JWT_EXPIRES_IN);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user,
        accessToken,
        refreshToken,
        expiresIn
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
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenData): Promise<RefreshTokenResult> {
    try {
      const { refreshToken } = data;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // Find user
      const user = await UserModel.findById(decoded.userId);
      
      if (!user || user.deletedAt) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      const expiresIn = this.parseTimeToSeconds(this.JWT_EXPIRES_IN);

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn
      };

    } catch (error: unknown) {
      logger.error('Token refresh error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Token refresh failed');
    }
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<void> {
    try {
      // In a production app, you might want to maintain a blacklist of tokens
      // or store tokens in Redis with expiration
      logger.info(`User logged out: ${userId}`);
      
      // For now, we'll just log the logout
      // In production, implement token blacklisting or Redis-based session management
      
    } catch (error: unknown) {
      logger.error('Logout error:', error);
      throw ApiError.internal('Logout failed');
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: UserDocument): string {
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'social-media-automation',
      audience: 'social-media-automation-users'
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: UserDocument): string {
    const payload = {
      userId: user._id,
      email: user.email,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      issuer: 'social-media-automation',
      audience: 'social-media-automation-users'
    });
  }

  /**
   * Parse time string to seconds
   */
  private parseTimeToSeconds(timeString: string): number {
    const timeValue = parseInt(timeString);
    const timeUnit = timeString.slice(-1);

    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return timeValue;
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw ApiError.unauthorized('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET);
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }
}

export const loginService = new LoginService();