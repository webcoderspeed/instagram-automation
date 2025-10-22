/**
 * OAuth Controller
 * Handles HTTP requests for Instagram Business Login
 */

import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { OAuthService } from './oauth-service';
import { InstagramOAuthConfig } from './interfaces/instagram';
import { DEFAULT_SCOPES, InstagramScopeValue } from './types/scopes';

export class OAuthController {
  private oauthService: OAuthService;

  constructor(config: InstagramOAuthConfig) {
    this.oauthService = new OAuthService(config);
    logger.info('OAuth Controller initialized');
  }

  /**
   * Initiate OAuth flow - redirect to Instagram authorization
   */
  initiateAuth = async (req: Request, res: Response) => {
    try {
      const { 
        scopes = DEFAULT_SCOPES, 
        force_reauth = false,
        state: customState 
      } = req.query;

      // Parse scopes if provided as string
      let scopeArray: InstagramScopeValue[] = DEFAULT_SCOPES;
      if (typeof scopes === 'string') {
        scopeArray = scopes.split(',') as InstagramScopeValue[];
      } else if (Array.isArray(scopes)) {
        scopeArray = scopes as InstagramScopeValue[];
      }

      const { url, state } = this.oauthService.generateAuthorizationUrl(
        scopeArray,
        force_reauth === 'true',
        customState as string
      );

      logger.info('Initiating OAuth flow', {
        scopes: scopeArray,
        forceReauth: force_reauth,
        state
      });

      res.redirect(url);

    } catch (error: any) {
      logger.error('Failed to initiate OAuth flow', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to initiate OAuth flow',
        message: error.message
      });
    }
  };

  /**
   * Handle OAuth callback from Instagram
   */
  handleCallback = async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;
      
      logger.info('Instagram OAuth callback endpoint accessed', {
        code: code ? 'present' : 'missing',
        state: state ? 'present' : 'missing',
        error: error || 'none'
      });

      // Handle OAuth errors
      if (error) {
        logger.error('OAuth authorization failed', {
          error,
          error_description
        });

        return res.status(400).json({
          success: false,
          error: 'OAuth authorization failed',
          message: error_description || error
        });
      }

      // Validate required parameters
      if (!code) {
        logger.error('Missing required OAuth parameters', {
          code: !!code,
          state: !!state
        });

        return res.status(400).json({
          success: false,
          error: 'Missing required OAuth parameters',
          message: 'Authorization code is required'
        });
      }

      logger.info('Exchanging authorization code for access token');

      // Exchange code for short-lived token
      const shortLivedToken = await this.oauthService.exchangeCodeForToken(
        code as string,
        state as string | undefined
      );

      logger.info('Successfully obtained short-lived token', {
        userId: shortLivedToken.userId
      });

      // Exchange for long-lived token
      const longLivedToken = await this.oauthService.getLongLivedToken(
        shortLivedToken.accessToken
      );

      logger.info('Successfully obtained long-lived token', {
        userId: shortLivedToken.userId,
        expiresIn: longLivedToken.expiresIn
      });

      // Get user information
      const userInfo = await this.oauthService.getUserInfo(longLivedToken.accessToken);

      logger.info('Successfully retrieved user information', {
        userId: userInfo.id,
        username: userInfo.username,
        accountType: userInfo.accountType
      });

      // Store token
      this.oauthService.storeToken(userInfo.id, {
        accessToken: longLivedToken.accessToken,
        expiresAt: Date.now() + (longLivedToken.expiresIn * 1000),
        tokenType: longLivedToken.tokenType,
        scope: DEFAULT_SCOPES,
        userId: userInfo.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Return success response
      return res.json({
        success: true,
        message: 'OAuth flow completed successfully',
        user: {
          id: userInfo.id,
          username: userInfo.username,
          accountType: userInfo.accountType,
          mediaCount: userInfo.mediaCount
        },
        token: {
          expiresIn: longLivedToken.expiresIn,
          expiresAt: Date.now() + (longLivedToken.expiresIn * 1000)
        }
      });

    } catch (error: any) {
      logger.error('Error in Instagram callback endpoint', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        error: 'OAuth callback failed',
        message: error.message
      });
    }
  };

  /**
   * Get current user information
   */
  getUserInfo = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required'
        });
      }

      const storedToken = this.oauthService.getStoredToken(userId);
      if (!storedToken) {
        return res.status(404).json({
          error: 'No token found for user',
          message: 'User needs to complete OAuth flow'
        });
      }

      // Check if token is expired
      if (Date.now() >= storedToken.expiresAt) {
        logger.warn('Token expired for user', { userId });
        return res.status(401).json({
          error: 'Token expired',
          message: 'User needs to re-authenticate'
        });
      }

      const userInfo = await this.oauthService.getUserInfo(storedToken.accessToken);

      return res.json({
        success: true,
        user: userInfo,
        token: {
          expiresAt: storedToken.expiresAt,
          expiresIn: Math.floor((storedToken.expiresAt - Date.now()) / 1000)
        }
      });

    } catch (error: any) {
      logger.error('Failed to get user info', {
        error: error.message,
        userId: req.params.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to get user information'
      });
    }
  };

  /**
   * Refresh user token
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required'
        });
      }

      const storedToken = this.oauthService.getStoredToken(userId);
      if (!storedToken) {
        return res.status(404).json({
          error: 'No token found for user'
        });
      }

      logger.info('Refreshing token for user', { userId });

      const refreshedToken = await this.oauthService.refreshToken(storedToken.accessToken);

      // Update stored token
      this.oauthService.storeToken(userId, {
        ...storedToken,
        accessToken: refreshedToken.accessToken,
        expiresAt: Date.now() + (refreshedToken.expiresIn * 1000),
        updatedAt: Date.now()
      });

      logger.info('Successfully refreshed token', {
        userId,
        expiresIn: refreshedToken.expiresIn
      });

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: {
          expiresIn: refreshedToken.expiresIn,
          expiresAt: Date.now() + (refreshedToken.expiresIn * 1000)
        }
      });

    } catch (error: any) {
      logger.error('Failed to refresh token', {
        error: error.message,
        userId: req.params.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to refresh token'
      });
    }
  };

  /**
   * Revoke user token
   */
  revokeToken = async (req: Request, res: Response): Promise<any> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required'
        });
      }

      this.oauthService.removeToken(userId);

      logger.info('Token revoked for user', { userId });

      return res.json({
        success: true,
        message: 'Token revoked successfully'
      });

    } catch (error: any) {
      logger.error('Failed to revoke token', {
        error: error.message,
        userId: req.params.userId
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to revoke token'
      });
    }
  };

  /**
   * Get OAuth service instance
   */
  getOAuthService(): OAuthService {
    return this.oauthService;
  }
}

/**
 * Create OAuth controller instance
 */
export function createOAuthController(config: InstagramOAuthConfig): OAuthController {
  return new OAuthController(config);
}