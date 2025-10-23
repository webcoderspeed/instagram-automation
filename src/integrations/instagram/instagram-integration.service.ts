import axios from "axios";
import { AuthenticatedUser } from "../../types/user.types";
import { SessionUser } from "../../config/session.config";
import { PlatformAccount } from "../../types/platform.types";
import { SocialPlatform } from "../../types/common.types";
import envConfig from "../../config/env.config";
import logger from "../../utils/logger";
import { instagramTokenService } from "./instagram-token.service";
import { PlatformAccountModel } from "../../models/platform-account.model";
import { PlatformAccountEncryption } from "../../utils/platform-account-encryption";

// Import specialized services
import { instagramAuthService } from "./auth/auth.service";
import { instagramProfileService } from "./profile/profile.service";
import { instagramMediaService } from "./media/media.service";
import { instagramMessagingService } from "./messaging/messaging.service";
import { instagramInsightsService } from "./insights/insights.service";
import { instagramContentPublishingService } from "./content-publishing/content-publishing.service";



interface InstagramTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InstagramUserProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

interface TokenExchangeParams {
  client_id: string;
  client_secret: string;
  grant_type: string;
  redirect_uri: string;
  code: string;
}

interface LongLivedTokenParams {
  grant_type: string;
  client_secret: string;
  access_token: string;
}

export interface InstagramAuthUrl {
  authUrl: string;
  state: string;
}

export interface InstagramCallbackResult {
  success: boolean;
  platformAccount?: PlatformAccount;
  error?: string;
}

export interface InstagramConnectionStatus {
  isConnected: boolean;
  accountInfo?: {
    id: string;
    username: string;
    name: string;
  };
  tokenStatus?: {
    isValid: boolean;
    expiresAt?: Date;
    needsRefresh: boolean;
  };
}

export class InstagramIntegrationService {
  private readonly baseUrl = envConfig.INSTAGRAM_API_BASE_URL;
  private readonly graphUrl = envConfig.INSTAGRAM_GRAPH_API_BASE_URL;

  // Specialized service instances
  public readonly auth = instagramAuthService;
  public readonly profile = instagramProfileService;
  public readonly media = instagramMediaService;
  public readonly messaging = instagramMessagingService;
  public readonly insights = instagramInsightsService;
  public readonly contentPublishing = instagramContentPublishingService;

  /**
   * Generate Instagram OAuth authorization URL
   */
  getAuthUrl(userId: string): InstagramAuthUrl {
    const authUrl = this.auth.generateAuthUrl(userId, [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights'
    ]);

    // Extract state from URL for backward compatibility
    const urlParams = new URLSearchParams(authUrl.split('?')[1]);
    const state = urlParams.get('state') || '';

    logger.info("Generated Instagram auth URL", { userId, state });
    return { authUrl, state };
  }

  /**
   * Handle Instagram OAuth callback
   */
  async handleCallback(
    code: string,
    state: string,
    user: AuthenticatedUser
  ): Promise<InstagramCallbackResult> {
    try {
      // Validate state using auth service
      if (!this.auth.validateState(state, user.id)) {
        return {
          success: false,
          error: "Invalid state parameter",
        };
      }

      // Exchange code for short-lived token
      const shortLivedTokenResponse = await this.auth.exchangeCodeForToken(code);
      if (!shortLivedTokenResponse || !shortLivedTokenResponse.access_token) {
        return {
          success: false,
          error: "Failed to exchange code for token",
        };
      }

      // Exchange for long-lived token
      const longLivedToken = await this.auth.exchangeForLongLivedToken(
        shortLivedTokenResponse.access_token
      );
      if (!longLivedToken || !longLivedToken.access_token) {
        return {
          success: false,
          error: "Failed to get long-lived token",
        };
      }

      // Get comprehensive user profile using profile service
      const profileResponse = await this.profile.getUserProfile({
        access_token: longLivedToken.access_token,
        fields: [
          'user_id', 
          'username', 
          'name', 
          'profile_picture_url',
          'account_type',
          'followers_count',
          'follows_count',
          'media_count',
          'biography',
          'website',
        ]
      });
      
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: "Failed to fetch user profile",
        };
      }

      const userProfile = profileResponse.data;

