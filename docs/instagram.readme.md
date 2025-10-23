# Instagram API Documentation

This document provides comprehensive information about the Instagram API integration endpoints and services.

## Base URL
```
https://your-domain.com/api/v1/instagram
```

## Authentication
All Instagram API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Required Permissions
Most Instagram endpoints require specific role-based permissions:
- `INSTAGRAM_READ`: View Instagram data
- `INSTAGRAM_WRITE`: Modify Instagram data
- `INSTAGRAM_PUBLISH`: Publish content to Instagram

## Rate Limits
- **General**: 100 requests per minute per user
- **Publishing**: 25 posts per day per account
- **Insights**: 200 requests per hour per account

---

## OAuth Integration

### Connect Instagram Account
Initiate Instagram OAuth connection for the authenticated user.

**Endpoint:** `GET /oauth/connect`

**Required Permission:** `INSTAGRAM_WRITE`

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://api.instagram.com/oauth/authorize?...",
    "state": "oauth_state_parameter"
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/oauth/connect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### OAuth Callback
Handle Instagram OAuth callback after user authorization.

**Endpoint:** `GET /oauth/callback`

**Query Parameters:**
- `code`: Authorization code from Instagram
- `state`: OAuth state parameter

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "profile": {
      "id": "instagram_user_id",
      "username": "user_handle",
      "name": "Display Name"
    }
  }
}
```

### Disconnect Instagram Account
Disconnect the user's Instagram account.

**Endpoint:** `DELETE /oauth/disconnect`

**Required Permission:** `INSTAGRAM_WRITE`

**Response:**
```json
{
  "success": true,
  "message": "Instagram account disconnected successfully"
}
```

### Check Connection Status
Check if user has a connected Instagram account.

**Endpoint:** `GET /oauth/status`

**Required Permission:** `INSTAGRAM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "username": "user_handle",
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Profile Management

### Get Instagram Profile
Retrieve the authenticated user's Instagram profile information.

**Endpoint:** `GET /profile`

**Required Permission:** `INSTAGRAM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "instagram_user_id",
    "username": "user_handle",
    "name": "Display Name",
    "profile_picture_url": "https://...",
    "followers_count": 1500,
    "follows_count": 300,
    "media_count": 45,
    "account_type": "BUSINESS"
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Media Management

### Get User Media
Retrieve the user's Instagram media posts.

**Endpoint:** `GET /media`

**Required Permission:** `INSTAGRAM_READ`

**Query Parameters:**
- `limit` (optional): Number of media items to return (default: 25, max: 100)
- `after` (optional): Cursor for pagination
- `before` (optional): Cursor for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "media_id",
        "caption": "Post caption",
        "media_url": "https://...",
        "media_type": "IMAGE",
        "timestamp": "2024-01-15T10:30:00Z",
        "permalink": "https://instagram.com/p/...",
        "like_count": 42,
        "view_count": 150,
        "username": "user_handle",
        "thumbnail_url": "https://...",
        "shortcode": "ABC123",
        "is_shared_to_feed": true,
        "is_comment_enabled": true
      }
    ],
    "paging": {
      "cursors": {
        "before": "cursor_string",
        "after": "cursor_string"
      },
      "next": "next_page_url"
    }
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/media?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Media by ID
Retrieve specific media information by ID.

**Endpoint:** `GET /media/:id`

**Required Permission:** `INSTAGRAM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media_id",
    "caption": "Post caption",
    "media_url": "https://...",
    "media_type": "IMAGE",
    "timestamp": "2024-01-15T10:30:00Z",
    "permalink": "https://instagram.com/p/...",
    "like_count": 42,
    "view_count": 150,
    "username": "user_handle",
    "thumbnail_url": "https://...",
    "shortcode": "ABC123"
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/media/MEDIA_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Content Publishing

### Publish Post
Publish a new post to Instagram.

**Endpoint:** `POST /publish`

**Required Permission:** `INSTAGRAM_PUBLISH`

