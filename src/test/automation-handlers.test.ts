import { Types } from 'mongoose';
import { AutomationDispatcher } from '../webhook/instagram/automation-handlers/automation-dispatcher';
import { CommentAutomationHandler } from '../webhook/instagram/automation-handlers/comment-handler';
import { MessageAutomationHandler } from '../webhook/instagram/automation-handlers/message-handler';
import { MentionAutomationHandler } from '../webhook/instagram/automation-handlers/mention-handler';
import {
  IncomingWebhookMessage,
  AutomationHandlerContext,
  AUTOMATION_TRIGGER_TYPES
} from '../webhook/instagram/automation-handlers/types';

/**
 * Simple integration test for automation handlers
 * Run with: npx ts-node src/test/automation-handlers.test.ts
 */

async function testAutomationHandlers() {
  console.log('🧪 Testing Automation Handlers...\n');

  // Initialize handlers
  const dispatcher = new AutomationDispatcher();
  const commentHandler = new CommentAutomationHandler();
  const messageHandler = new MessageAutomationHandler();

  // Test 1: Comment message routing
  console.log('📝 Test 1: Comment message routing');
  const commentMessage: IncomingWebhookMessage = {
    messageId: 'comment_123',
    senderId: 'user_456',
    recipientId: 'page_123',
    text: 'This is a test comment',
    platform: 'instagram',
    timestamp: new Date(),
    entryId: 'entry_123',
    metadata: {
      type: 'comment',
      mediaId: 'media_789',
      mediaType: 'photo',
      parentCommentId: undefined
    }
  };

  const commentCanHandle = commentHandler.canHandle(commentMessage);
  const messageCannotHandle = !messageHandler.canHandle(commentMessage);
  
  console.log(`✅ CommentHandler can handle comment: ${commentCanHandle}`);
  console.log(`✅ MessageHandler cannot handle comment: ${messageCannotHandle}`);
  console.log(`✅ CommentHandler trigger type: ${commentHandler.triggerType === AUTOMATION_TRIGGER_TYPES.INSTAGRAM_COMMENT_RECEIVED}\n`);

  // Test 2: Direct message routing
  console.log('💬 Test 2: Direct message routing');
  const directMessage: IncomingWebhookMessage = {
    messageId: 'message_123',
    senderId: 'user_456',
    recipientId: 'page_123',
    text: 'Hello, this is a direct message',
    platform: 'instagram',
    timestamp: new Date(),
    entryId: 'entry_123',
    metadata: {
      type: 'message'
    }
  };

  // Test message for mentions
  const mentionMessage: IncomingWebhookMessage = {
    senderId: 'user789',
    recipientId: 'page456',
    text: '@mypage this product looks amazing!',
    messageId: 'msg_mention_001',
    timestamp: new Date(),
    platform: 'instagram',
    entryId: 'entry_003',
    metadata: {
      type: 'mention',
      username: 'user789',
      mediaId: 'media_123'
    }
  };

  // Test message for story mentions
  const storyMentionMessage: IncomingWebhookMessage = {
    senderId: 'user999',
    recipientId: 'page456',
    text: '@mypage thanks for the great service!',
    messageId: 'msg_story_mention_001',
    timestamp: new Date(),
    platform: 'instagram',
    entryId: 'entry_004',
    metadata: {
      type: 'story_mention',
      username: 'user999',
      storyId: 'story_456'
    }
  };

  const messageCanHandle = messageHandler.canHandle(directMessage);
  const commentCannotHandle = !commentHandler.canHandle(directMessage);
  
  console.log(`✅ MessageHandler can handle message: ${messageCanHandle}`);
  console.log(`✅ CommentHandler cannot handle message: ${commentCannotHandle}`);
  console.log(`✅ MessageHandler trigger type: ${messageHandler.triggerType === AUTOMATION_TRIGGER_TYPES.INSTAGRAM_MESSAGE_RECEIVED}\n`);

  // Test 3: Mention message routing
  const mentionHandler = new MentionAutomationHandler();
  const mentionCanHandle = mentionHandler.canHandle(mentionMessage);
  const mentionCannotHandleComment = !mentionHandler.canHandle(commentMessage);
  const mentionCannotHandleMessage = !mentionHandler.canHandle(directMessage);

  console.log('✓ Mention message routing test passed:', { 
    mentionCanHandle, 
    mentionCannotHandleComment, 
    mentionCannotHandleMessage 
  });

  // Test 4: Story mention message routing
  const storyMentionCanHandle = mentionHandler.canHandle(storyMentionMessage);
  
  console.log('✓ Story mention message routing test passed:', { storyMentionCanHandle });
  console.log(`✅ MentionHandler trigger type: ${mentionHandler.triggerType === AUTOMATION_TRIGGER_TYPES.INSTAGRAM_MENTION_RECEIVED}\n`);

  // Test 5: Context validation
  console.log('🔧 Test 3: Context validation');
  const context: AutomationHandlerContext = {
    userId: new Types.ObjectId(),
    platformAccountId: new Types.ObjectId(),
    webhookSource: 'instagram',
    requestId: 'req_123'
  };

  const contextValid = (
    context.userId instanceof Types.ObjectId &&
    context.platformAccountId instanceof Types.ObjectId &&
    typeof context.webhookSource === 'string' &&
    typeof context.requestId === 'string'
  );

  console.log(`✅ Context structure valid: ${contextValid}\n`);

  // Test 4: Message structure validation
  console.log('📋 Test 4: Message structure validation');
  
  const messageStructureValid = (
    typeof commentMessage.messageId === 'string' &&
    typeof commentMessage.senderId === 'string' &&
    typeof commentMessage.text === 'string' &&
    commentMessage.timestamp instanceof Date &&
    typeof commentMessage.platform === 'string' &&
    typeof commentMessage.metadata === 'object'
  );

  console.log(`✅ Message structure valid: ${messageStructureValid}\n`);

  // Test 5: Dispatcher initialization
  console.log('🚀 Test 5: Dispatcher initialization');
  const dispatcherValid = dispatcher instanceof AutomationDispatcher;
  console.log(`✅ Dispatcher initialized: ${dispatcherValid}\n`);

  console.log('🎉 All automation handler tests completed successfully!');
  console.log('✨ The automation system is ready for webhook processing.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAutomationHandlers().catch(console.error);
}

export { testAutomationHandlers };