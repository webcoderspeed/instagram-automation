/**
 * Messaging Postbacks webhook event handler
 * Handles postback events when customers click buttons, Get Started button, persistent menu items, or icebreakers
 * Based on: https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_postbacks
 */

import logger from '../../../utils/logger';
import { messagingService } from '../../messaging';
import { WebhookMessaging } from '../interfaces/base';
import { PostbackHandler } from '../types/handlers';

export const handleMessagingPostbacks: PostbackHandler = async (entryId: string, messaging: WebhookMessaging): Promise<void> => {
  try {
    const { sender, recipient, postback, timestamp } = messaging;

    if (!postback) {
      logger.warn('Messaging postback event received without postback data', { entryId, sender: sender.id });
      return;
    }

    logger.info('Processing messaging postback event', {
      entryId,
      senderId: sender.id,
      recipientId: recipient.id,
      title: postback.title,
      payload: postback.payload,
      messageId: postback.mid,
      timestamp,
      eventType: 'messaging_postbacks'
    });

    // Route postback to appropriate handler based on payload
    await routePostback(sender.id, recipient.id, postback.payload, postback.title, postback.mid);

    logger.debug('Messaging postback event processed successfully', {
      payload: postback.payload,
      senderId: sender.id
    });

  } catch (error) {
    logger.error('Error processing messaging postback event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entryId,
      senderId: messaging.sender?.id,
      payload: messaging.postback?.payload
    });
  }
};

async function routePostback(
  senderId: string,
  recipientId: string,
  payload: string,
  title: string,
  messageId?: string
): Promise<void> {
  try {
    logger.debug('Routing postback', { senderId, payload, title, messageId });

    // Parse payload to determine action
    const action = parsePostbackPayload(payload);

    switch (action.type) {
      case 'GET_STARTED':
        await handleGetStarted(senderId, recipientId, action.data);
        break;
      
      case 'MENU_ITEM':
        await handleMenuSelection(senderId, recipientId, action.data);
        break;
      
      case 'QUICK_REPLY':
        await handleQuickReplyPostback(senderId, recipientId, action.data);
        break;
      
      case 'BUTTON_CLICK':
        await handleButtonClick(senderId, recipientId, action.data);
        break;
      
      case 'ICEBREAKER':
        await handleIcebreaker(senderId, recipientId, action.data);
        break;
      
      case 'PRODUCT_INQUIRY':
        await handleProductInquiry(senderId, recipientId, action.data);
        break;
      
      case 'SUPPORT_REQUEST':
        await handleSupportRequest(senderId, recipientId, action.data);
        break;
      
      default:
        await handleUnknownPostback(senderId, recipientId, payload, title);
    }

  } catch (error) {
    logger.error('Failed to route postback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      payload
    });
  }
}

interface PostbackAction {
  type: string;
  data: any;
}

function parsePostbackPayload(payload: string): PostbackAction {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(payload);
    return {
      type: parsed.type || 'UNKNOWN',
      data: parsed.data || parsed
    };
  } catch {
    // If not JSON, treat as simple string payload
    if (payload.startsWith('GET_STARTED')) {
      return { type: 'GET_STARTED', data: {} };
    } else if (payload.startsWith('MENU_')) {
      return { type: 'MENU_ITEM', data: { item: payload.replace('MENU_', '') } };
    } else if (payload.startsWith('ICEBREAKER_')) {
      return { type: 'ICEBREAKER', data: { option: payload.replace('ICEBREAKER_', '') } };
    } else {
      return { type: 'UNKNOWN', data: { payload } };
    }
  }
}

async function handleGetStarted(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling Get Started postback', { senderId, data });

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    logger.warn('No access token available for Get Started response');
    return;
  }

  try {
    const welcomeMessage = `Welcome! 👋 Thanks for reaching out. How can I help you today?

Here are some things I can help with:
• Product information
• Order status
• Customer support
• General questions

Just send me a message and I'll do my best to assist you!`;

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: welcomeMessage,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Get Started welcome message sent', { senderId });
  } catch (error) {
    logger.error('Failed to send Get Started response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId
    });
  }
}

async function handleMenuSelection(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling menu selection', { senderId, data });

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    logger.warn('No access token available for menu response');
    return;
  }

  try {
    let responseMessage = '';

    switch (data.item) {
      case 'HELP':
        responseMessage = 'I\'m here to help! What do you need assistance with?';
        break;
      case 'PRODUCTS':
        responseMessage = 'Check out our latest products! What are you looking for?';
        break;
      case 'CONTACT':
        responseMessage = 'You can reach us here anytime. How can we help you today?';
        break;
      default:
        responseMessage = 'Thanks for your selection. How can I assist you?';
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: responseMessage,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Menu selection response sent', { senderId, menuItem: data.item });
  } catch (error) {
    logger.error('Failed to send menu selection response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      menuItem: data.item
    });
  }
}

async function handleQuickReplyPostback(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling quick reply postback', { senderId, data });
  // TODO: Implement quick reply postback logic
}

async function handleButtonClick(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling button click', { senderId, data });
  // TODO: Implement button click logic
}

async function handleIcebreaker(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling icebreaker selection', { senderId, data });

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    logger.warn('No access token available for icebreaker response');
    return;
  }

  try {
    let responseMessage = '';

    switch (data.option) {
      case 'HELLO':
        responseMessage = 'Hello! Great to meet you. How can I help you today?';
        break;
      case 'HELP':
        responseMessage = 'I\'d be happy to help! What do you need assistance with?';
        break;
      case 'INFO':
        responseMessage = 'I can provide information about our products and services. What would you like to know?';
        break;
      default:
        responseMessage = 'Thanks for reaching out! How can I assist you?';
    }

    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: responseMessage,
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Icebreaker response sent', { senderId, option: data.option });
  } catch (error) {
    logger.error('Failed to send icebreaker response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      option: data.option
    });
  }
}

async function handleProductInquiry(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling product inquiry', { senderId, data });
  // TODO: Implement product inquiry logic
}

async function handleSupportRequest(senderId: string, recipientId: string, data: any): Promise<void> {
  logger.info('Handling support request', { senderId, data });
  // TODO: Implement support request logic
}

async function handleUnknownPostback(senderId: string, recipientId: string, payload: string, title: string): Promise<void> {
  logger.warn('Handling unknown postback', { senderId, payload, title });

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    logger.warn('No access token available for unknown postback response');
    return;
  }

  try {
    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: 'Thanks for your interaction! How can I help you today?',
      accessToken,
      instagramUserId: recipientId
    });

    logger.info('Unknown postback response sent', { senderId, payload });
  } catch (error) {
    logger.error('Failed to send unknown postback response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      payload
    });
  }
}