**Request Body:**
```json
{
  "image_url": "https://example.com/image.jpg",
  "caption": "Your post caption with #hashtags",
  "location_id": "location_id_optional",
  "user_tags": [
    {
      "username": "tagged_user",
      "x": 0.5,
      "y": 0.5
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "published_media_id",
    "status": "PUBLISHED"
  }
}
```

**Example Request:**
```bash
curl -X POST "https://your-domain.com/api/v1/instagram/publish" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "caption": "Check out this amazing photo! #photography"
  }'
```

---

## Insights & Analytics

### Get Media Insights
Retrieve insights for a specific media post.

**Endpoint:** `GET /media/:id/insights`

**Required Permission:** `INSTAGRAM_READ`

**Query Parameters:**
- `metric`: Comma-separated list of metrics (impressions, reach, engagement, saves, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "impressions": 1250,
    "reach": 980,
    "engagement": 85,
    "saves": 12,
    "shares": 8,
    "profile_visits": 15,
    "website_clicks": 3
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/media/MEDIA_ID/insights?metric=impressions,reach,engagement" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Account Insights
Retrieve account-level insights and analytics.

**Endpoint:** `GET /insights`

**Required Permission:** `INSTAGRAM_READ`

**Query Parameters:**
- `metric`: Comma-separated list of metrics
- `period`: Time period (day, week, days_28)
- `since`: Start date (YYYY-MM-DD)
- `until`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "impressions": 15420,
    "reach": 12350,
    "profile_views": 890,
    "website_clicks": 45,
    "follower_count": 1520,
    "email_contacts": 12,
    "phone_call_clicks": 3,
    "text_message_clicks": 8
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/insights?metric=impressions,reach,profile_views&period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Hashtag Research

### Get Hashtag Information
Retrieve information about a specific hashtag.

**Endpoint:** `GET /hashtag/:hashtag`

**Required Permission:** `INSTAGRAM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "hashtag_id",
    "name": "photography",
    "media_count": 500000000,
    "top_posts": [
      {
        "id": "media_id",
        "media_url": "https://...",
        "like_count": 1250
      }
    ]
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/instagram/hashtag/photography" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Rate Limiting

### Check Rate Limits
Check current API rate limit status.

**Endpoint:** `GET /rate-limit`

**Required Permission:** `INSTAGRAM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "limit": 200,
    "remaining": 150,
    "reset": "2024-01-15T11:00:00Z",
    "percentage_used": 25
  }
}
```

---

## Instagram Services Architecture

### Core Services

#### 1. InstagramIntegrationService
Main orchestration service that coordinates all Instagram functionality:
- OAuth flow management
- Service composition and delegation
- Error handling and logging
- Token management

#### 2. InstagramAuthService
Handles OAuth authentication and token management:
- Generate OAuth URLs with state validation
- Exchange authorization codes for tokens
- Refresh long-lived tokens
- Validate and manage OAuth state

#### 3. InstagramProfileService
Manages user profile operations:
- Fetch user profile information
- Get profile by Instagram user ID
- Limited profile updates (API restrictions)

#### 4. InstagramMediaService
Handles media-related operations:
- Retrieve user's media posts
- Get specific media by ID
- Media pagination and filtering
- Media metadata and insights

#### 5. InstagramContentPublishingService
Manages content creation and publishing:
- Create media containers
- Publish single images and videos
- Handle carousel posts
- Schedule content publishing
- Manage content templates

#### 6. InstagramInsightsService
Provides analytics and insights:
- Account-level insights
- Media-specific insights
- Story insights
- Audience demographics
- Performance metrics

#### 7. InstagramMessagingService
Handles direct messaging functionality:
- Send text messages
- Send media attachments
- Typing indicators
- Message templates
- Quick replies

### Error Handling

All services implement consistent error handling:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### Common Error Codes
- `INVALID_TOKEN`: Access token is invalid or expired
- `INSUFFICIENT_PERMISSIONS`: Missing required Instagram permissions
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `MEDIA_NOT_FOUND`: Requested media does not exist
- `PUBLISHING_FAILED`: Content publishing failed
- `OAUTH_ERROR`: OAuth flow error

### Best Practices

1. **Token Management**: Always handle token expiration gracefully
2. **Rate Limiting**: Implement proper rate limiting to avoid API restrictions
3. **Error Handling**: Always check response success status
4. **Permissions**: Ensure users have granted necessary Instagram permissions
5. **Media Validation**: Validate media URLs and formats before publishing
6. **Pagination**: Use proper pagination for large data sets

### Testing

Use the provided test endpoints to verify your integration:

```bash
# Test connection
curl -X GET "https://your-domain.com/api/v1/instagram/oauth/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test profile access
curl -X GET "https://your-domain.com/api/v1/instagram/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Publishing

