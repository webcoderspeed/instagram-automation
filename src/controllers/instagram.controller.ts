import { Request, Response } from 'express';
import { instagramService } from '../services/instagram';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { platformAccountService } from '../services/auth/platform-account.service';
import { sendSuccess, sendError, createMeta } from '../utils/response-builder';

export class InstagramController {
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, createMeta({ requestId: req.headers['x-request-id'] as string }));
      return;
    }

    const credentials = platformAccountService.getPlatformCredentials(req.user, 'instagram');
    
    if (!credentials) {
      sendError(res, 'Instagram credentials not found', 401, createMeta({ requestId: req.headers['x-request-id'] as string }));
      return;
    }

    // Set access token and get profile
    instagramService.setConfig({ accessToken: credentials.accessToken });
    const profile = await instagramService.getUserProfile();
    sendSuccess(res, profile, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
  });

  async getMedia(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      const credentials = platformAccountService.getPlatformCredentials(req.user, 'instagram');
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;
      
      if (!credentials) {
        sendError(res, 'Instagram credentials not found', 401, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Set access token and get media
      instagramService.setConfig({ accessToken: credentials.accessToken });
      const media = await instagramService.getUserMedia(limit);
      sendSuccess(res, media, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error fetching Instagram media:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }

  async getMediaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accessToken = req.query.access_token as string;
      
      if (!accessToken) {
        sendError(res, 'Access token is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      if (!id) {
        sendError(res, 'Media ID is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Set access token and get media details
      instagramService.setConfig({ accessToken });
      const media = await instagramService.getMediaDetails(id);
      sendSuccess(res, media, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error fetching Instagram media by ID:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }

  async publishPost(req: Request, res: Response): Promise<void> {
    try {
      const { image_url, caption, access_token } = req.body;
      
      if (!access_token) {
        sendError(res, 'Access token is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      if (!image_url) {
        sendError(res, 'Image URL is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Set access token
      instagramService.setConfig({ accessToken: access_token });

      // First, create the media container
      const containerResponse = await instagramService.createMediaContainer(
        image_url,
        caption || ''
      );

      if (!containerResponse?.id) {
        sendError(res, 'Failed to create media container', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Then publish the media
      const publishResponse = await instagramService.publishMedia(
        containerResponse.id
      );

      sendSuccess(res, {
        success: true,
        container_id: containerResponse.id,
        media_id: publishResponse?.id,
        message: 'Post published successfully'
      }, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error publishing Instagram post:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }

  async getMediaInsights(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accessToken = req.query.access_token as string;
      
      if (!accessToken) {
        sendError(res, 'Access token is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      if (!id) {
        sendError(res, 'Media ID is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Set access token and get insights
      instagramService.setConfig({ accessToken });
      const insights = await instagramService.getMediaInsights(id);
      sendSuccess(res, insights, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error fetching media insights:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }

  async getAccountInsights(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.query.access_token as string;
      const period = req.query.period as 'day' | 'week' | 'days_28' || 'day';
      
      if (!accessToken) {
        sendError(res, 'Access token is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Set access token and get insights
      instagramService.setConfig({ accessToken });
      const insights = await instagramService.getAccountInsights(period);
      sendSuccess(res, insights, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error fetching account insights:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }

  async getHashtagInfo(req: Request, res: Response): Promise<void> {
    try {
      const { hashtag } = req.params;
      const accessToken = req.query.access_token as string;
      
      if (!accessToken) {
        sendError(res, 'Access token is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      if (!hashtag) {
        sendError(res, 'Hashtag is required', 400, createMeta({ requestId: req.headers['x-request-id'] as string }));
        return;
      }

      // Set access token and get hashtag info
      instagramService.setConfig({ accessToken });
      const hashtagInfo = await instagramService.getHashtagInfo(hashtag);
      sendSuccess(res, hashtagInfo, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error fetching hashtag info:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }

  async getRateLimit(req: Request, res: Response): Promise<void> {
    try {
      const rateLimitInfo = instagramService.getRateLimitStatus();
      sendSuccess(res, rateLimitInfo, 200, createMeta({ requestId: req.headers['x-request-id'] as string }));
    } catch (error) {
      logger.error('Error fetching rate limit info:', error);
      sendError(res, error instanceof Error ? error.message : 'Unknown error occurred', 500, createMeta({ requestId: req.headers['x-request-id'] as string }));
    }
  }
}