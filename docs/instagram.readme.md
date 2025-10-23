# Instagram API Documentation

This documentation covers all Instagram API endpoints for the Instagram Automation SaaS application. All endpoints require authentication and Instagram connection.

## Base URL
```
http://localhost:3000/api/instagram
```

## Table of Contents
1. [Profile Management](#profile-management)
2. [Media Management](#media-management)
3. [Publishing](#publishing)
4. [Analytics & Insights](#analytics--insights)
5. [Hashtag Research](#hashtag-research)
6. [Rate Limits](#rate-limits)
7. [Error Responses](#error-responses)
8. [Authentication](#authentication)

---

## Profile Management

### 1. Get Instagram Profile
**Endpoint:** `GET /profile`  
**Description:** Retrieves connected Instagram account profile information.  
**Required Permission:** `INSTAGRAM_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "instagram_user_id",
      "username": "your_username",
      "name": "Your Display Name",
      "biography": "Your bio here",
      "website": "https://yourwebsite.com",
      "profilePictureUrl": "https://instagram.com/profile.jpg",
      "followersCount": 1250,
      "followingCount": 850,
      "mediaCount": 125,
      "isVerified": false,
      "isBusinessAccount": true,
      "accountType": "BUSINESS"
    }
  },
  "message": "Profile retrieved successfully"
}
```

---

## Media Management

### 2. Get All Media
**Endpoint:** `GET /media`  
**Description:** Retrieves all Instagram media posts for the connected account.  
**Required Permission:** `INSTAGRAM_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `limit` (optional) - Number of posts to return (default: 25, max: 100)
- `after` (optional) - Pagination cursor for next page
- `fields` (optional) - Comma-separated list of fields to include

```bash
curl -X GET "http://localhost:3000/api/instagram/media?limit=10&after=cursor_here&fields=id,caption,media_type" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "media_id",
        "mediaType": "IMAGE",
        "mediaUrl": "https://instagram.com/image.jpg",
        "permalink": "https://instagram.com/p/ABC123/",
        "caption": "Your post caption here",
        "timestamp": "2024-01-01T12:00:00Z",
        "likesCount": 150,
        "commentsCount": 25,
        "thumbnailUrl": "https://instagram.com/thumb.jpg"
      }
    ],
    "paging": {
      "cursors": {
        "before": "before_cursor",
        "after": "after_cursor"
      },
      "next": "next_page_url"
    }
  },
  "message": "Media retrieved successfully"
}
```

### 3. Get Media by ID
**Endpoint:** `GET /media/:id`  
**Description:** Retrieves specific Instagram media post by ID.  
**Required Permission:** `INSTAGRAM_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/instagram/media/media_id_here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "media_id",
      "mediaType": "IMAGE",
      "mediaUrl": "https://instagram.com/image.jpg",
      "permalink": "https://instagram.com/p/ABC123/",
      "caption": "Your post caption here",
      "timestamp": "2024-01-01T12:00:00Z",
      "likesCount": 150,
      "commentsCount": 25,
      "thumbnailUrl": "https://instagram.com/thumb.jpg",
      "children": [],
      "insights": {
        "impressions": 500,
        "reach": 450,
        "engagement": 175
      }
    }
  },
  "message": "Media retrieved successfully"
}
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