### 4. Publish Post
**Endpoint:** `POST /publish`  
**Description:** Publishes a new post to Instagram.  
**Required Permission:** `INSTAGRAM_PUBLISH`  
**Rate Limit:** Strict rate limit applies

**Request Body:**
```json
{
  "mediaType": "IMAGE",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Your post caption with #hashtags",
  "location": {
    "id": "location_id",
    "name": "Location Name"
  },
  "scheduledTime": "2024-01-01T12:00:00Z"
}
```

```bash
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "mediaType": "IMAGE",
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Your post caption with #hashtags"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "creation_id",
      "status": "PUBLISHED",
      "mediaId": "published_media_id",
      "permalink": "https://instagram.com/p/ABC123/",
      "publishedAt": "2024-01-01T12:00:00Z"
    }
  },
  "message": "Post published successfully"
}
```

---

## Analytics & Insights

### 5. Get Media Insights
**Endpoint:** `GET /insights/media`  
**Description:** Retrieves insights and analytics for Instagram media.  
**Required Permission:** `INSTAGRAM_INSIGHTS`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/insights/media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `mediaId` (optional) - Specific media ID to get insights for
- `since` (optional) - Start date for insights (YYYY-MM-DD)
- `until` (optional) - End date for insights (YYYY-MM-DD)
- `period` (optional) - Time period (day, week, days_28)

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "mediaId": "media_id",
        "impressions": 1500,
        "reach": 1200,
        "engagement": 180,
        "likes": 150,
        "comments": 25,
        "shares": 5,
        "saves": 30,
        "profileViews": 45,
        "websiteClicks": 10
      }
    ],
    "summary": {
      "totalImpressions": 1500,
      "totalReach": 1200,
      "totalEngagement": 180,
      "engagementRate": 12.0
    }
  },
  "message": "Media insights retrieved successfully"
}
```

### 6. Get Account Insights
**Endpoint:** `GET /insights/account`  
**Description:** Retrieves account-level insights and analytics.  
**Required Permission:** `INSTAGRAM_INSIGHTS`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/insights/account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `since` (optional) - Start date for insights (YYYY-MM-DD)
- `until` (optional) - End date for insights (YYYY-MM-DD)
- `period` (optional) - Time period (day, week, days_28)

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": {
      "impressions": 15000,
      "reach": 12000,
      "profileViews": 450,
      "websiteClicks": 120,
      "emailContacts": 25,
      "phoneCallClicks": 10,
      "textMessageClicks": 5,
      "getDirectionsClicks": 15,
      "followerCount": 1250,
      "followingCount": 850
    },
    "demographics": {
      "ageGender": [
        {
          "ageRange": "25-34",
          "gender": "F",
          "percentage": 35.5
        }
      ],
      "cities": [
        {
          "city": "New York",
          "percentage": 25.0
        }
      ],
      "countries": [
        {
          "country": "US",
          "percentage": 60.0
        }
      ]
    }
  },
  "message": "Account insights retrieved successfully"
}
```

---

## Hashtag Research

