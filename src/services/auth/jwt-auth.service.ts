import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../../types/user.types';
import logger from '../../utils/logger';
import { env } from '@/config';

export interface JwtValidationResult {
  isValid: boolean;
  user?: AuthenticatedUser;
  token?: string;
  error?: string;
}

export class JwtAuthService {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = env.JWT_SECRET ?? 'fallback-secret';
    if (!env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set, using fallback secret');
    }
  }

  /**
   * Validates JWT token and returns user data
   */
  validateToken(token: string): JwtValidationResult {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthenticatedUser;
      return {
        isValid: true,
        user: decoded
      };
    } catch (error) {
      logger.debug('Token validation failed', { error: (error as Error).message });
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid token'
      };
    }
  }

  /**
   * Extracts token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generates JWT token for user
   */
  generateToken(user: Partial<AuthenticatedUser>): string {
    return jwt.sign(user as object, this.jwtSecret, { expiresIn: '24h' } as any);
  }

  /**
   * Refreshes JWT token
   */
  refreshToken(token: string): JwtValidationResult {
    const validation = this.validateToken(token);
    
    if (!validation.isValid || !validation.user) {
      return validation;
    }

    try {
      const newToken = this.generateToken(validation.user);
      return {
        isValid: true,
        user: validation.user,
        token: newToken
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to refresh token'
      };
    }
  }
}

export const jwtAuthService = new JwtAuthService();