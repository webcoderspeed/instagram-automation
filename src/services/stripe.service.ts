/**
 * Stripe Service
 * Handles Stripe billing and subscription management
 */

import Stripe from 'stripe';
import logger from '../utils/logger';
import { AppError } from '../utils/app-error';

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publicKey: string;
}

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}



export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
    this.webhookSecret = config.webhookSecret;
    
    logger.info('Stripe service initialized');
  }



  /**
   * Create checkout session
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        customer: params.customerId,
        customer_email: params.customerId ? undefined : params.customerEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata || {},
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      logger.info('Checkout session created', { sessionId: session.id, priceId: params.priceId });
      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', { error, priceId: params.priceId });
      throw AppError.externalService('Stripe', error as Record<string, unknown>);
    }
  }





  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      throw AppError.validation('Invalid webhook signature');
    }
  }




}