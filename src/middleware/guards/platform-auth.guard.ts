import { Request, Response, NextFunction } from 'express';
import { SocialPlatform } from '../../types/common.types';
import { tokenValidatorService } from '../../services/auth/token-validator.service';
import { platformAccountService } from '../../services/auth/platform-account.service';
import logger from '../../utils/logger';

/**
 * Platform Token Guard
 * Validates that user has valid token for specific platform
 */
export const platformTokenGuard = (platform: SocialPlatform) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
      return;
    }

    const credentials = platformAccountService.getPlatformCredentials(req.user, platform);
    
    if (!credentials) {
      res.status(403).json({
        success: false,
        error: {
          message: `${platform} account not connected`
        }
      });
      return;
    }

    const validation = await tokenValidatorService.validatePlatformToken(platform, credentials);
    
    if (!validation.isValid) {
      logger.warn(`Invalid ${platform} token`, { 
        userId: req.user.id, 
        error: validation.error 
      });
      
      res.status(403).json({
        success: false,
        error: {
          message: `Invalid or expired ${platform} token`,
          details: validation.error
        }
      });
      return;
    }

    next();
  };
};

/**
 * Multiple Platform Guard
 * Validates that user has valid tokens for all specified platforms
 */
export const multiplePlatformGuard = (platforms: SocialPlatform[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
      return;
    }

    const missingPlatforms: SocialPlatform[] = [];
    const invalidPlatforms: SocialPlatform[] = [];

    for (const platform of platforms) {
      const credentials = platformAccountService.getPlatformCredentials(req.user, platform);
      
      if (!credentials) {
        missingPlatforms.push(platform);
        continue;
      }

      const validation = await tokenValidatorService.validatePlatformToken(platform, credentials);
      
      if (!validation.isValid) {
        invalidPlatforms.push(platform);
      }
    }

    if (missingPlatforms.length > 0 || invalidPlatforms.length > 0) {
      const errorMessage = [];
      
      if (missingPlatforms.length > 0) {
        errorMessage.push(`Missing platforms: ${missingPlatforms.join(', ')}`);
      }
      
      if (invalidPlatforms.length > 0) {
        errorMessage.push(`Invalid tokens for: ${invalidPlatforms.join(', ')}`);
      }

      res.status(403).json({
        success: false,
        error: {
          message: 'Platform authentication failed',
          details: errorMessage.join('; ')
        }
      });
      return;
    }

    next();
  };
};

/**
 * Any Platform Guard
 * Validates that user has at least one valid token from specified platforms
 */
export const anyPlatformGuard = (platforms: SocialPlatform[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
      return;
    }

    const validationResults = await Promise.all(
      platforms.map(async (platform) => {
        const credentials = platformAccountService.getPlatformCredentials(req.user!, platform);
        
        if (!credentials) {
          return false;
        }

        const validation = await tokenValidatorService.validatePlatformToken(platform, credentials);
        return validation.isValid;
      })
    );
    
    const hasValidPlatform = validationResults.some(isValid => isValid);

    if (!hasValidPlatform) {
      res.status(403).json({
        success: false,
        error: {
          message: `At least one valid platform token required from: ${platforms.join(', ')}`
        }
      });
      return;
    }

    next();
  };
};

// Convenience guards for specific platforms
export const instagramGuard = platformTokenGuard('instagram');
export const facebookGuard = platformTokenGuard('facebook');
export const twitterGuard = platformTokenGuard('twitter');
export const linkedinGuard = platformTokenGuard('linkedin');
export const tiktokGuard = platformTokenGuard('tiktok');
export const youtubeGuard = platformTokenGuard('youtube');