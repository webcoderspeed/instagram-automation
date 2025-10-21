import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';

export interface InstagramAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

export class InstagramAuthService {
  private config: InstagramAuthConfig;
  // Updated to use Instagram Business Login endpoint
  private readonly INSTAGRAM_OAUTH_URL = 'https://www.instagram.com/oauth/authorize';
  private readonly INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';

  constructor(config: InstagramAuthConfig) {
    this.config = config;
    logger.info('Instagram Auth Service initialized');
  }

  /**
   * Generate OAuth authorization URL for Instagram Business Login
   * Updated to use new Instagram Business scope values (old scopes deprecated Jan 27, 2025)
   */
  generateAuthUrl(scopes: string[] = ['instagram_business_basic', 'instagram_business_content_publish']): string {
    const state = this.generateState();
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: state
    });

    const authUrl = `${this.INSTAGRAM_OAUTH_URL}?${params.toString()}`;
    logger.info('Generated Instagram OAuth URL', { scopes, state });
    return authUrl;
  }

  /**
   * Exchange authorization code for short-lived access token
   */
  async exchangeCodeForToken(code: string): Promise<AccessTokenResponse> {
    try {
      logger.info('Exchanging authorization code for access token');
      
      const response = await axios.post(this.INSTAGRAM_TOKEN_URL, {
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      logger.info('Successfully obtained short-lived access token');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to exchange code for token', { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   * Updated to use Instagram Graph API endpoint as per Business Login documentation
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse> {
    try {
      logger.info('Exchanging short-lived token for long-lived token');
      
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.config.appSecret,
        access_token: shortLivedToken
      });

      const response = await axios.get(`https://graph.instagram.com/access_token?${params.toString()}`);
      
      logger.info('Successfully obtained long-lived access token', { 
        expires_in: response.data.expires_in 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to exchange for long-lived token', { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Long-lived token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Refresh long-lived token (extends expiry by 60 days)
   * Updated to use Instagram Graph API endpoint as per Business Login documentation
   */
  async refreshLongLivedToken(longLivedToken: string): Promise<LongLivedTokenResponse> {
    try {
      logger.info('Refreshing long-lived token');
      
      const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: longLivedToken
        }
      });

      logger.info('Long-lived token refreshed successfully', { 
        expiresIn: response.data.expires_in 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Error refreshing long-lived token', { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Token refresh failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get user information using access token
   * Uses Facebook Graph API for Instagram Business account information
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      logger.info('Fetching user information');
      
      const response = await axios.get('https://graph.facebook.com/v24.0/me', {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      logger.info('User information retrieved successfully', { 
        userId: response.data.id,
        username: response.data.username 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching user information', { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to get user info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken);
      return true;
    } catch (error) {
      logger.warn('Token validation failed', { error });
      return false;
    }
  }

  /**
   * Generate secure state parameter for OAuth
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify state parameter
   */
  verifyState(receivedState: string, expectedState: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(receivedState),
      Buffer.from(expectedState)
    );
  }
}

// Export singleton instance
export const createAuthService = (config: InstagramAuthConfig): InstagramAuthService => {
  return new InstagramAuthService(config);
};