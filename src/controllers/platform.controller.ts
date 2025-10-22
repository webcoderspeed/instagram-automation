/**
 * Platform Controller
 * 
 * Handles all platform-related HTTP requests using the adapter pattern.
 * Provides unified endpoints for managing multiple social media platforms.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { 
    createAdapter, 
  getSupportedPlatforms, 
  isPlatformSupported 
} from '../services/adapters';
import { 
  platformEnum, 
  connectAccountSchema, 
  createPostSchema, 
  getMediaSchema, 
  analyticsSchema, 
  webhookSubscriptionSchema, 
  type Platform,
} from '../validators/platform.validator';
import { validate } from '../validators/common.validator';
import logger from '../utils/logger';

// Request validation schemas that match the validate function's expected structure
const connectPlatformRequestSchema = z.object({
  body: connectAccountSchema,
  params: z.object({
    platform: platformEnum,
  }),
});

const createPostRequestSchema = z.object({
  body: createPostSchema,
  params: z.object({
    platform: platformEnum,
  }),
});

const getMediaRequestSchema = z.object({
  query: getMediaSchema,
  params: z.object({
    platform: platformEnum,
  }),
});

const analyticsRequestSchema = z.object({
  query: analyticsSchema,
  params: z.object({
    platform: platformEnum,
  }),
});

const webhookRequestSchema = z.object({
  body: webhookSubscriptionSchema,
  params: z.object({
    platform: platformEnum,
  }),
});



const platformParamsRequestSchema = z.object({
  params: z.object({
    platform: platformEnum,
  }),
});

export class PlatformController {
  /**
   * Get all supported platforms
   */
  static getSupportedPlatforms = async (req: Request, res: Response): Promise<Response> => {
    try {
      const platforms = getSupportedPlatforms();
      
      return res.status(200).json({
        success: true,
        data: {
          platforms,
          count: platforms.length,
        },
      });
    } catch (error) {
      logger.error('Error getting supported platforms:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get supported platforms',
          code: 'PLATFORM_ERROR',
        },
      });
    }
  };

  /**
   * Connect a platform account
   */
  static connectPlatform = [
    validate(connectPlatformRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;
        const { credentials } = req.validatedData.body;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const result = await adapter.authenticate(credentials);

        return res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        logger.error('Error connecting platform:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to connect platform',
            code: 'CONNECTION_ERROR',
          },
        });
      }
    },
  ];

  /**
   * Disconnect a platform account
   */
  static disconnectPlatform = [
    validate(platformParamsRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        // Here you would typically remove the stored credentials
        // This is a placeholder implementation
        
        return res.status(200).json({
          success: true,
          data: {
            message: `Successfully disconnected from ${platform}`,
          },
        });
      } catch (error) {
        logger.error('Error disconnecting platform:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to disconnect platform',
            code: 'DISCONNECTION_ERROR',
          },
        });
      }
    },
  ];

  /**
   * Get platform account information
   */
  static getAccountInfo = [
    validate(platformParamsRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const accountInfo = await adapter.getAccountInfo();

        return res.status(200).json({
          success: true,
          data: accountInfo,
        });
      } catch (error) {
        logger.error('Error getting account info:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get account information',
            code: 'ACCOUNT_INFO_ERROR',
          },
        });
      }
    },
  ];

  /**
   * Create a new post
   */
  static createPost = [
    validate(createPostRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;
        const postData = req.validatedData.body;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const result = await adapter.createPost(postData);

        return res.status(201).json({
          success: true,
          data: result,
        });
      } catch (error) {
        logger.error('Error creating post:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create post',
            code: 'POST_CREATION_ERROR',
          },
        });
      }
    },
  ];

  /**
   * Get media from platform
   */
  static getMedia = [
    validate(getMediaRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;
        const { limit, offset } = req.validatedData.query;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const media = await adapter.getMedia(limit, offset);

        return res.status(200).json({
          success: true,
          data: media,
        });
      } catch (error) {
        logger.error('Error getting media:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get media',
            code: 'MEDIA_ERROR',
          },
        });
      }
    },
  ];

  /**
   * Get analytics from platform
   */
  static getAnalytics = [
    validate(analyticsRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;
        const { metrics, period, startDate, endDate, breakdown } = req.validatedData.query;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const analyticsRequest = {
          metrics: Array.isArray(metrics) ? metrics : [metrics],
          period,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          breakdown,
        };
        const analytics = await adapter.getAnalytics(analyticsRequest);

        return res.status(200).json({
          success: true,
          data: analytics,
        });
      } catch (error) {
        logger.error('Error getting analytics:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get analytics',
            code: 'ANALYTICS_ERROR',
          },
        });
      }
    },
  ];


  /**
   * Get platform capabilities
   */
  static getPlatformCapabilities = [
    validate(platformParamsRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const capabilities = await adapter.getPlatformCapabilities();

        return res.status(200).json({
          success: true,
          data: capabilities,
        });
      } catch (error) {
        logger.error('Error getting platform capabilities:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get platform capabilities',
            code: 'CAPABILITIES_ERROR',
          },
        });
      }
    },
  ];

  /**
   * Get platform rate limits
   */
  static getRateLimits = [
    validate(platformParamsRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const rateLimits = await adapter.getRateLimits();

        return res.status(200).json({
          success: true,
          data: rateLimits,
        });
      } catch (error) {
        logger.error('Error getting rate limits:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get rate limits',
            code: 'RATE_LIMIT_ERROR',
          },
        });
      }
    },
  ];



  /**
   * Validate media for platform
   */
  static validateMedia = [
    validate(platformParamsRequestSchema),
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const { platform } = req.validatedData.params;
        const { media } = req.body;

        if (!isPlatformSupported(platform as Platform)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Platform ${platform} is not supported`,
              code: 'UNSUPPORTED_PLATFORM',
            },
          });
        }

        const adapter = createAdapter(platform as Platform);
        const validation = await adapter.validateMedia(media);

        return res.status(200).json({
          success: true,
          data: validation,
        });
      } catch (error) {
        logger.error('Error validating media:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to validate media',
            code: 'MEDIA_VALIDATION_ERROR',
          },
        });
      }
    },
  ];
}