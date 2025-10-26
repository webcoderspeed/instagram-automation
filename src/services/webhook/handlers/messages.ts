/**
 * Messages webhook event handler
 * Handles incoming messages from customers
 * Based on: https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messages
 */

import logger from '../../../utils/logger';
import { messagingService } from '../../messaging';
import { autoDMService, IncomingMessage } from '../../auto-dm';
import { WebhookMessaging } from '../interfaces/base';
import { MessageHandler } from '../types/handlers';

export const handleMessages: MessageHandler = async (entryId: string, messaging: WebhookMessaging): Promise<void> => {
  try {
    const { sender, recipient, message, timestamp } = messaging;

    if (!message) {
      logger.warn('Message event received without message data', { entryId, sender: sender.id });
      return;
    }

    logger.info('Processing incoming message', {
      entryId,
      senderId: sender.id,
      recipientId: recipient.id,
      messageId: message.mid,
      hasText: !!message.text,
      hasAttachments: !!message.attachments?.length,
      isEcho: message.is_echo,
      isDeleted: message.is_deleted,
      isUnsupported: message.is_unsupported,
      timestamp
    });

    // Skip processing for echo messages (messages sent by our business)
    if (message.is_echo) {
      logger.debug('Skipping echo message', { messageId: message.mid });
      return;
    }

    // Skip processing for deleted messages
    if (message.is_deleted) {
      logger.info('Message was deleted', { messageId: message.mid });
      return;
    }

    // Handle unsupported messages
    if (message.is_unsupported) {
      logger.warn('Received unsupported message type', { messageId: message.mid });
      await sendUnsupportedMessageReply(sender.id, recipient.id);
      return;
    }

    // Handle quick reply
    if (message.quick_reply) {
      logger.info('Processing quick reply', {
        messageId: message.mid,
        payload: message.quick_reply.payload
      });
      await handleQuickReply(sender.id, recipient.id, message.quick_reply.payload);
      return;
    }

    // Handle reply to message
    if (message.reply_to) {
      logger.info('Processing reply to message', {
        messageId: message.mid,
        replyToMid: message.reply_to.mid,
        replyToStory: !!message.reply_to.story
      });
      await handleReplyToMessage(sender.id, recipient.id, message);
      return;
    }

    // Handle referral (from ads or other sources)
    if (message.referral) {
      logger.info('Processing message with referral', {
        messageId: message.mid,
        referralSource: message.referral.source,
        referralType: message.referral.type
      });
      await handleMessageWithReferral(sender.id, recipient.id, message);
      return;
    }

    // Handle text messages
    if (message.text) {
      await handleTextMessage(sender.id, recipient.id, message.text, message.mid);
      return;
    }

    // Handle attachments
    if (message.attachments && message.attachments.length > 0) {
      await handleMessageAttachments(sender.id, recipient.id, message.attachments, message.mid);
      return;
    }

    logger.warn('Received message without text or attachments', { messageId: message.mid });

  } catch (error) {
    logger.error('Error processing message event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entryId,
      senderId: messaging.sender?.id,
      messageId: messaging.message?.mid
    });
  }
};

async function handleTextMessage(senderId: string, recipientId: string, text: string, messageId: string): Promise<void> {
  try {
    logger.info('Processing text message', {
      senderId,
      recipientId,
      messageId,
      textLength: text.length,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });

    // Store the message in the messaging service
    await messagingService.storeIncomingMessage({
      senderId,
      recipientId,
      messageId,
      content: {
        text,
        type: 'text'
      },
      timestamp: new Date(),
      platform: 'instagram' // TODO: Determine platform from context
    });

    // Process auto DM for this message
    const incomingMessage: IncomingMessage = {
      senderId,
      recipientId,
      text,
      messageId,
      platform: 'instagram', // TODO: Determine platform from context
      timestamp: new Date(),
      entryId: recipientId // Using recipientId as entryId for now
    };

    // Trigger auto DM processing
    const autoDMResult = await autoDMService.processIncomingMessage(incomingMessage);
    
    if (autoDMResult.success) {
      logger.info('Auto DM triggered successfully', {
        messageId,
        senderId,
        automationId: autoDMResult.automationId,
        responseText: autoDMResult.responseText?.substring(0, 100) + '...'
      });
    } else if (autoDMResult.error) {
      logger.warn('Auto DM processing failed', {
        messageId,
        senderId,
        error: autoDMResult.error
      });
    } else {
      logger.debug('No auto DM triggered for message', {
        messageId,
        senderId,
        message: autoDMResult.message
      });
    }

    logger.debug('Text message processed successfully', {
      messageId,
      senderId
    });

  } catch (error) {
    logger.error('Error processing text message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId,
      recipientId,
      messageId
    });
    throw error;
  }
}

