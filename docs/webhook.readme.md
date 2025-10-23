# Webhook API Documentation

**Base URL:** `https://your-domain.com/api/v1/webhook`

## Table of Contents
1. [Overview](#overview)
2. [Instagram Webhook Verification](#instagram-webhook-verification)
3. [Instagram Webhook Handler](#instagram-webhook-handler)
4. [Webhook Subscription Management](#webhook-subscription-management)
5. [Event Processing](#event-processing)
6. [Webhook Security](#webhook-security)
7. [Webhook Event Types](#webhook-event-types)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Monitoring & Analytics](#monitoring--analytics)
11. [Data Models](#data-models)
12. [Best Practices](#best-practices)
13. [Testing](#testing)

---

## Overview

The Webhook API provides real-time event processing for Instagram and Facebook platform events. It handles webhook verification, signature validation, event routing, and automated responses to user interactions.

### Key Features

- **Real-time Event Processing**: Instant handling of Instagram messages, comments, and mentions
- **Secure Verification**: SHA256 signature validation and token verification
- **Event Routing**: Intelligent routing to specialized handlers based on event type
- **Automatic Retries**: Built-in retry logic for failed event processing
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Rate Limiting**: Protection against abuse and excessive requests
- **Subscription Management**: Easy webhook subscription and configuration

---

## Instagram Webhook Verification

### 1. Verify Instagram Webhook
**Endpoint:** `GET /instagram`  
**Description:** Instagram webhook verification के लिए challenge response करता है।  
**Authentication:** Not Required (Public endpoint for Facebook/Instagram verification)

```bash
curl -X GET "http://localhost:3000/api/webhook/instagram?hub.mode=subscribe&hub.challenge=1234567890&hub.verify_token=your_verify_token" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `hub.mode` (required): Must be "subscribe"
- `hub.challenge` (required): Challenge string from Instagram
- `hub.verify_token` (required): Verification token configured in your app

**Response (Success):**
```
1234567890
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Webhook verification failed",
  "error": {
    "code": "VERIFICATION_FAILED",
    "details": "Invalid verify token"
  }
}
```

---

## Instagram Webhook Handler

### 2. Handle Instagram Webhook Events
**Endpoint:** `POST /instagram`  
**Description:** Instagram से आने वाले webhook events को process करता है।  
**Authentication:** Not Required (External webhook endpoint)

```bash
curl -X POST http://localhost:3000/api/webhook/instagram \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=signature_here" \
  -d '{
    "object": "instagram",
    "entry": [
      {
        "id": "instagram_business_account_id",
        "time": 1234567890,
        "changes": [
          {
            "field": "comments",
            "value": {
              "id": "comment_id",
              "text": "Great post!",
              "from": {
                "id": "user_id",
                "username": "user123"
              },
              "media": {
                "id": "media_id",
                "media_product_type": "FEED"
              }
            }
          }
        ]
      }
    ]
  }'
```

**Headers:**
- `X-Hub-Signature-256`: Instagram webhook signature for verification
- `Content-Type`: application/json

**Request Body:**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "instagram_business_account_id",
      "time": 1234567890,
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "comment_id",
            "text": "Great post!",
            "from": {
              "id": "user_id",
              "username": "user123"
            },
            "media": {
              "id": "media_id",
              "media_product_type": "FEED"
            }
          }
        }
      ]
    }
  ]
}
```

**Supported Webhook Fields:**
- `comments` - New comments on posts
- `mentions` - Mentions in stories/posts
- `messages` - Direct messages
- `messaging_postbacks` - Message postback events
- `messaging_optins` - Message opt-in events

**Response (Success):**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "eventsProcessed": 1,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Webhook processing failed",
  "error": {
    "code": "PROCESSING_ERROR",
    "details": "Invalid signature"
  }
}
```

---

## Webhook Subscription Management

### 3. Subscribe to Webhook Events
**Endpoint:** `POST /subscribe`  
**Description:** नए webhook events के लिए subscription create करता है।  
**Required Role:** `INTEGRATION_MANAGER`

```bash
curl -X POST http://localhost:3000/api/webhook/subscribe \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "platform": "instagram",
    "events": ["comments", "mentions", "messages"],
    "callbackUrl": "https://your-app.com/webhook/instagram",
    "verifyToken": "your_custom_verify_token",
    "active": true
  }'
```

**Request Body:**
```json
{
  "platform": "instagram",
  "events": ["comments", "mentions", "messages"],
  "callbackUrl": "https://your-app.com/webhook/instagram",
  "verifyToken": "your_custom_verify_token",
  "active": true,
  "retryPolicy": {
    "maxRetries": 3,
    "retryDelay": 5000
  },
  "filters": {
    "mediaTypes": ["FEED", "STORY"],
    "userTypes": ["business", "creator"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook subscription created successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "platform": "instagram",
      "events": ["comments", "mentions", "messages"],
      "callbackUrl": "https://your-app.com/webhook/instagram",
      "active": true,
      "createdAt": "2024-01-01T12:00:00Z",
      "status": "active",
      "lastDelivery": null,
      "deliveryStats": {
        "successful": 0,
        "failed": 0,
        "pending": 0
      }
    }
  }
}
```

### 4. Get Webhook Subscriptions
**Endpoint:** `GET /subscriptions`  
**Description:** User के सभी webhook subscriptions return करता है।  
**Required Role:** `INTEGRATION_MANAGER`

```bash
curl -X GET "http://localhost:3000/api/webhook/subscriptions?platform=instagram&status=active" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Query Parameters:**
- `platform` (optional): Filter by platform (instagram, facebook, twitter)
- `status` (optional): Filter by status (active, inactive, failed)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "sub_1234567890",
        "platform": "instagram",
        "events": ["comments", "mentions", "messages"],
        "callbackUrl": "https://your-app.com/webhook/instagram",
        "active": true,
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z",
        "status": "active",
        "lastDelivery": "2024-01-01T11:30:00Z",
        "deliveryStats": {
          "successful": 45,
          "failed": 2,
          "pending": 0,
          "lastSuccess": "2024-01-01T11:30:00Z",
          "lastFailure": "2024-01-01T10:15:00Z"
        },
        "retryPolicy": {
          "maxRetries": 3,
          "retryDelay": 5000,
          "currentRetries": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 5. Update Webhook Subscription
**Endpoint:** `PUT /subscriptions/:id`  
**Description:** Existing webhook subscription को update करता है।  
**Required Role:** `INTEGRATION_MANAGER`

```bash
curl -X PUT http://localhost:3000/api/webhook/subscriptions/sub_1234567890 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "events": ["comments", "mentions", "messages", "messaging_postbacks"],
    "active": true,
    "retryPolicy": {
      "maxRetries": 5,
      "retryDelay": 3000
    }
  }'
```

**Request Body:**
```json
{
  "events": ["comments", "mentions", "messages", "messaging_postbacks"],
  "callbackUrl": "https://your-new-app.com/webhook/instagram",
  "active": true,
  "retryPolicy": {
    "maxRetries": 5,
    "retryDelay": 3000
  },
  "filters": {
    "mediaTypes": ["FEED", "STORY", "REEL"],
    "userTypes": ["business", "creator", "personal"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook subscription updated successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "platform": "instagram",
      "events": ["comments", "mentions", "messages", "messaging_postbacks"],
      "callbackUrl": "https://your-new-app.com/webhook/instagram",
      "active": true,
      "updatedAt": "2024-01-01T13:00:00Z"
    }
  }
}
```

### 6. Delete Webhook Subscription
**Endpoint:** `DELETE /subscriptions/:id`  
**Description:** Webhook subscription को delete करता है।  
**Required Role:** `INTEGRATION_MANAGER`

```bash
curl -X DELETE http://localhost:3000/api/webhook/subscriptions/sub_1234567890 \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook subscription deleted successfully",
  "data": {
    "deletedSubscription": {
      "id": "sub_1234567890",
      "platform": "instagram",
      "deletedAt": "2024-01-01T14:00:00Z"
    }
  }
}
```

### 7. Test Webhook Delivery
**Endpoint:** `POST /subscriptions/:id/test`  
**Description:** Webhook delivery को test करता है।  
**Required Role:** `INTEGRATION_MANAGER`

```bash
curl -X POST http://localhost:3000/api/webhook/subscriptions/sub_1234567890/test \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "eventType": "comments",
    "testData": {
      "comment": {
        "id": "test_comment_123",
        "text": "Test comment for webhook",
        "from": {
          "id": "test_user_456",
          "username": "testuser"
        }
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Test webhook delivered successfully",
  "data": {
    "testResult": {
      "deliveryId": "test_delivery_789",
      "status": "delivered",
      "responseCode": 200,
      "responseTime": 245,
      "timestamp": "2024-01-01T15:00:00Z"
    }
  }
}
```

---

## Webhook Security

### Signature Verification
Instagram webhooks include a signature header for verification:

```javascript
// Example signature verification
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

### Security Headers
```bash
# Required headers for webhook requests
X-Hub-Signature-256: sha256=signature_here
Content-Type: application/json
User-Agent: facebookexternalua
```

### IP Whitelisting
Instagram webhook requests come from these IP ranges:
- `173.252.74.0/24`
- `173.252.75.0/24` 
- `173.252.76.0/24`
- `173.252.77.0/24`
- `69.63.176.0/24`
- `69.63.177.0/24`
- `69.63.178.0/24`
- `69.63.179.0/24`

---

## Webhook Event Types

### Comment Events
```json
{
  "field": "comments",
  "value": {
    "id": "comment_id",
    "text": "Amazing content!",
    "from": {
      "id": "user_id",
      "username": "user123"
    },
    "media": {
      "id": "media_id",
      "media_product_type": "FEED"
    },
    "parent_id": null,
    "created_time": "2024-01-01T12:00:00+0000"
  }
}
```

### Mention Events
```json
{
  "field": "mentions",
  "value": {
    "comment_id": "mention_comment_id",
    "media_id": "media_id",
    "from": {
      "id": "user_id",
      "username": "user123"
    },
    "text": "Check out @yourusername",
    "created_time": "2024-01-01T12:00:00+0000"
  }
}
```

### Message Events
```json
{
  "field": "messages",
  "value": {
    "from": {
      "id": "user_id",
      "username": "user123"
    },
    "to": {
      "id": "page_id"
    },
    "message": {
      "mid": "message_id",
      "text": "Hello! I have a question about your product.",
      "created_time": "2024-01-01T12:00:00+0000"
    }
  }
}
```

---

## Error Handling

### Common Error Codes
- `VERIFICATION_FAILED` - Webhook verification failed
- `INVALID_SIGNATURE` - Request signature is invalid
- `PROCESSING_ERROR` - Error processing webhook event
- `SUBSCRIPTION_NOT_FOUND` - Webhook subscription not found
- `RATE_LIMIT_EXCEEDED` - Too many webhook requests
- `INVALID_PAYLOAD` - Webhook payload is malformed

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "field": "field_name",
    "details": "Detailed error information",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Retry Logic
- Failed webhook deliveries are automatically retried
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Maximum 5 retry attempts
- Subscriptions disabled after 10 consecutive failures

---

## Rate Limiting

### Webhook Endpoints
- **Verification**: 100 requests per minute
- **Event Handler**: 1000 requests per minute
- **Subscription Management**: 60 requests per hour
- **Test Delivery**: 10 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Monitoring & Analytics

### Webhook Delivery Stats
```bash
curl -X GET http://localhost:3000/api/webhook/subscriptions/sub_1234567890/stats \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalDeliveries": 1000,
      "successfulDeliveries": 985,
      "failedDeliveries": 15,
      "averageResponseTime": 150,
      "lastDelivery": "2024-01-01T12:00:00Z",
      "uptime": 98.5,
      "dailyStats": [
        {
          "date": "2024-01-01",
          "deliveries": 50,
          "successful": 49,
          "failed": 1
        }
      ]
    }
  }
}
```

---

## Testing Workflow

### Complete Webhook Setup Test:
```bash
# 1. Login first (required for subscription management)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Create webhook subscription
curl -X POST http://localhost:3000/api/webhook/subscribe \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "platform": "instagram",
    "events": ["comments", "mentions"],
    "callbackUrl": "https://your-app.com/webhook/instagram",
    "verifyToken": "your_verify_token",
    "active": true
  }'

# 3. Get all subscriptions
curl -X GET http://localhost:3000/api/webhook/subscriptions \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Test webhook verification (simulate Instagram verification)
curl -X GET "http://localhost:3000/api/webhook/instagram?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=your_verify_token"

# 5. Test webhook delivery
curl -X POST http://localhost:3000/api/webhook/subscriptions/sub_1234567890/test \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"eventType": "comments", "testData": {"comment": {"text": "Test"}}}'

# 6. Simulate Instagram webhook event
curl -X POST http://localhost:3000/api/webhook/instagram \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=calculated_signature" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "instagram_account_id",
      "time": 1640995200,
      "changes": [{
        "field": "comments",
        "value": {
          "id": "comment_123",
          "text": "Great post!",
          "from": {"id": "user_456", "username": "testuser"}
        }
      }]
    }]
  }'

# 7. Get webhook delivery stats
curl -X GET http://localhost:3000/api/webhook/subscriptions/sub_1234567890/stats \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 8. Update subscription
curl -X PUT http://localhost:3000/api/webhook/subscriptions/sub_1234567890 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"events": ["comments", "mentions", "messages"], "active": true}'

# 9. Delete subscription
curl -X DELETE http://localhost:3000/api/webhook/subscriptions/sub_1234567890 \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Instagram Webhook Setup Checklist:
1. ✅ Configure webhook URL in Facebook Developer Console
2. ✅ Set verify token in environment variables
3. ✅ Whitelist Instagram IP addresses
4. ✅ Implement signature verification
5. ✅ Test webhook verification endpoint
6. ✅ Test webhook event handling
7. ✅ Monitor webhook delivery stats
8. ✅ Set up error handling and retries

यह documentation आपको सभी webhook endpoints को setup और test करने में मदद करेगी।