/**
 * Webhook Middleware
 * Middleware for handling webhook-specific requirements like raw body capture
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to capture raw body for webhook signature verification
 * This must be applied before express.json() middleware
 */
export const captureRawBody = (req: Request, res: Response, next: NextFunction): void => {
  // Only capture raw body for webhook routes
  if (req.path.includes('/webhook/')) {
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks);
      (req as any).rawBody = rawBody.toString('utf8');
      
      // Parse JSON manually for webhook routes
      try {
        if (rawBody.length > 0) {
          req.body = JSON.parse(rawBody.toString('utf8'));
        } else {
          req.body = {};
        }
      } catch (error) {
        logger.error('Failed to parse webhook JSON body', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          bodyLength: rawBody.length,
          bodyPreview: rawBody.toString('utf8').substring(0, 100)
        });
        req.body = {};
      }
      
      next();
    });
    
    req.on('error', (error) => {
      logger.error('Error reading webhook request body', { error });
      next(error);
    });
  } else {
    next();
  }
};

/**
 * Middleware to log webhook requests with additional details
 */
export const logWebhookRequest = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path.includes('/webhook/')) {
    logger.info(`Webhook ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      signature: req.get('X-Hub-Signature-256'),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

export const webhookMiddleware = {
  captureRawBody,
  logWebhookRequest
};