async function handleMessageAttachments(
  senderId: string,
  recipientId: string,
  attachments: any[],
  messageId: string
): Promise<void> {
  logger.info('Processing message with attachments', {
    senderId,
    messageId,
    attachmentCount: attachments.length,
    attachmentTypes: attachments.map(att => att.type)
  });

  // Process each attachment
  for (const attachment of attachments) {
    switch (attachment.type) {
      case 'image':
        await handleImageAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'video':
        await handleVideoAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'audio':
        await handleAudioAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'file':
        await handleFileAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'share':
        await handleShareAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'story_mention':
        await handleStoryMentionAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'template':
        await handleTemplateAttachment(senderId, recipientId, attachment, messageId);
        break;
      case 'fallback':
        await handleFallbackAttachment(senderId, recipientId, attachment, messageId);
        break;
      default:
        logger.warn('Unknown attachment type', { type: attachment.type, messageId });
    }
  }
}

async function handleImageAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing image attachment', { senderId, messageId, url: attachment.payload?.url });
  // TODO: Implement image processing logic
}

async function handleVideoAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing video attachment', { senderId, messageId, url: attachment.payload?.url });
  // TODO: Implement video processing logic
}

async function handleAudioAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing audio attachment', { senderId, messageId, url: attachment.payload?.url });
  // TODO: Implement audio processing logic
}

async function handleFileAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing file attachment', { senderId, messageId, url: attachment.payload?.url });
  // TODO: Implement file processing logic
}

async function handleShareAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing share attachment', { senderId, messageId, url: attachment.payload?.url });
  // TODO: Implement share processing logic
}

async function handleStoryMentionAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing story mention attachment', { senderId, messageId });
  // TODO: Implement story mention processing logic
}

async function handleTemplateAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing template attachment', { senderId, messageId, templateType: attachment.payload?.template_type });
  // TODO: Implement template processing logic
}

async function handleFallbackAttachment(senderId: string, recipientId: string, attachment: any, messageId: string): Promise<void> {
  logger.info('Processing fallback attachment', { senderId, messageId, title: attachment.payload?.title });
  // TODO: Implement fallback processing logic
}

async function handleQuickReply(senderId: string, recipientId: string, payload: string): Promise<void> {
  logger.info('Processing quick reply', { senderId, payload });
  // TODO: Implement quick reply processing logic
}

async function handleReplyToMessage(senderId: string, recipientId: string, message: any): Promise<void> {
  logger.info('Processing reply to message', { senderId, replyTo: message.reply_to });
  // TODO: Implement reply to message processing logic
}

async function handleMessageWithReferral(senderId: string, recipientId: string, message: any): Promise<void> {
  logger.info('Processing message with referral', { senderId, referral: message.referral });
  // TODO: Implement referral processing logic
}

async function sendUnsupportedMessageReply(senderId: string, recipientId: string): Promise<void> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    logger.warn('No access token available for sending unsupported message reply');
    return;
  }

  try {
    await messagingService.sendDirectMessage({
      recipientId: senderId,
      message: 'Sorry, I cannot process this type of message. Please send a text message.',
      accessToken,
      instagramUserId: recipientId
    });
    logger.info('Unsupported message reply sent', { senderId });
  } catch (error) {
    logger.error('Failed to send unsupported message reply', {
      error: error instanceof Error ? error.message : 'Unknown error',
      senderId
    });
  }
}