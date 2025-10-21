/**
 * Messaging Referrals webhook event handler
 * Handles referral events when customers start conversations from ads, posts, or other sources
 * Based on: https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_referrals
 */

import logger from '../../../utils/logger';
import { messagingService } from '../../messaging';
import { WebhookMessaging } from '../interfaces/base';
import { ReferralHandler } from '../types/handlers';

export const handleMessagingReferrals: ReferralHandler = async (entryId: string, messaging: WebhookMessaging): Promise<void> => {
  try {
    const { sender, recipient, referral, timestamp } = messaging;

    if (!referral) {
      logger.warn('Messaging referral event received without referral data', { entryId, sender: sender.id });
      return;
    }

    logger.info('Processing messaging referral event', {
      entryId,
      senderId: sender.id,
      recipientId: recipient.id,
      source: referral.source,
      type: referral.type,
      ref: referral.ref,
      adId: referral.ad_id,
      timestamp,
      eventType: 'messaging_referrals'
    });

    // Process referral based on source and type
    await processReferral(sender.id, recipient.id, referral, timestamp);

    logger.debug('Messaging referral event processed successfully', {
      senderId: sender.id,
      source: referral.source,
      type: referral.type,
      ref: referral.ref
    });

  } catch (error) {
    logger.error('Error processing messaging referral event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entryId,
      senderId: messaging.sender?.id,
      source: messaging.referral?.source,
      type: messaging.referral?.type
    });
  }
};

async function processReferral(
  senderId: string,
  recipientId: string,
  referral: any,
  timestamp: number
): Promise<void> {
  try {
    logger.debug('Processing referral', {
      senderId,
      recipientId,
      source: referral.source,
      type: referral.type,
      ref: referral.ref,
      timestamp
    });

    // Store referral data
    await storeReferralData(senderId, recipientId, referral, timestamp);

    // Track referral analytics
    await trackReferralAnalytics(senderId, recipientId, referral, timestamp);

    // Handle different referral sources
    switch (referral.source) {
      case 'ADS':
        await handleAdReferral(senderId, recipientId, referral);
        break;
      
      case 'SHORTLINK':
        await handleShortlinkReferral(senderId, recipientId, referral);
        break;
      
      case 'CUSTOMER_CHAT_PLUGIN':
        await handleCustomerChatPluginReferral(senderId, recipientId, referral);
        break;
      
      case 'MESSENGER_CODE':
        await handleMessengerCodeReferral(senderId, recipientId, referral);
        break;
      
      case 'DISCOVER_TAB':
        await handleDiscoverTabReferral(senderId, recipientId, referral);
        break;
      
      default:
        await handleGenericReferral(senderId, recipientId, referral);
    }

    // Trigger referral-based automations
    await triggerReferralAutomations(senderId, recipientId, referral);

    logger.debug('Referral processed successfully', { senderId, source: referral.source });

  } catch (error) {
    logger.error('Failed to process referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      source: referral.source
    });
  }
}

async function storeReferralData(
  senderId: string,
  recipientId: string,
  referral: any,
  timestamp: number
): Promise<void> {
  try {
    // TODO: Implement database storage logic
    // Example:
    // await db.referrals.create({
    //   data: {
    //     senderId,
    //     recipientId,
    //     source: referral.source,
    //     type: referral.type,
    //     ref: referral.ref,
    //     refererUri: referral.referer_uri,
    //     isGuestUser: referral.is_guest_user,
    //     createdAt: new Date(timestamp),
    //     updatedAt: new Date(timestamp)
    //   }
    // });

    logger.debug('Referral data stored', { senderId, source: referral.source });
  } catch (error) {
    logger.error('Failed to store referral data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      source: referral.source
    });
  }
}

async function trackReferralAnalytics(
  senderId: string,
  recipientId: string,
  referral: any,
  timestamp: number
): Promise<void> {
  try {
    // TODO: Implement analytics tracking
    // Example:
    // await analytics.track('messaging_referral', {
    //   senderId,
    //   recipientId,
    //   source: referral.source,
    //   type: referral.type,
    //   ref: referral.ref,
    //   refererUri: referral.referer_uri,
    //   isGuestUser: referral.is_guest_user,
    //   timestamp,
    //   platform: 'instagram'
    // });

    logger.debug('Referral analytics tracked', { senderId, source: referral.source });
  } catch (error) {
    logger.error('Failed to track referral analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      source: referral.source
    });
  }
}

