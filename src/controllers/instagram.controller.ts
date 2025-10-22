import { Request, Response } from 'express';
import { instagramService } from '../services/instagram';
import logger from '../utils/logger';
import { platformAccountService } from '../services/auth/platform-account.service';

export class InstagramController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
        return;
      }

      const credentials = platformAccountService.getPlatformCredentials(req.user, 'instagram');
      
      if (!credentials) {
        res.status(401).json({
          error: 'Instagram credentials not found',
          message: 'Please connect your Instagram account first'
        });
        return;
      }

      // Set access token and get profile
      instagramService.setConfig({ accessToken: credentials.accessToken });
      const profile = await instagramService.getUserProfile();
      res.json(profile);
    } catch (error) {
      logger.error('Error fetching Instagram profile:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getMedia(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
        return;
      }

      const credentials = platformAccountService.getPlatformCredentials(req.user, 'instagram');
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;
      
      if (!credentials) {
        res.status(401).json({
          error: 'Instagram credentials not found',
          message: 'Please connect your Instagram account first'
        });
        return;
      }

      // Set access token and get media
      instagramService.setConfig({ accessToken: credentials.accessToken });
      const media = await instagramService.getUserMedia(limit);
      res.json(media);
    } catch (error) {
      logger.error('Error fetching Instagram media:', error);
      res.status(500).json({
        error: 'Failed to fetch media',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getMediaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accessToken = req.query.access_token as string;
      
      if (!accessToken) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token as a query parameter'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Media ID is required',
          message: 'Please provide a valid media ID'
        });
        return;
      }

      // Set access token and get media details
      instagramService.setConfig({ accessToken });
      const media = await instagramService.getMediaDetails(id);
      res.json(media);
    } catch (error) {
      logger.error('Error fetching Instagram media by ID:', error);
      res.status(500).json({
        error: 'Failed to fetch media',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async publishPost(req: Request, res: Response): Promise<void> {
    try {
      const { image_url, caption, access_token } = req.body;
      
      if (!access_token) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token in the request body'
        });
        return;
      }

      if (!image_url) {
        res.status(400).json({
          error: 'Image URL is required',
          message: 'Please provide image_url in the request body'
        });
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
        res.status(400).json({
          error: 'Failed to create media container',
          message: 'Instagram API did not return a container ID'
        });
        return;
      }

      // Then publish the media
      const publishResponse = await instagramService.publishMedia(
        containerResponse.id
      );

      res.json({
        success: true,
        container_id: containerResponse.id,
        media_id: publishResponse?.id,
        message: 'Post published successfully'
      });
    } catch (error) {
      logger.error('Error publishing Instagram post:', error);
      res.status(500).json({
        error: 'Failed to publish post',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getMediaInsights(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accessToken = req.query.access_token as string;
      
      if (!accessToken) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token as a query parameter'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Media ID is required',
          message: 'Please provide a valid media ID'
        });
        return;
      }

      // Set access token and get insights
      instagramService.setConfig({ accessToken });
      const insights = await instagramService.getMediaInsights(id);
      res.json(insights);
    } catch (error) {
      logger.error('Error fetching media insights:', error);
      res.status(500).json({
        error: 'Failed to fetch media insights',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getAccountInsights(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.query.access_token as string;
      const period = req.query.period as 'day' | 'week' | 'days_28' || 'day';
      
      if (!accessToken) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token as a query parameter'
        });
        return;
      }

      // Set access token and get insights
      instagramService.setConfig({ accessToken });
      const insights = await instagramService.getAccountInsights(period);
      res.json(insights);
    } catch (error) {
      logger.error('Error fetching account insights:', error);
      res.status(500).json({
        error: 'Failed to fetch account insights',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getHashtagInfo(req: Request, res: Response): Promise<void> {
    try {
      const { hashtag } = req.params;
      const accessToken = req.query.access_token as string;
      
      if (!accessToken) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token as a query parameter'
        });
        return;
      }

      if (!hashtag) {
        res.status(400).json({
          error: 'Hashtag is required',
          message: 'Please provide a valid hashtag'
        });
        return;
      }

      // Set access token and get hashtag info
      instagramService.setConfig({ accessToken });
      const hashtagInfo = await instagramService.getHashtagInfo(hashtag);
      res.json(hashtagInfo);
    } catch (error) {
      logger.error('Error fetching hashtag info:', error);
      res.status(500).json({
        error: 'Failed to fetch hashtag info',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getRateLimit(req: Request, res: Response): Promise<void> {
    try {
      const rateLimitInfo = instagramService.getRateLimitStatus();
      res.json(rateLimitInfo);
    } catch (error) {
      logger.error('Error fetching rate limit info:', error);
      res.status(500).json({
        error: 'Failed to fetch rate limit info',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
}