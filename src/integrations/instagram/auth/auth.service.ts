import axios from 'axios';
import crypto from 'crypto';
import logger from '../../../utils/logger';
import { instagramTokenService } from '../instagram-token.service';
import envConfig from '../../../config/env.config';
import { 
  InstagramOAuthConfig,
  AuthorizationRequest,
  TokenExchangeRequest,
  ShortLivedTokenResponse,
  LongLivedTokenRequest,
  LongLivedTokenResponse
} from '../types/instagram';

/**
 * Instagram Authentication Service
 * Handles OAuth flow, token management, and authentication
 */
export class InstagramAuthService {
  private readonly baseUrl = 'https://api.instagram.com';
  private readonly graphUrl = 'https://graph.instagram.com/v24.0';
  private readonly stateStore = new Map<string, { userId: string; timestamp: number }>();

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(userId: string, scopes: string[] = ['user_profile', 'user_media']): string {
    const state = this.generateState(userId);
    const scopeString = scopes.join(',');

    const params = new URLSearchParams({
      client_id: envConfig.INSTAGRAM_APP_ID,
      redirect_uri: envConfig.INSTAGRAM_REDIRECT_URI,
      scope: scopeString,
      response_type: 'code',
      state,
    });

    const authUrl = `${this.baseUrl}/oauth/authorize?${params.toString()}`;

    logger.info('Generated Instagram OAuth URL', {
      userId,
      scopes: scopeString,
      state,
    });

    return authUrl;
  }

  /**
   * Generate and store OAuth state parameter
   */
  private generateState(userId: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      userId,
      timestamp: Date.now(),
    });

    // Clean up old states (older than 1 hour)
    this.cleanupOldStates();

    return state;
  }

  /**
   * Validate OAuth state parameter
   */
  validateState(state: string, userId: string): boolean {
    const storedState = this.stateStore.get(state);

    if (!storedState) {
      logger.warn('Invalid OAuth state: not found', { state, userId });
      return false;
    }

    if (storedState.userId !== userId) {
      logger.warn('Invalid OAuth state: user mismatch', {
        state,
        expectedUserId: userId,
        actualUserId: storedState.userId,
      });
      return false;
    }

    // Check if state is not older than 1 hour
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - storedState.timestamp > oneHour) {
      logger.warn('Invalid OAuth state: expired', { state, userId });
      this.stateStore.delete(state);
      return false;
    }

    // Remove used state
    this.stateStore.delete(state);
    return true;
  }

  /**
   * Clean up old state entries
   */
  private cleanupOldStates(): void {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.timestamp > oneHour) {
        this.stateStore.delete(state);
      }
    }
  }

  /**
   * Exchange authorization code for short-lived token
   */
  async exchangeCodeForToken(code: string): Promise<ShortLivedTokenResponse | null> {
    try {
      const params: TokenExchangeRequest = {
        clientId: envConfig.INSTAGRAM_APP_ID,
        clientSecret: envConfig.INSTAGRAM_APP_SECRET,
        grantType: 'authorization_code',
        redirectUri: envConfig.INSTAGRAM_REDIRECT_URI,
        code,
      };

      logger.info('Exchanging code for token', {
        url: `${this.baseUrl}/oauth/access_token`,
        params: { ...params, clientSecret: '[REDACTED]' },
      });

      const response = await axios.post<ShortLivedTokenResponse>(
        `${this.baseUrl}/oauth/access_token`,
        {
          client_id: params.clientId,
          client_secret: params.clientSecret,
          grant_type: params.grantType,
          redirect_uri: params.redirectUri,
          code: params.code,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('Token exchange successful', {
        hasAccessToken: !!response.data.access_token,
        userId: response.data.user_id,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as {
          response?: { status?: number; statusText?: string; data?: unknown };
          message?: string;
        };
        logger.error('Token exchange failed', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          response: axiosError.response?.data,
          message: axiosError.message,
        });
      } else {
        logger.error('Token exchange failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return null;
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse | null> {
    try {
      const params: LongLivedTokenRequest = {
        grantType: 'ig_exchange_token',
        clientSecret: envConfig.INSTAGRAM_APP_SECRET,
        accessToken: shortLivedToken,
      };

      logger.info('Exchanging for long-lived token');

      const response = await axios.get<LongLivedTokenResponse>(
        `${this.graphUrl}/access_token`,
        {
          params: {
            grant_type: params.grantType,
            client_secret: params.clientSecret,
            access_token: params.accessToken,
          },
        }
      );

      logger.info('Long-lived token exchange successful', {
        expiresIn: response.data.expires_in,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as {
          response?: { status?: number; statusText?: string; data?: unknown };
          message?: string;
        };
        logger.error('Long-lived token exchange failed', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          response: axiosError.response?.data,
          message: axiosError.message,
        });
      } else {
        logger.error('Long-lived token exchange failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return null;
    }
  }

  /**
   * Get user profile for OAuth (minimal fields)
   */
  async getUserProfileForOAuth(accessToken: string): Promise<any | null> {
    try {
      const fields = 'id,username,name,profile_picture_url';
      const url = `${this.graphUrl}/me?fields=${fields}&access_token=${accessToken}`;

      logger.info('Fetching user profile for OAuth', {
        fields,
        url: url.replace(accessToken, '[REDACTED]'),
      });

      const response = await axios.get<any>(url);

      logger.info('User profile fetched for OAuth', {
        userId: response.data.id,
        username: response.data.username,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as {
          response?: { status?: number; statusText?: string; data?: unknown };
          message?: string;
        };
        logger.error('Failed to fetch user profile for OAuth', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          response: axiosError.response?.data,
          message: axiosError.message,
        });
      } else {
        logger.error('Failed to fetch user profile for OAuth', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return null;
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.graphUrl}/me?fields=id&access_token=${accessToken}`
      );
      return response.status === 200;
    } catch (error) {
      logger.error('Access token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Refresh long-lived token
   */
  async refreshLongLivedToken(accessToken: string): Promise<{
    success: boolean;
    newToken?: LongLivedTokenResponse;
    error?: string;
  }> {
    try {
      const refreshResult = await instagramTokenService.refreshLongLivedToken(accessToken);
      
      if (refreshResult.success && refreshResult.newToken) {
        return {
          success: true,
          newToken: {
            access_token: refreshResult.newToken.access_token,
            token_type: 'bearer',
            expires_in: refreshResult.newToken.expires_in,
          },
        };
      }
      
      return {
        success: false,
        error: refreshResult.error || 'Token refresh failed',
      };
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  /**
   * Revoke access token
   */
  async revokeAccessToken(accessToken: string): Promise<boolean> {
    try {
      // Instagram doesn't have a direct revoke endpoint
      // Users need to revoke access through Instagram app settings
      logger.info('Access token revocation requested', {
        note: 'Instagram requires manual revocation through app settings',
      });
      return true;
    } catch (error) {
      logger.error('Access token revocation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

    /**
   * Get userId from OAuth state parameter
   */
  getUserIdFromState(state: string): string | null {
    const storedState = this.stateStore.get(state);

    if (!storedState) {
      logger.warn('Invalid OAuth state: not found', { state });
      return null;
    }

    // Check if state is not older than 1 hour
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - storedState.timestamp > oneHour) {
      logger.warn('Invalid OAuth state: expired', { state });
      this.stateStore.delete(state);
      return null;
    }

    return storedState.userId;
  }
}

export const instagramAuthService = new InstagramAuthService();