async function handleAdReferral(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    logger.info('Handling ad referral', { senderId, ref: referral.ref });

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for ad referral response');
      return;
    }

    // Parse ad reference to determine campaign
    const adCampaign = parseAdReference(referral.ref);
    
    let welcomeMessage = `Hi! 👋 Thanks for reaching out from our ad!`;
    
    // Customize message based on ad campaign
    if (adCampaign) {
      switch (adCampaign.type) {
        case 'product':
          welcomeMessage = `Hi! 👋 I see you're interested in our ${adCampaign.product}. How can I help you today?`;
          break;
        case 'discount':
          welcomeMessage = `Hi! 👋 Thanks for your interest in our special offer! Let me help you with that discount.`;
          break;
        case 'service':
          welcomeMessage = `Hi! 👋 I see you're interested in our ${adCampaign.service}. What would you like to know?`;
          break;
        default:
          welcomeMessage = `Hi! 👋 Thanks for reaching out from our ad! How can I assist you?`;
      }
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: welcomeMessage,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Ad referral response sent', { senderId, campaign: adCampaign?.type });
  } catch (error) {
    logger.error('Failed to handle ad referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      ref: referral.ref
    });
  }
}

async function handleShortlinkReferral(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    logger.info('Handling shortlink referral', { senderId, ref: referral.ref });

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for shortlink referral response');
      return;
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: `Hi! 👋 Thanks for clicking our link. How can I help you today?`,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Shortlink referral response sent', { senderId });
  } catch (error) {
    logger.error('Failed to handle shortlink referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId
    });
  }
}

async function handleCustomerChatPluginReferral(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    logger.info('Handling customer chat plugin referral', { senderId, ref: referral.ref });

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for chat plugin referral response');
      return;
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: `Hi! 👋 Welcome to our chat! I'm here to help you with any questions you might have.`,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Chat plugin referral response sent', { senderId });
  } catch (error) {
    logger.error('Failed to handle chat plugin referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId
    });
  }
}

async function handleMessengerCodeReferral(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    logger.info('Handling messenger code referral', { senderId, ref: referral.ref });

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for messenger code referral response');
      return;
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: `Hi! 👋 Thanks for scanning our code! How can I assist you today?`,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Messenger code referral response sent', { senderId });
  } catch (error) {
    logger.error('Failed to handle messenger code referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId
    });
  }
}

async function handleDiscoverTabReferral(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    logger.info('Handling discover tab referral', { senderId, ref: referral.ref });

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for discover tab referral response');
      return;
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: `Hi! 👋 Great to see you found us! What can I help you with today?`,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Discover tab referral response sent', { senderId });
  } catch (error) {
    logger.error('Failed to handle discover tab referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId
    });
  }
}

async function handleGenericReferral(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    logger.info('Handling generic referral', { senderId, source: referral.source, ref: referral.ref });

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('No access token available for generic referral response');
      return;
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: `Hi! 👋 Thanks for reaching out! How can I help you today?`,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Generic referral response sent', { senderId, source: referral.source });
  } catch (error) {
    logger.error('Failed to handle generic referral', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      source: referral.source
    });
  }
}

async function triggerReferralAutomations(senderId: string, recipientId: string, referral: any): Promise<void> {
  try {
    // TODO: Implement referral-based automations
    // Examples:
    // - Tag customers based on referral source
    // - Trigger specific conversation flows
    // - Apply discounts for ad referrals
    // - Update lead scoring based on source
    // - Send to appropriate sales teams

    logger.debug('Referral automations triggered', { senderId, source: referral.source });
  } catch (error) {
    logger.error('Failed to trigger referral automations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      source: referral.source
    });
  }
}

interface AdCampaign {
  type: 'product' | 'discount' | 'service' | 'general';
  product?: string;
  service?: string;
  campaign?: string;
}

function parseAdReference(ref: string): AdCampaign | null {
  try {
    if (!ref) return null;

    // Parse different ad reference formats
    if (ref.includes('product_')) {
      const product = ref.replace('product_', '').replace('_', ' ');
      return { type: 'product', product };
    } else if (ref.includes('discount_')) {
      return { type: 'discount', campaign: ref };
    } else if (ref.includes('service_')) {
      const service = ref.replace('service_', '').replace('_', ' ');
      return { type: 'service', service };
    } else {
      return { type: 'general', campaign: ref };
    }
  } catch (error) {
    logger.error('Failed to parse ad reference', { ref, error });
    return null;
  }
}

// Utility function to get referral statistics
export async function getReferralStats(timeframe: 'day' | 'week' | 'month'): Promise<{
  totalReferrals: number;
  sourceBreakdown: Record<string, number>;
  conversionRate: number;
}> {
  try {
    // TODO: Implement database query to get referral stats
    // Example:
    // const startDate = getStartDate(timeframe);
    // const referrals = await db.referrals.findMany({
    //   where: {
    //     createdAt: { gte: startDate }
    //   }
    // });

    // For now, return empty stats
    return {
      totalReferrals: 0,
      sourceBreakdown: {},
      conversionRate: 0
    };
  } catch (error) {
    logger.error('Failed to get referral stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timeframe
    });
    return {
      totalReferrals: 0,
      sourceBreakdown: {},
      conversionRate: 0
    };
  }
}