      // Fetch initial media data for additional insights
      let initialMediaData = null;
      let latestPostDate = null;
      try {
        const mediaResponse = await this.media.getUserMedia({
          access_token: longLivedToken.access_token,
          fields: ['id', 'timestamp', 'media_type', 'like_count', 'comments_count'],
          limit: 5 // Get last 5 posts for engagement calculation
        });
        
        if (mediaResponse.success && mediaResponse.data) {
          initialMediaData = mediaResponse.data;
          // Get the latest post date
          if (initialMediaData.data && initialMediaData.data.length > 0) {
            latestPostDate = new Date(initialMediaData.data[0].timestamp);
          }
        }
      } catch (error) {
        logger.warn("Failed to fetch initial media data", { 
          userId: user.id,
          instagramId: userProfile.user_id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }

      // Fetch account insights if it's a business account
      let accountInsights = null;
      if (userProfile.account_type === 'BUSINESS' || userProfile.account_type === 'CREATOR') {
        try {
          const insightsResponse = await this.insights.getAccountInsights({
            access_token: longLivedToken.access_token,
            metric: [
              'reach',
              'follower_count',
              'profile_views',
              'accounts_engaged',
              'total_interactions',
              'website_clicks'
            ],
            period: 'day'
          });

          console.log('insightsResponse', insightsResponse);
          
          if (insightsResponse.success && insightsResponse.data) {
            accountInsights = insightsResponse.data;
          }
        } catch (error) {
          logger.warn("Failed to fetch account insights", { 
            userId: user.id,
            instagramId: userProfile.user_id,
            accountType: userProfile.account_type,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Calculate basic engagement rate if we have media data
      let engagementRate = 0;
      if (initialMediaData?.data && initialMediaData.data.length > 0 && userProfile.followers_count > 0) {
        const totalEngagement = initialMediaData.data.reduce((sum: number, post: any) => {
          return sum + (post.like_count || 0) + (post.comments_count || 0);
        }, 0);
        const avgEngagement = totalEngagement / initialMediaData.data.length;
        engagementRate = (avgEngagement / userProfile.followers_count) * 100;
      }

      // Create platform account with comprehensive data
      const platformAccount: PlatformAccount = {
        id: userProfile.user_id,
        userId: user.id,
        platform: "instagram" as SocialPlatform,
        platformUserId: userProfile.user_id,
        username: userProfile.username,
        displayName: userProfile.name ?? userProfile.username,
        profilePicture: userProfile.profile_picture_url,
        isVerified: false,
        followerCount: userProfile.followers_count,
        followingCount: userProfile.follows_count,
        postCount: userProfile.media_count,
        isActive: true,
        credentials: {
          accessToken: longLivedToken.access_token,
          refreshToken: undefined, // Instagram doesn't provide refresh tokens
          expiresAt: instagramTokenService.calculateExpirationDate(
            longLivedToken.expires_in
          ),
          scope: [
            "instagram_business_basic",
            "instagram_business_manage_messages",
            "instagram_business_manage_comments", 
            "instagram_business_content_publish",
            "instagram_business_manage_insights"
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: new Date(),
        metadata: {
          accountType: userProfile.account_type,
          biography: userProfile.biography,
          website: userProfile.website,
          instagramId: userProfile.id, // Secondary Instagram ID
          engagementRate: engagementRate,
          lastPostDate: latestPostDate,
          initialConnectionData: {
            fetchedAt: new Date(),
            profileFields: [
              'user_id', 
              'username', 
              'name', 
              'profile_picture_url',
              'account_type',
              'followers_count',
              'follows_count',
              'media_count',
              'biography',
              'website',
            ],
            mediaDataFetched: initialMediaData !== null,
            mediaCount: initialMediaData?.data?.length || 0,
            insightsDataFetched: accountInsights !== null,
            accountInsights: accountInsights
          }
        }
      };

      logger.info("Instagram OAuth callback successful", {
        userId: user.id,
        instagramId: userProfile.user_id,
        username: userProfile.username,
      });

      return {
        success: true,
        platformAccount,
      };
    } catch (error) {
      logger.error("Instagram OAuth callback failed", {
        userId: user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: "OAuth callback failed",
      };
    }
  }

  /**
   * Test Instagram connection
   */
  async testConnection(user: AuthenticatedUser): Promise<boolean> {
    try {
      const account = user.connectedAccounts.instagram;
      if (!account?.credentials?.accessToken) {
        return false;
      }

      // Validate token using auth service
      const isTokenValid = await this.auth.validateAccessToken(account.credentials.accessToken);
      if (!isTokenValid) {
        return false;
      }

      // Test API call using profile service
      const profileResponse = await this.profile.getUserProfile({
        access_token: account.credentials.accessToken,
        fields: ['user_id', 'username']
      });
      
      return profileResponse.success;
    } catch (error) {
      logger.error("Instagram connection test failed", {
        userId: user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(
    user: AuthenticatedUser
  ): Promise<InstagramConnectionStatus> {
    const account = user.connectedAccounts.instagram;

    if (!account) {
      return { isConnected: false };
    }

    const tokenStatus = instagramTokenService.validateToken(
      account.credentials
    );

    return {
      isConnected: account.isActive && tokenStatus.isValid,
      accountInfo: {
        id: account.id,
        username: account.username,
        name: account.displayName,
      },
      tokenStatus: {
        isValid: tokenStatus.isValid,
        expiresAt: account.credentials.expiresAt,
        needsRefresh: tokenStatus.needsRefresh || false,
      },
    };
  }

  /**
   * Check and refresh token if needed
   */
  async checkAndRefreshToken(user: AuthenticatedUser): Promise<boolean> {
    try {
      const account = user.connectedAccounts.instagram;
      if (!account?.credentials) {
        return false;
      }

      const tokenInfo = instagramTokenService.getTokenInfo(account.credentials);

      // Instagram long-lived tokens can be refreshed before expiry
      if (tokenInfo.needsRefresh) {
        const refreshResult = await this.auth.refreshLongLivedToken(
          account.credentials.accessToken
        );

        if (refreshResult.success && refreshResult.newToken) {
          // Update credentials with new token
          account.credentials.accessToken = refreshResult.newToken.access_token;
          account.credentials.expiresAt =
            instagramTokenService.calculateExpirationDate(
              refreshResult.newToken.expires_in
            );
          account.lastSyncAt = new Date();

          // Save the updated credentials to the database
          await this.savePlatformAccountCredentials(user.id, account);

          logger.info("Instagram token refreshed successfully", {
            userId: user.id,
            instagramId: account.id,
          });

          return true;
        }
      }

      return tokenInfo.isValid;
    } catch (error) {
      logger.error("Instagram token refresh failed", {
        userId: user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Convenience methods that delegate to specialized services

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string, fields?: string[]) {
    return this.profile.getUserProfile({
      access_token: accessToken,
      fields
    });
  }

  /**
   * Get user media
   */
  async getUserMedia(accessToken: string, options?: { limit?: number; after?: string; before?: string }) {
    return this.media.getUserMedia({
      access_token: accessToken,
      ...options
    });
  }

  /**
   * Send message
   */
  async sendMessage(accessToken: string, recipientId: string, text: string) {
    return this.messaging.sendTextMessage(recipientId, text, accessToken);
  }

  /**
   * Get account insights
   */
  async getAccountInsights(
    accessToken: string, 
    period: 'day' | 'week' | 'days_28' | 'lifetime' = 'day'
  ) {
    return this.insights.getAccountInsights({
      access_token: accessToken,
      metric: [
        'reach',
        'follower_count',
        'profile_views',
        'accounts_engaged',
        'total_interactions',
        'website_clicks'
      ],
      period
    });
  }

  /**
   * Create and publish media
   */
  async createAndPublishMedia(accessToken: string, mediaUrl: string, caption?: string) {
    return this.contentPublishing.createAndPublishMedia({
      access_token: accessToken,
      media_url: mediaUrl,
      caption
    });
  }

  /**
   * Save updated platform account credentials to the database
   */
  private async savePlatformAccountCredentials(userId: string, account: PlatformAccount): Promise<void> {
    try {
      // Find the platform account in the database
      const platformAccount = await PlatformAccountModel.findOne({
        userId,
        platform: account.platform,
        id: account.platformUserId
      });

      // Decrypt tokens after retrieval
      PlatformAccountEncryption.decryptTokensAfterRetrieve(platformAccount);

      if (platformAccount) {
        // Update the credentials
        platformAccount.accessToken = account.credentials.accessToken;
        if (account.credentials.refreshToken) {
          platformAccount.refreshToken = account.credentials.refreshToken;
        }
        if (account.credentials.expiresAt) {
          platformAccount.tokenExpiresAt = account.credentials.expiresAt;
        }
        platformAccount.lastSyncAt = account.lastSyncAt || new Date();

        // Encrypt tokens before saving
        PlatformAccountEncryption.encryptTokensOnInstance(platformAccount);
        await platformAccount.save();

        logger.info("Platform account credentials updated successfully", {
          userId,
          platform: account.platform,
          platformUserId: account.platformUserId
        });
      } else {
        logger.warn("Platform account not found for credential update", {
          userId,
          platform: account.platform,
          platformUserId: account.platformUserId
        });
      }
    } catch (error) {
      logger.error("Failed to save platform account credentials", {
        userId,
        platform: account.platform,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  // New methods for SessionUser that fetch platform account data from database

  /**
   * Test connection using SessionUser (fetches platform account from DB)
   */
  async testConnectionFromDB(userId: string): Promise<boolean> {
    try {
      const platformAccount = await PlatformAccountModel.findOne({
        userId,
        platform: 'instagram',
        isActive: true
      });

      // Decrypt tokens after retrieval
      PlatformAccountEncryption.decryptTokensAfterRetrieve(platformAccount);

      if (!platformAccount?.accessToken) {
        return false;
      }

      // Validate token using auth service
      const isTokenValid = await this.auth.validateAccessToken(platformAccount.accessToken);
      if (!isTokenValid) {
        return false;
      }

      // Test API call using profile service
      const profileResponse = await this.profile.getUserProfile({
        access_token: platformAccount.accessToken,
        fields: ['user_id', 'username']
      });
      
      return profileResponse.success;
    } catch (error) {
      logger.error("Instagram connection test failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Get connection status using SessionUser (fetches platform account from DB)
   */
  async getConnectionStatusFromDB(userId: string): Promise<InstagramConnectionStatus> {
    const platformAccount = await PlatformAccountModel.findOne({
      userId,
      platform: 'instagram'
    });

    if (!platformAccount) {
      return { isConnected: false };
    }

    // Decrypt tokens after retrieval
    PlatformAccountEncryption.decryptTokensAfterRetrieve(platformAccount);

    const tokenStatus = instagramTokenService.validateToken({
      accessToken: platformAccount.accessToken,
      refreshToken: platformAccount.refreshToken,
      expiresAt: platformAccount.tokenExpiresAt
    });

    return {
       isConnected: platformAccount.isActive && tokenStatus.isValid,
       accountInfo: {
         id: platformAccount.id,
         username: platformAccount.username,
         name: platformAccount.displayName || platformAccount.username,
       },
      tokenStatus: {
        isValid: tokenStatus.isValid,
        expiresAt: platformAccount.tokenExpiresAt,
        needsRefresh: tokenStatus.needsRefresh || false,
      },
    };
  }

  /**
   * Check and refresh token using SessionUser (fetches platform account from DB)
   */
  async checkAndRefreshTokenFromDB(userId: string): Promise<boolean> {
    try {
      const platformAccount = await PlatformAccountModel.findOne({
        userId,
        platform: 'instagram',
        isActive: true
      });

      if (!platformAccount?.accessToken) {
        return false;
      }

      // Decrypt tokens after retrieval
      PlatformAccountEncryption.decryptTokensAfterRetrieve(platformAccount);

      const tokenInfo = instagramTokenService.getTokenInfo({
        accessToken: platformAccount.accessToken,
        refreshToken: platformAccount.refreshToken,
        expiresAt: platformAccount.tokenExpiresAt
      });

      // Instagram long-lived tokens can be refreshed before expiry
      if (tokenInfo.needsRefresh) {
        const refreshResult = await this.auth.refreshLongLivedToken(
          platformAccount.accessToken
        );

        if (refreshResult.success && refreshResult.newToken) {
          // Update credentials with new token
          platformAccount.accessToken = refreshResult.newToken.access_token;
          if (refreshResult.newToken.expires_in) {
            platformAccount.tokenExpiresAt = instagramTokenService.calculateExpirationDate(
              refreshResult.newToken.expires_in
            );
          }
          platformAccount.lastSyncAt = new Date();

          // Encrypt tokens before saving
          PlatformAccountEncryption.encryptTokensOnInstance(platformAccount);
          await platformAccount.save();

          logger.info("Instagram token refreshed successfully", {
            userId,
            instagramId: platformAccount.id,
          });

          return true;
        }
      }

      return tokenInfo.isValid;
    } catch (error) {
      logger.error("Instagram token refresh failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }
}

export const instagramIntegrationService = new InstagramIntegrationService();
