# Instagram Automatic Reply Setup

## Overview

This document outlines the implementation of automatic reply functionality for Instagram comments and direct messages. The system automatically responds with "Hi from AI" to incoming comments and messages.

## Implementation Details

### 1. Messaging Service (`src/services/messaging.ts`)

A comprehensive Instagram messaging service that handles:

- **Private Replies**: Reply to comments on Instagram posts
- **Direct Messages**: Send messages to Instagram users
- **Media Messages**: Send messages with image/video attachments
- **Conversation Management**: Retrieve conversation history and mark messages as read

#### Key Features:
- Full Instagram Graph API integration
- Comprehensive error handling and logging
- Support for both text and media messages
- Rate limiting awareness
- Proper API response handling

### 2. Webhook Handlers (`src/services/webhook.ts`)

Updated webhook event handlers to automatically reply to:

#### Comment Events:
- Triggers on new comments on Instagram posts
- Automatically sends private reply with "Hi from AI"
- Logs successful replies and handles errors gracefully

#### Message Events:
- Triggers on new direct messages
- Automatically sends reply message with "Hi from AI"
- Handles message routing and error scenarios

### 3. Environment Configuration

Added new environment variables in `.env`:

```bash
# Instagram Messaging Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_GRAPH_API_BASE_URL=https://graph.instagram.com
INSTAGRAM_API_VERSION=v21.0
```

## API Endpoints Used

### Private Replies API
- **Endpoint**: `POST /{instagram-user-id}/private_replies`
- **Documentation**: https://developers.facebook.com/docs/instagram-platform/private-replies
- **Purpose**: Reply to comments on Instagram posts

### Messaging API
- **Endpoint**: `POST /{instagram-user-id}/messages`
- **Documentation**: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
- **Purpose**: Send direct messages to Instagram users

## Security Features

1. **Access Token Validation**: Checks for valid access token before processing
2. **Error Handling**: Comprehensive error logging and graceful failure handling
3. **Rate Limiting**: Built-in awareness of Instagram API rate limits
4. **Webhook Verification**: Maintains existing webhook signature verification

## Supported Events

### Comment Events
- New comments on posts
- Replies to existing comments
- Live video comments

### Message Events
- Direct messages from users
- Message edits
- Message reactions
- Messaging handovers

## Configuration Requirements

### 1. Instagram App Setup
- Instagram Business account required
- App must be approved for Instagram Platform
- Required permissions:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
  - `instagram_business_manage_messages`
  - `instagram_business_manage_comments`

### 2. Access Token
- Long-lived access token required
- Token must have messaging permissions
- Configure `INSTAGRAM_ACCESS_TOKEN` in environment

### 3. Webhook Subscription
- Subscribe to `comments` field for comment events
- Subscribe to `messages` field for message events
- Ensure webhook endpoint is properly configured

## Testing Instructions

### 1. Comment Testing
1. Post a comment on an Instagram post from the configured business account
2. Check webhook logs for comment event processing
3. Verify private reply is sent successfully
4. Check Instagram for the "Hi from AI" reply

### 2. Message Testing
1. Send a direct message to the Instagram business account
2. Check webhook logs for message event processing
3. Verify automatic reply is sent
4. Check Instagram conversation for the "Hi from AI" response

### 3. Error Testing
1. Test with invalid access token
2. Test with network connectivity issues
3. Verify error logging and graceful handling

## Error Handling

### Common Error Scenarios
1. **Invalid Access Token**: Logs error and skips reply
2. **API Rate Limits**: Handles rate limit responses gracefully
3. **Network Issues**: Retries and logs connection errors
4. **Invalid Recipients**: Handles cases where users can't receive messages

### Logging
- All events are logged with appropriate log levels
- Successful replies include message IDs and recipient information
- Errors include detailed context for debugging

## Compliance Notes

### Instagram Platform Policies
- Automatic replies must comply with Instagram's messaging policies
- Users must have initiated contact for direct messages
- Private replies are only allowed on business account posts

### Rate Limiting
- Instagram API has rate limits for messaging
- Service includes built-in rate limit awareness
- Consider implementing queue system for high-volume scenarios

## Migration and Deployment

### Pre-deployment Checklist
1. ✅ Configure `INSTAGRAM_ACCESS_TOKEN` in production environment
2. ✅ Verify webhook subscription includes required fields
3. ✅ Test with staging Instagram account
4. ✅ Monitor error logs during initial deployment

### Post-deployment Monitoring
1. Monitor webhook event processing logs
2. Track automatic reply success rates
3. Monitor API rate limit usage
4. Review user feedback and engagement

## Customization Options

### Message Content
- Currently hardcoded to "Hi from AI"
- Can be modified in webhook handlers
- Consider implementing dynamic message templates

### Conditional Replies
- Add logic to filter specific comment types
- Implement keyword-based triggering
- Add user blacklist/whitelist functionality

### Advanced Features
- Implement conversation context awareness
- Add sentiment analysis for appropriate responses
- Integrate with customer service platforms

## Troubleshooting

### Common Issues
1. **No replies sent**: Check access token configuration
2. **Webhook not triggered**: Verify webhook subscription
3. **API errors**: Check Instagram Platform status and permissions
4. **Rate limiting**: Implement exponential backoff

### Debug Steps
1. Check application logs for error messages
2. Verify webhook payload structure
3. Test API endpoints manually with curl/Postman
4. Validate access token permissions in Meta App Dashboard

## Next Steps

1. **Enhanced Messaging**: Implement rich media responses
2. **AI Integration**: Connect with AI services for intelligent replies
3. **Analytics**: Track engagement metrics and response effectiveness
4. **User Management**: Implement user preference management
5. **Scalability**: Add message queuing for high-volume scenarios