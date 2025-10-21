/**
 * Instagram OAuth Service
 * Handles Instagram Business Login flow
 */

import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import logger from '../../utils/logger';
import {
  InstagramOAuthConfig,
  AuthorizationRequest,
  TokenExchangeRequest,
  ShortLivedTokenResponse,
  LongLivedTokenRequest,
  LongLivedTokenResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  InstagramUserInfo,
  OAuthError
} from './interfaces/instagram';
import { OAuthState, StoredToken, TokenValidationResult } from './interfaces/base';
import { INSTAGRAM_OAUTH_ENDPOINTS } from './types/endpoints';
import { DEFAULT_SCOPES, InstagramScopeValue } from './types/scopes';

export class OAuthService {
  private config: InstagramOAuthConfig;
  private stateStore: Map<string, OAuthState> = new Map();
  private tokenStore: Map<string, StoredToken> = new Map();

  constructor(config: InstagramOAuthConfig) {
    this.config = config;
    logger.info('OAuth Service initialized', {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes.length
    });
  }

  /**
   * Generate authorization URL for Instagram Business Login
   */
  generateAuthorizationUrl(
    scopes: InstagramScopeValue[] = DEFAULT_SCOPES,
    forceReauth: boolean = false,
    customState?: string
  ): { url: string; state: string } {
    const state = customState || this.generateState();
    const scopeString = scopes.join(',');

    // Store state for validation
    this.stateStore.set(state, {
      state,
      redirectUri: this.config.redirectUri,
      scopes,
      timestamp: Date.now()
    });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopeString,
      state
    });

    if (forceReauth) {
      params.append('force_reauth', 'true');
    }

    const authUrl = `${INSTAGRAM_OAUTH_ENDPOINTS.AUTHORIZATION}?${params.toString()}`;

    logger.info('Generated authorization URL', {
      state,
      scopes: scopeString,
      forceReauth
    });

    return { url: authUrl, state };
  }

  /**
   * Exchange authorization code for short-lived access token
   */
  async exchangeCodeForToken(code: string, state?: string): Promise<ShortLivedTokenResponse> {
    try {
      // Validate state if provided
      if (state) {
        const storedState = this.stateStore.get(state);
        if (!storedState) {
          logger.warn('Invalid or expired state parameter, proceeding without validation');
        } else {
          // Check state expiration (30 minutes)
          if (Date.now() - storedState.timestamp > 30 * 60 * 1000) {
            this.stateStore.delete(state);
            logger.warn('State parameter has expired, proceeding without validation');
          }
        }
      } else {
        logger.info('No state parameter provided, proceeding without state validation');
      }

      const tokenRequest: TokenExchangeRequest = {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        grantType: 'authorization_code',
        redirectUri: this.config.redirectUri,
        code
      };

      logger.info('Exchanging authorization code for access token', {
        clientId: tokenRequest.clientId,
        redirectUri: tokenRequest.redirectUri
      });

      const response: AxiosResponse = await axios.post(
        INSTAGRAM_OAUTH_ENDPOINTS.TOKEN_EXCHANGE,
        new URLSearchParams({
          client_id: tokenRequest.clientId,
          client_secret: tokenRequest.clientSecret,
          grant_type: tokenRequest.grantType,
          redirect_uri: tokenRequest.redirectUri,
          code: tokenRequest.code
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = response.data;

      if (tokenData.error) {
        throw new Error(`Token exchange failed: ${tokenData.error.error_message}`);
      }

      // Clean up used state if provided
      if (state) {
        this.stateStore.delete(state);
      }

      logger.info('Successfully exchanged code for short-lived token', {
        userId: tokenData.user_id
      });

      return {
        accessToken: tokenData.access_token,
        userId: tokenData.user_id
      };

    } catch (error: any) {
      logger.error('Failed to exchange code for token', {
        error: error.response?.data || error.message
      });
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.config.clientSecret,
        access_token: shortLivedToken
      });

      logger.info('Exchanging short-lived token for long-lived token');

      const response: AxiosResponse = await axios.get(
        `${INSTAGRAM_OAUTH_ENDPOINTS.LONG_LIVED_TOKEN}?${params.toString()}`
      );

      const tokenData = response.data;

      if (tokenData.error) {
        throw new Error(`Long-lived token exchange failed: ${tokenData.error.error_message}`);
      }

      logger.info('Successfully obtained long-lived token', {
        expiresIn: tokenData.expires_in
      });

      return {
        accessToken: tokenData.access_token,
        tokenType: 'bearer',
        expiresIn: tokenData.expires_in
      };

    } catch (error: any) {
      logger.error('Failed to get long-lived token', {
        error: error.response?.data || error.message
      });
      throw new Error(`Long-lived token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh long-lived access token
   */
  async refreshToken(accessToken: string): Promise<TokenRefreshResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: accessToken
      });

      logger.info('Refreshing access token');

      const response: AxiosResponse = await axios.get(
        `${INSTAGRAM_OAUTH_ENDPOINTS.REFRESH_TOKEN}?${params.toString()}`
      );

      const tokenData = response.data;

      if (tokenData.error) {
        throw new Error(`Token refresh failed: ${tokenData.error.error_message}`);
      }

      logger.info('Successfully refreshed token', {
        expiresIn: tokenData.expires_in
      });

      return {
        accessToken: tokenData.access_token,
        tokenType: 'bearer',
        expiresIn: tokenData.expires_in
      };

    } catch (error: any) {
      logger.error('Failed to refresh token', {
        error: error.response?.data || error.message
      });
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(accessToken: string): Promise<InstagramUserInfo> {
    try {
      const params = new URLSearchParams({
        fields: 'id,username,account_type,media_count',
        access_token: accessToken
      });

      const response: AxiosResponse = await axios.get(
        `${INSTAGRAM_OAUTH_ENDPOINTS.USER_INFO}?${params.toString()}`
      );

      const userData = response.data;

      if (userData.error) {
        throw new Error(`Failed to get user info: ${userData.error.error_message}`);
      }

      logger.info('Successfully retrieved user information', {
        userId: userData.id,
        username: userData.username,
        accountType: userData.account_type
      });

      return {
        id: userData.id,
        username: userData.username,
        accountType: userData.account_type,
        mediaCount: userData.media_count
      };

    } catch (error: any) {
      logger.error('Failed to get user info', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Validate token
   */
  async validateToken(accessToken: string): Promise<TokenValidationResult> {
    try {
      await this.getUserInfo(accessToken);
      return {
        isValid: true,
        needsRefresh: false
      };
    } catch (error: any) {
      logger.warn('Token validation failed', { error: error.message });
      return {
        isValid: false,
        needsRefresh: true,
        error: error.message
      };
    }
  }

  /**
   * Store token securely
   */
  storeToken(userId: string, token: StoredToken): void {
    this.tokenStore.set(userId, {
      ...token,
      updatedAt: Date.now()
    });
    logger.info('Token stored for user', { userId });
  }

  /**
   * Retrieve stored token
   */
  getStoredToken(userId: string): StoredToken | null {
    return this.tokenStore.get(userId) || null;
  }

  /**
   * Remove stored token
   */
  removeToken(userId: string): void {
    this.tokenStore.delete(userId);
    logger.info('Token removed for user', { userId });
  }

  /**
   * Generate secure random state
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up expired states
   */
  cleanupExpiredStates(): void {
    const now = Date.now();
    const expiredStates: string[] = [];

    for (const [state, stateData] of this.stateStore.entries()) {
      if (now - stateData.timestamp > 30 * 60 * 1000) { // 30 minutes
        expiredStates.push(state);
      }
    }

    expiredStates.forEach(state => this.stateStore.delete(state));
    
    if (expiredStates.length > 0) {
      logger.info('Cleaned up expired states', { count: expiredStates.length });
    }
  }
}