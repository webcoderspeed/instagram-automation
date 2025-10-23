import { SocialPlatform } from '../../types/common.types';
import { PlatformCredentials } from '../../types/platform.types';
import logger from '../../utils/logger';

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  needsRefresh?: boolean;
}

export class TokenValidatorService {
  /**
   * Validates platform credentials
   */
  validateCredentials(credentials: PlatformCredentials | null): TokenValidationResult {
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
    if (credentials.expiresAt && credentials.expiresAt < new Date()) {
      return {
        isValid: false,
        error: 'Access token has expired',
        needsRefresh: !!credentials.refreshToken
      };
    }

    return { isValid: true };
  }

  /**
   * Validates platform-specific token requirements
   */
  validatePlatformToken(platform: SocialPlatform, credentials: PlatformCredentials): TokenValidationResult {
    const baseValidation = this.validateCredentials(credentials);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Platform-specific validations
    switch (platform) {
      case 'instagram':
        return this.validateInstagramToken(credentials);
      case 'facebook':
        return this.validateFacebookToken(credentials);
      case 'twitter':
        return this.validateTwitterToken(credentials);
      case 'linkedin':
        return this.validateLinkedInToken(credentials);
      case 'tiktok':
        return this.validateTikTokToken(credentials);
      case 'youtube':
        return this.validateYouTubeToken(credentials);
      default:
        return { isValid: true };
    }
  }

  private validateInstagramToken(credentials: PlatformCredentials): TokenValidationResult {
    // Instagram-specific validation logic
    if (credentials.scope && !credentials.scope.includes('instagram_basic')) {
      return {
        isValid: false,
        error: 'Insufficient Instagram permissions'
      };
    }
    return { isValid: true };
  }

  private validateFacebookToken(credentials: PlatformCredentials): TokenValidationResult {
    // Facebook-specific validation logic
    return { isValid: true };
  }

  private validateTwitterToken(credentials: PlatformCredentials): TokenValidationResult {
    // Twitter-specific validation logic
    return { isValid: true };
  }

  private validateLinkedInToken(credentials: PlatformCredentials): TokenValidationResult {
    // LinkedIn-specific validation logic
    return { isValid: true };
  }

  private validateTikTokToken(credentials: PlatformCredentials): TokenValidationResult {
    // TikTok-specific validation logic
    return { isValid: true };
  }

  private validateYouTubeToken(credentials: PlatformCredentials): TokenValidationResult {
    // YouTube-specific validation logic
    return { isValid: true };
  }

  /**
   * Logs token validation events
   */
  private logValidationEvent(platform: SocialPlatform, result: TokenValidationResult, userId?: string): void {
    if (!result.isValid) {
      logger.warn(`Token validation failed for ${platform}`, {
        platform,
        error: result.error,
        needsRefresh: result.needsRefresh,
        userId
      });
    }
  }
}

export const tokenValidatorService = new TokenValidatorService();