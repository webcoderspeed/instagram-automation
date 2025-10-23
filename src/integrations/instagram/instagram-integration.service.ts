import axios from "axios";
import { AuthenticatedUser } from "../../types/user.types";
import { PlatformAccount } from "../../types/platform.types";
import { SocialPlatform } from "../../types/common.types";
import envConfig from "../../config/env.config";
import logger from "../../utils/logger";
import { instagramTokenService } from "./instagram-token.service";



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

  /**
   * Generate Instagram OAuth authorization URL
   */
  getAuthUrl(userId: string): InstagramAuthUrl {
    const state = this.generateState(userId);
    const params = new URLSearchParams({
      force_reauth: "true",
      client_id: envConfig.INSTAGRAM_APP_ID,
      redirect_uri: envConfig.INSTAGRAM_REDIRECT_URI,
      response_type: "code",
      scope:
        "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights",
      state,
    });

    const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;

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
      // Validate state
      if (!this.validateState(state, user.id)) {
        return {
          success: false,
          error: "Invalid state parameter",
        };
      }

      // Exchange code for short-lived token
      const shortLivedTokenResponse = await this.exchangeCodeForToken(code);
      if (!shortLivedTokenResponse || !shortLivedTokenResponse.access_token) {
        return {
          success: false,
          error: "Failed to exchange code for token",
        };
      }

      // Exchange for long-lived token
      const longLivedToken = await this.exchangeForLongLivedToken(
        shortLivedTokenResponse.access_token
      );
      if (!longLivedToken) {
        return {
          success: false,
          error: "Failed to get long-lived token",
        };
      }

      // Get user profile
      const userProfile = await this.getUserProfileForOAuth(
        longLivedToken.access_token
      );
      if (!userProfile) {
        return {
          success: false,
          error: "Failed to fetch user profile",
        };
      }

      // Create platform account
      const platformAccount: PlatformAccount = {
        id: userProfile.id,
        userId: user.id,
        platform: "instagram" as SocialPlatform,
        platformUserId: userProfile.id,
        username: userProfile.username,
        displayName: userProfile.name || userProfile.username,
        profilePicture: userProfile.profile_picture_url,
        isVerified: false,
        isActive: true,
        credentials: {
          accessToken: longLivedToken.access_token,
          refreshToken: undefined, // Instagram doesn't provide refresh tokens
          expiresAt: instagramTokenService.calculateExpirationDate(
            longLivedToken.expires_in
          ),
          scope: ["user_profile", "user_media"],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: new Date(),
      };

      logger.info("Instagram OAuth callback successful", {
        userId: user.id,
        instagramId: userProfile.id,
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

      // Validate token
      const tokenValidation = instagramTokenService.validateToken(
        account.credentials
      );
      if (!tokenValidation.isValid) {
        return false;
      }

      // Test API call
      const response = await fetch(
        `${this.graphUrl}/me?fields=id,username&access_token=${account.credentials.accessToken}`
      );
      return response.ok;
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
        const refreshResult = await instagramTokenService.refreshLongLivedToken(
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

  /**
   * Exchange authorization code for short-lived token
   */
  private async exchangeCodeForToken(
    code: string
  ): Promise<InstagramTokenResponse | null> {
    try {
      const params: TokenExchangeParams = {
        client_id: envConfig.INSTAGRAM_APP_ID,
        client_secret: envConfig.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: envConfig.INSTAGRAM_REDIRECT_URI,
        code,
      };

      logger.info("Exchanging code for token", {
        url: `${this.baseUrl}/oauth/access_token`,
        params: { ...params, client_secret: "[REDACTED]" },
      });

      const response = await axios.post<InstagramTokenResponse>(
        `${this.baseUrl}/oauth/access_token`,
        {
          client_id: params.client_id,
          client_secret: params.client_secret,
          grant_type: params.grant_type,
          redirect_uri: params.redirect_uri,
          code: params.code,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      logger.info("Token exchange successful", {
        hasAccessToken: !!response.data.access_token,
        tokenType: response.data.token_type,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as {
          response?: { status?: number; statusText?: string; data?: unknown };
          message?: string;
        };
        logger.error("Token exchange failed", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          response: axiosError.response?.data,
          message: axiosError.message,
        });
      } else {
        logger.error("Failed to exchange code for token", {
          error: error instanceof Error ? error.message : String(error),
          code: code?.substring(0, 10) + "...",
        });
      }
      return null;
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  private async exchangeForLongLivedToken(
    shortLivedToken: string
  ): Promise<InstagramLongLivedTokenResponse | null> {
    try {
      logger.info("Exchanging for long-lived token", {
        url: `${this.graphUrl}/access_token`,
        params: {
            grant_type: "ig_exchange_token",
            client_secret: envConfig.INSTAGRAM_APP_SECRET,
            access_token: shortLivedToken,
        },
      });

      const response = await axios.get<InstagramLongLivedTokenResponse>(
        `${this.graphUrl}/access_token`,
        {
          params: {
            grant_type: "ig_exchange_token",
            client_secret: envConfig.INSTAGRAM_APP_SECRET,
            access_token: shortLivedToken,
          },
        }
      );

      logger.info("Long-lived token exchange successful", {
        hasAccessToken: !!response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as {
          response?: { status?: number; statusText?: string; data?: unknown };
          message?: string;
        };
        logger.error("Long-lived token exchange failed", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          response: axiosError.response?.data,
          url: `${this.graphUrl}/access_token`,
          message: axiosError.message,
        });
      } else {
        logger.error("Failed to exchange for long-lived token", {
          error: error instanceof Error ? error.message : String(error),
          shortLivedToken: shortLivedToken?.substring(0, 20) + "...",
        });
      }
      return null;
    }
  }

  /**
   * Get user profile for OAuth
   */
  private async getUserProfileForOAuth(
    accessToken: string
  ): Promise<InstagramUserProfile | null> {
    try {
      const response = await axios.get<InstagramUserProfile>(
        `${this.graphUrl}/me`,
        {
          params: {
            fields: "id,username,name,profile_picture_url",
            access_token: accessToken,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as {
          response?: { status?: number; statusText?: string; data?: unknown };
          message?: string;
        };
        logger.error("Profile fetch failed", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          response: axiosError.response?.data,
          message: axiosError.message,
        });
      } else {
        logger.error("Failed to fetch user profile", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return null;
    }
  }

  /**
   * Generate state parameter for OAuth
   */
  private generateState(userId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return Buffer.from(`${userId}:${timestamp}:${random}`).toString("base64");
  }

  /**
   * Validate state parameter
   */
  private validateState(state: string, userId: string): boolean {
    try {
      const decoded = Buffer.from(state, "base64").toString();
      const [stateUserId, timestamp] = decoded.split(":");

      // Check if user ID matches
      if (stateUserId !== userId) {
        return false;
      }

      // Check if state is not too old (5 minutes)
      const stateTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      return now - stateTime <= maxAge;
    } catch (error) {
      logger.error("State validation failed", { error });
      return false;
    }
  }
}

export const instagramIntegrationService = new InstagramIntegrationService();
