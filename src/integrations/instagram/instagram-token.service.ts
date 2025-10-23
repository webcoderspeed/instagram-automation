import { PlatformCredentials } from '../../types/platform.types';
import logger from '../../utils/logger';

export interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  needsRefresh: boolean;
  expiresAt?: Date;
  timeUntilExpiration?: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  needsRefresh?: boolean;
}

export interface TokenRefreshResult {
  success: boolean;
  newToken?: {
    access_token: string;
    expires_in: number;
  };
  error?: string;
}

export class InstagramTokenService {
  private readonly graphUrl = 'https://graph.instagram.com';

  /**
   * Validate Instagram token
   */
  validateToken(credentials: PlatformCredentials | null): TokenValidationResult {
    if (!credentials) {
      return {
        isValid: false,
        error: 'Credentials not found'
      };
    }

    if (!credentials.accessToken) {
      return {
        isValid: false,
        error: 'Access token is missing'
      };
    }

    // Check if token is expired
    if (this.isTokenExpired(credentials)) {
      return {
        isValid: false,
        error: 'Access token has expired',
        needsRefresh: true
      };
    }

    // Check if token needs refresh (within 7 days of expiry)
    if (this.needsRefresh(credentials)) {
      return {
        isValid: true,
        needsRefresh: true
      };
    }

    return { isValid: true };
  }

  /**
   * Refresh Instagram long-lived token
   */
  async refreshLongLivedToken(accessToken: string): Promise<TokenRefreshResult> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: accessToken
      });

      const response = await fetch(`${this.graphUrl}/refresh_access_token?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      logger.info('Instagram token refreshed successfully', {
        expiresIn: data.expires_in
      });

      return {
        success: true,
        newToken: {
          access_token: data.access_token,
          expires_in: data.expires_in
        }
      };

    } catch (error) {
      logger.error('Instagram token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      };
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(credentials: PlatformCredentials): boolean {
    if (!credentials.expiresAt) {
      return false; // If no expiry date, assume it's valid
    }

    return credentials.expiresAt < new Date();
  }

  /**
   * Calculate expiration date from expires_in seconds
   */
  calculateExpirationDate(expiresIn: number): Date {
    return new Date(Date.now() + (expiresIn * 1000));
  }

  /**
   * Get token information
   */
  getTokenInfo(credentials: PlatformCredentials): TokenInfo {
    const isExpired = this.isTokenExpired(credentials);
    const needsRefresh = this.needsRefresh(credentials);
    const timeUntilExpiration = this.getTimeUntilExpiration(credentials);

    return {
      isValid: !isExpired,
      isExpired,
      needsRefresh,
      expiresAt: credentials.expiresAt,
      timeUntilExpiration
    };
  }

  /**
   * Format token for API requests
   */
  formatTokenForRequest(accessToken: string): string {
    return `Bearer ${accessToken}`;
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    // Instagram tokens are typically long alphanumeric strings
    return /^[A-Za-z0-9_-]+$/.test(token) && token.length > 20;
  }

  /**
   * Create token storage object
   */
  createTokenStorage(accessToken: string, expiresIn: number): PlatformCredentials {
    return {
      accessToken,
      refreshToken: undefined, // Instagram doesn't provide refresh tokens
      expiresAt: this.calculateExpirationDate(expiresIn),
      scope: ['user_profile', 'user_media']
    };
  }

  /**
   * Check if token needs refresh (within 7 days of expiry)
   */
  needsRefresh(credentials: PlatformCredentials): boolean {
    if (!credentials.expiresAt) {
      return false;
    }

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const timeUntilExpiry = credentials.expiresAt.getTime() - Date.now();
    
    return timeUntilExpiry <= sevenDaysInMs && timeUntilExpiry > 0;
  }

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration(credentials: PlatformCredentials): number | undefined {
    if (!credentials.expiresAt) {
      return undefined;
    }

    const timeUntilExpiry = credentials.expiresAt.getTime() - Date.now();
    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Get time until expiration as human-readable string
   */
  getTimeUntilExpirationString(credentials: PlatformCredentials): string {
    const timeUntilExpiry = this.getTimeUntilExpiration(credentials);
    
    if (timeUntilExpiry === undefined) {
      return 'No expiration date';
    }

    if (timeUntilExpiry <= 0) {
      return 'Expired';
    }

    const days = Math.floor(timeUntilExpiry / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeUntilExpiry % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeUntilExpiry % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
}

export const instagramTokenService = new InstagramTokenService();