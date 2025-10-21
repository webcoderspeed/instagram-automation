# Webhook Verification Implementation

This document outlines the webhook verification implementation for Instagram automation service based on Meta's Messenger Platform webhooks documentation.

## Overview

The webhook verification system ensures secure communication between Meta's servers and your application by implementing two key security measures:

1. **Webhook Verification (GET)**: Verifies your webhook URL during setup
2. **Signature Verification (POST)**: Validates that incoming webhook events are from Meta

## Implementation Details

### 1. Webhook Verification Endpoint (GET)

**Endpoint**: `GET /webhook/instagram`

**Purpose**: Used by Meta to verify your webhook URL during setup in the App Dashboard.

**Process**:
- Meta sends a GET request with query parameters: `hub.mode`, `hub.verify_token`, and `hub.challenge`
- Your server verifies the `hub.verify_token` matches your configured `WEBHOOK_VERIFY_TOKEN`
- If valid, returns the `hub.challenge` value
- If invalid, returns a 403 error

**Implementation**: Already implemented in `src/services/webhook.ts` - `verifyWebhook()` method

### 2. Webhook Event Endpoint (POST)

**Endpoint**: `POST /webhook/instagram`

**Purpose**: Receives actual webhook events from Meta.

**Security Features**:
- **Signature Verification**: Validates `x-hub-signature-256` header using HMAC-SHA256
- **Raw Body Processing**: Uses `express.raw()` middleware to preserve raw body for signature verification
- **Proper Response**: Returns `EVENT_RECEIVED` with 200 status as required by Meta

**Updated Implementation**:
```javascript
app.post('/webhook/instagram', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify signature
  const signature = req.headers['x-hub-signature-256'];
  const isValidSignature = webhookService.verifySignature(req.body, signature);
  
  if (!isValidSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process event
  const event = JSON.parse(req.body.toString());
  await webhookService.processWebhookEvent(event);
  
  // Required response format
  return res.status(200).send('EVENT_RECEIVED');
});
```

## Environment Configuration

### Required Environment Variables

```bash
# Webhook Verify Token (used during GET verification)
WEBHOOK_VERIFY_TOKEN='HAPPY'

# Webhook Secret (used for signature verification - should match app secret)
WEBHOOK_SECRET=your_instagram_app_secret

# Webhook Endpoint Path
WEBHOOK_ENDPOINT=/webhook/instagram
```

### Meta App Dashboard Configuration

1. **Webhook URL**: `https://yourdomain.com/webhook/instagram`
2. **Verify Token**: Use the value from `WEBHOOK_VERIFY_TOKEN`
3. **Subscription Fields**: Configure based on your needs (e.g., `messages`, `messaging_postbacks`, `messaging_optins`)

## Security Features

### 1. Signature Verification

- Uses HMAC-SHA256 with your app secret
- Validates `x-hub-signature-256` header
- Implements timing-safe comparison to prevent timing attacks
- Rejects requests with missing or invalid signatures

### 2. Token Verification

- Validates verify token during webhook setup
- Prevents unauthorized webhook subscriptions
- Uses secure string comparison

## Supported Webhook Events

The implementation handles various Instagram and Messenger webhook events:

### Instagram Events
- `comments` - New comments on posts
- `live_comments` - Comments during live streams
- `mentions` - When your account is mentioned
- `story_insights` - Story performance data

### Messenger Events
- `messages` - Incoming messages
- `message_edit` - Message edits
- `message_reactions` - Message reactions
- `messaging_handover` - Thread control transfers
- `messaging_optins` - User opt-ins for notifications
- `messaging_postbacks` - Button/menu interactions
- `messaging_referral` - Referral tracking
- `messaging_seen` - Read receipts
- `standby` - Standby mode events

## Testing

### 1. Webhook Verification Test

Test the GET endpoint:
```bash
curl "https://yourdomain.com/webhook/instagram?hub.mode=subscribe&hub.verify_token=HAPPY&hub.challenge=test123"
```

Expected response: `test123`

### 2. Signature Verification Test

The signature verification is automatically tested when Meta sends real webhook events.

## Error Handling

- **401 Unauthorized**: Invalid or missing signature
- **403 Forbidden**: Webhook verification failed
- **500 Internal Server Error**: Processing errors

## Compliance

This implementation follows Meta's Messenger Platform webhooks documentation:
- https://developers.facebook.com/docs/messenger-platform/webhooks/

## Migration Notes

### Key Updates Made:
1. Added signature verification to POST endpoint
2. Updated response format to return `EVENT_RECEIVED` as required by Meta
3. Implemented raw body processing for signature verification
4. Enhanced error handling and logging
5. Updated environment variable documentation

### Breaking Changes:
- POST endpoint now requires valid signature
- Response format changed from JSON to plain text
- Raw body middleware added (may affect other JSON endpoints if not properly scoped)

## Next Steps

1. **Deploy Changes**: Deploy the updated webhook implementation
2. **Update Meta Dashboard**: Configure webhook URL and verify token
3. **Test Integration**: Verify webhook events are received and processed
4. **Monitor Logs**: Check logs for any signature verification failures