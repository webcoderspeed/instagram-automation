import { Request, Response } from 'express';
import { createWebhookController } from '../services/webhook/webhook-controller';
import { instagramService } from '../services/instagram';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, createMeta } from '../utils/response-builder';
import logger from '../utils/logger';

export class WebhookController {
  private webhookController: any;

  constructor() {
    this.webhookController = createWebhookController(
      process.env.INSTAGRAM_APP_SECRET || '',
      process.env.WEBHOOK_VERIFY_TOKEN || ''
    );
  }

  async verifyWebhook(req: Request, res: Response): Promise<void> {
    try {
      await this.webhookController.verifyWebhook(req, res);
    } catch (error) {
      logger.error('Error verifying webhook:', error);
      res.status(500).json({
        error: 'Failed to verify webhook',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      await this.webhookController.handleWebhook(req, res);
    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({
        error: 'Failed to handle webhook',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async subscribeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { object, callback_url, fields, verify_token, access_token } = req.body;

      if (!access_token) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token in the request body'
        });
        return;
      }

      if (!callback_url) {
        res.status(400).json({
          error: 'Callback URL is required',
          message: 'Please provide callback_url in the request body'
        });
        return;
      }

      // Subscribe to webhook using Instagram Graph API
      const subscriptionData = {
        object: object || 'instagram',
        callback_url,
        fields: fields || 'comments,mentions',
        verify_token: verify_token || process.env.WEBHOOK_VERIFY_TOKEN,
        access_token
      };

      // Make API call to subscribe
      const response = await fetch(`https://graph.facebook.com/v24.0/${process.env.INSTAGRAM_APP_ID}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      const result = await response.json();

      if (!response.ok) {
        res.status(response.status).json({
          error: 'Failed to subscribe to webhook',
          details: result
        });
        return;
      }

      sendSuccess(res, result, 200, createMeta());
    } catch (error) {
      logger.error('Error subscribing to webhook:', error);
      res.status(500).json({
        error: 'Failed to subscribe to webhook',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.query.access_token as string;

      if (!accessToken) {
        res.status(400).json({
          error: 'Access token is required',
          message: 'Please provide access_token as a query parameter'
        });
        return;
      }

      // Get webhook subscriptions using Instagram Graph API
      const response = await fetch(`https://graph.facebook.com/v24.0/${process.env.INSTAGRAM_APP_ID}/subscriptions?access_token=${accessToken}`);
      const result = await response.json();

      if (!response.ok) {
        res.status(response.status).json({
          error: 'Failed to get webhook subscriptions',
          details: result
        });
        return;
      }

      sendSuccess(res, result, 200, createMeta());
    } catch (error) {
      logger.error('Error getting webhook subscriptions:', error);
      res.status(500).json({
        error: 'Failed to get webhook subscriptions',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
}