### 7. Get Hashtag Information
**Endpoint:** `GET /hashtags/:hashtag`  
**Description:** Retrieves information about a specific hashtag.  
**Required Permission:** `INSTAGRAM_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/hashtags/socialmedia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hashtag": {
      "id": "hashtag_id",
      "name": "socialmedia",
      "mediaCount": 1500000,
      "topPosts": [
        {
          "id": "media_id",
          "mediaUrl": "https://instagram.com/image.jpg",
          "permalink": "https://instagram.com/p/ABC123/",
          "caption": "Post caption",
          "likesCount": 500,
          "commentsCount": 50
        }
      ],
      "recentPosts": [
        {
          "id": "media_id",
          "mediaUrl": "https://instagram.com/image.jpg",
          "permalink": "https://instagram.com/p/DEF456/",
          "caption": "Recent post caption",
          "timestamp": "2024-01-01T12:00:00Z"
        }
      ]
    }
  },
  "message": "Hashtag information retrieved successfully"
}
```

---

## Rate Limits

### 8. Check Rate Limits
**Endpoint:** `GET /rate-limits`  
**Description:** Retrieves current rate limit status for Instagram API.  
**Required Permission:** `INSTAGRAM_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/rate-limits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rateLimits": {
      "callsUsed": 150,
      "callsRemaining": 850,
      "totalCalls": 1000,
      "resetTime": "2024-01-01T13:00:00Z",
      "percentageUsed": 15.0
    },
    "endpoints": {
      "media": {
        "used": 50,
        "limit": 200,
        "resetTime": "2024-01-01T13:00:00Z"
      },
      "insights": {
        "used": 25,
        "limit": 100,
        "resetTime": "2024-01-01T13:00:00Z"
      },
      "publishing": {
        "used": 5,
        "limit": 25,
        "resetTime": "2024-01-01T13:00:00Z"
      }
    }
  },
  "message": "Rate limits retrieved successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "mediaType",
        "message": "Media type is required"
      }
    ]
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource",
    "requiredPermission": "INSTAGRAM_READ"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Media not found"
  }
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 3600
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### Instagram-Specific Error Codes

**INSTAGRAM_NOT_CONNECTED**
```json
{
  "success": false,
  "error": {
    "code": "INSTAGRAM_NOT_CONNECTED",
    "message": "Instagram account not connected. Please connect your Instagram account first."
  }
}
```

**INSTAGRAM_TOKEN_EXPIRED**
```json
{
  "success": false,
  "error": {
    "code": "INSTAGRAM_TOKEN_EXPIRED",
    "message": "Instagram access token has expired. Please reconnect your account."
  }
}
```

**INSTAGRAM_API_ERROR**
```json
{
  "success": false,
  "error": {
    "code": "INSTAGRAM_API_ERROR",
    "message": "Instagram API returned an error",
    "details": {
      "instagramError": "Invalid media URL",
      "instagramCode": 100
    }
  }
}
```

**MEDIA_UPLOAD_FAILED**
```json
{
  "success": false,
  "error": {
    "code": "MEDIA_UPLOAD_FAILED",
    "message": "Failed to upload media to Instagram",
    "details": {
      "reason": "Unsupported media format"
    }
  }
}
```

---

## Authentication

All Instagram API endpoints require:

1. **User Authentication**: Valid JWT token in Authorization header
2. **Instagram Connection**: User must have connected Instagram account
3. **Permissions**: Specific permissions based on endpoint requirements

### Required Permissions

- `INSTAGRAM_READ` - For reading profile, media, and insights
- `INSTAGRAM_PUBLISH` - For publishing posts
- `INSTAGRAM_INSIGHTS` - For accessing analytics and insights

### Rate Limiting

- **General endpoints**: 1000 requests per hour per user
- **Publishing endpoints**: 25 requests per hour per user
- **Insights endpoints**: 200 requests per hour per user

Rate limits are enforced per user and reset every hour. When rate limit is exceeded, the API returns a 429 status code with retry information.

### Security Features

- All requests must be made over HTTPS in production
- JWT tokens expire after 24 hours
- Instagram tokens are automatically refreshed when possible
- All sensitive data is encrypted in transit and at rest
- Request validation and sanitization applied to all inputs