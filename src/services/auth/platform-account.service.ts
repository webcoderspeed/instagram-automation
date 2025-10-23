import { SocialPlatform } from '../../types/common.types';
import { PlatformCredentials } from '../../types/platform.types';
import { AuthenticatedUser } from '../../types/user.types';
import { SessionUser } from '../../config/session.config';
import { PlatformAccountModel } from '../../models/platform-account.model';
import logger from '../../utils/logger';
import { PlatformAccountEncryption } from '../../utils/platform-account-encryption';

import { PlatformAccount } from '../../types/platform.types';

export class PlatformAccountService {
  /**
   * Gets platform account for a user from database
   */
  async getPlatformAccountFromDB(userId: string, platform: SocialPlatform): Promise<PlatformAccount | null> {
    try {
      const account = await PlatformAccountModel.findOne({
        userId,
        platform,
        isActive: true,
        deletedAt: null
      });

      if (!account) {
        logger.debug(`No ${platform} account found for user ${userId}`);
        return null;
      }

      // Decrypt tokens after retrieval
      PlatformAccountEncryption.decryptTokensAfterRetrieve(account);

      return {
        id: String(account._id),
        userId: String(account.userId),
        platform: account.platform,
        platformUserId: account.id,
        username: account.username,
        displayName: account.displayName || account.username,
        email: account.platformData?.email as string,
        profilePicture: account.profilePicture,
        isVerified: account.isVerified || false,
        followerCount: account.stats?.totalFollowers,
        followingCount: account.stats?.totalFollowing,
        postCount: account.stats?.totalPosts,
        credentials: {
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          expiresAt: account.tokenExpiresAt,
          scope: account.scopes,
          tokenType: 'Bearer'
        },
        isActive: account.isActive,
        lastSyncAt: account.lastSyncAt,
        metadata: account.metadata,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      } as PlatformAccount;
    } catch (error) {
      logger.error(`Error fetching ${platform} account for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Gets platform credentials for a session user
   */
  async getPlatformCredentialsFromDB(userId: string, platform: SocialPlatform): Promise<PlatformCredentials | null> {
    const account = await this.getPlatformAccountFromDB(userId, platform);
    return account?.credentials || null;
  }

  /**
   * Gets platform account for a user (legacy method for AuthenticatedUser)
   */
  getPlatformAccount(user: AuthenticatedUser, platform: SocialPlatform): PlatformAccount | null {
    const account = user.connectedAccounts[platform];
    if (!account) {
      logger.debug(`No ${platform} account found for user ${user.id}`);
      return null;
    }

    return account;
  }

  /**
   * Gets platform credentials for a user
   */
  getPlatformCredentials(user: AuthenticatedUser, platform: SocialPlatform): PlatformCredentials | null {
    if (!user) {
      return null;
    }

    const account = this.getPlatformAccount(user, platform);
    return account?.credentials ?? null;
  }

  /**
   * Checks if user has active platform account
   */
  hasActivePlatformAccount(user: AuthenticatedUser, platform: SocialPlatform): boolean {
    const account = this.getPlatformAccount(user, platform);
    return !!(account && account.isActive && account.credentials.accessToken);
  }

  /**
   * Gets all connected platforms for a user
   */
  getConnectedPlatforms(user: AuthenticatedUser): SocialPlatform[] {
    return Object.keys(user.connectedAccounts).filter(platform => 
      this.hasActivePlatformAccount(user, platform as SocialPlatform)
    ) as SocialPlatform[];
  }

  /**
   * Checks if user has any of the specified platforms connected
   */
  hasAnyPlatform(user: AuthenticatedUser, platforms: SocialPlatform[]): boolean {
    return platforms.some(platform => this.hasActivePlatformAccount(user, platform));
  }

  /**
   * Checks if user has all specified platforms connected
   */
  hasAllPlatforms(user: AuthenticatedUser, platforms: SocialPlatform[]): boolean {
    return platforms.every(platform => this.hasActivePlatformAccount(user, platform));
  }

  /**
   * Gets missing platforms from required list
   */
  getMissingPlatforms(user: AuthenticatedUser, requiredPlatforms: SocialPlatform[]): SocialPlatform[] {
    return requiredPlatforms.filter(platform => !this.hasActivePlatformAccount(user, platform));
  }

  /**
   * Validates platform account status
   */
  validatePlatformAccount(user: AuthenticatedUser, platform: SocialPlatform): {
    isValid: boolean;
    error?: string;
  } {
    const account = this.getPlatformAccount(user, platform);
    
    if (!account) {
      return {
        isValid: false,
        error: `${platform} account not connected`
      };
    }

    if (!account.isActive) {
      return {
        isValid: false,
        error: `${platform} account is inactive`
      };
    }

    if (!account.credentials.accessToken) {
      return {
        isValid: false,
        error: `${platform} access token is missing`
      };
    }

    return { isValid: true };
  }
}

export const platformAccountService = new PlatformAccountService();