/**
 * Webhook Controller
 * Handles HTTP webhook requests from Facebook/Instagram
 * Validates requests and routes them to the webhook service
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../../utils/logger';
import { webhookService } from './webhook-service';
import { WebhookEvent } from './interfaces/base';

export class WebhookController {
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(appSecret: string, verifyToken: string) {
    this.appSecret = appSecret;
    this.verifyToken = verifyToken;
  }

  /**
   * Handle webhook verification (GET request)
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      logger.info('Webhook verification request received', {
        mode,
        token: token ? '***' : undefined,
        challenge: challenge ? '***' : undefined
      });

      // Check if a token and mode were sent
      if (mode && token) {
        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === this.verifyToken) {
          // Respond with 200 OK and challenge token from the request
          logger.info('Webhook verified successfully');
          res.status(200).send(challenge);
          return;
        } else {
          // Responds with '403 Forbidden' if verify tokens do not match
          logger.warn('Webhook verification failed - invalid token', {
            expectedToken: this.verifyToken ? '***' : undefined,
            receivedToken: token ? '***' : undefined
          });
          res.sendStatus(403);
          return;
        }
      }

      logger.warn('Webhook verification failed - missing parameters');
      res.sendStatus(400);

    } catch (error) {
      logger.error('Error during webhook verification', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.sendStatus(500);
    }
  }

  /**
   * Handle webhook events (POST request)
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.get('X-Hub-Signature-256');
      const body = req.body;

      logger.info('Webhook event received', {
        hasSignature: !!signature,
        bodySize: JSON.stringify(body).length,
        object: body?.object,
        entryCount: body?.entry?.length || 0
      });

      // // Verify the webhook signature
      // if (!this.verifySignature(req.body, signature)) {
      //   logger.warn('Webhook signature verification failed');
      //   res.sendStatus(403);
      //   return;
      // }

      // Validate webhook event structure
      if (!this.isValidWebhookEvent(body)) {
        logger.warn('Invalid webhook event structure', { body });
        res.sendStatus(400);
        return;
      }

      // Process the webhook event
      await webhookService.processWebhookEvent(body as WebhookEvent);

      // Acknowledge receipt of the event
      res.status(200).send('EVENT_RECEIVED');

      logger.info('Webhook event processed successfully', {
        object: body.object,
        entryCount: body.entry.length
      });

    } catch (error) {
      logger.error('Error processing webhook event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Still acknowledge receipt to prevent retries
      res.status(200).send('EVENT_RECEIVED');
    }
  }

  /**
   * Verify webhook signature using app secret
   */
  private verifySignature(body: any, signature?: string): boolean {
    if (!signature) {
      logger.warn('No signature provided in webhook request');
      return false;
    }

    try {
      // Create expected signature
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', this.appSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        logger.warn('Webhook signature mismatch', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: signature.substring(0, 10) + '...'
        });
      }

      return isValid;

    } catch (error) {
      logger.error('Error verifying webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Validate webhook event structure
   */
  private isValidWebhookEvent(body: any): boolean {
    if (!body || typeof body !== 'object') {
      return false;
    }

    // Check required fields
    if (!body.object || !Array.isArray(body.entry)) {
      return false;
    }

    // Validate each entry
    for (const entry of body.entry) {
      if (!entry.id || !entry.time) {
        return false;
      }

      // At least one of these should be present
      if (!entry.messaging && !entry.changes && !entry.standby) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get webhook status
   */
  getStatus(): {
    configured: boolean;
    serviceStatus: any;
  } {
    return {
      configured: !!(this.appSecret && this.verifyToken),
      serviceStatus: webhookService.getStatus()
    };
  }
}

// Factory function to create webhook controller
export function createWebhookController(appSecret: string, verifyToken: string): WebhookController {
  return new WebhookController(appSecret, verifyToken);
}