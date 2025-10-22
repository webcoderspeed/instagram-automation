# Instagram API Documentation

यह documentation Instagram Automation SaaS application के सभी Instagram API endpoints के लिए है। सभी endpoints authentication और Instagram connection की आवश्यकता होती है।

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

---

## Profile Management

### 1. Get Instagram Profile
**Endpoint:** `GET /profile`  
**Description:** Connected Instagram account की profile information return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/instagram/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
  }
}
```

---

## Media Management

### 2. Get User Media
**Endpoint:** `GET /media`  
**Description:** User के Instagram media posts की list return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/instagram/media \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Query Parameters:**
- `limit` - Number of posts to return (default: 25, max: 100)
- `after` - Pagination cursor for next page

```bash
curl -X GET "http://localhost:3000/api/instagram/media?limit=10&after=cursor_here" \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
  }
}
```

### 3. Get Media by ID
**Endpoint:** `GET /media/:mediaId`  
**Description:** Specific media post की detailed information return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/instagram/media/media_id_here \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
      "sharesCount": 10,
      "savesCount": 30,
      "reachCount": 500,
      "impressionsCount": 750,
      "hashtags": ["#photography", "#nature"],
      "mentions": ["@username1", "@username2"]
    }
  }
}
```

---

## Publishing

### 4. Publish Post
**Endpoint:** `POST /publish`  
**Description:** Instagram पर नया post publish करता है।  
**Required Role:** `CONTENT_CREATOR`

```bash
# Image Post
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "mediaType": "IMAGE",
    "imageUrl": "https://example.com/image.jpg",
    "caption": "Amazing sunset! #photography #nature #sunset",
    "location": {
      "name": "Mumbai, India",
      "latitude": 19.0760,
      "longitude": 72.8777
    }
  }'

# Video Post
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "mediaType": "VIDEO",
    "videoUrl": "https://example.com/video.mp4",
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "caption": "Check out this amazing video! #video #content"
  }'

# Carousel Post
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "mediaType": "CAROUSEL_ALBUM",
    "children": [
      {
        "mediaType": "IMAGE",
        "imageUrl": "https://example.com/image1.jpg"
      },
      {
        "mediaType": "IMAGE", 
        "imageUrl": "https://example.com/image2.jpg"
      }
    ],
    "caption": "Swipe to see more! #carousel #photos"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Post published successfully",
  "data": {
    "media": {
      "id": "new_media_id",
      "permalink": "https://instagram.com/p/NEW123/",
      "mediaType": "IMAGE",
      "publishedAt": "2024-01-01T15:00:00Z"
    }
  }
}
```

---

## Analytics & Insights

### 5. Get Media Insights
**Endpoint:** `GET /media/:mediaId/insights`  
**Description:** Specific media post के insights return करता है।  
**Required Role:** `ANALYTICS_ACCESS`

```bash
curl -X GET http://localhost:3000/api/instagram/media/media_id_here/insights \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": {
      "mediaId": "media_id",
      "reach": 1250,
      "impressions": 1800,
      "likes": 150,
      "comments": 25,
      "shares": 10,
      "saves": 30,
      "profileViews": 45,
      "websiteClicks": 5,
      "engagement": {
        "rate": 12.5,
        "total": 220
      },
      "demographics": {
        "ageGroups": {
          "18-24": 25,
          "25-34": 45,
          "35-44": 20,
          "45-54": 10
        },
        "gender": {
          "male": 60,
          "female": 40
        },
        "topCities": [
          {"name": "Mumbai", "percentage": 30},
          {"name": "Delhi", "percentage": 25}
        ]
      }
    }
  }
}
```

### 6. Get Account Insights
**Endpoint:** `GET /insights`  
**Description:** Instagram account के overall insights return करता है।  
**Required Role:** `ANALYTICS_ACCESS`

```bash
curl -X GET http://localhost:3000/api/instagram/insights \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Query Parameters:**
- `period` - Time period (day, week, days_28) - Default: week
- `since` - Start date (YYYY-MM-DD)
- `until` - End date (YYYY-MM-DD)

```bash
curl -X GET "http://localhost:3000/api/instagram/insights?period=days_28&since=2024-01-01&until=2024-01-28" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": {
      "period": "days_28",
      "dateRange": {
        "since": "2024-01-01",
        "until": "2024-01-28"
      },
      "metrics": {
        "reach": 15000,
        "impressions": 25000,
        "profileViews": 1200,
        "websiteClicks": 150,
        "emailContacts": 25,
        "phoneCallClicks": 10,
        "textMessageClicks": 5,
        "getDirectionsClicks": 30
      },
      "followerMetrics": {
        "followersCount": 1250,
        "followersGained": 85,
        "followersLost": 15,
        "netFollowersGained": 70
      },
      "contentMetrics": {
        "postsPublished": 12,
        "storiesPublished": 25,
        "averageEngagementRate": 8.5
      },
      "topPosts": [
        {
          "mediaId": "media_id_1",
          "reach": 2500,
          "engagement": 320
        }
      ]
    }
  }
}
```

---

## Hashtag Research

### 7. Get Hashtag Information
**Endpoint:** `GET /hashtags/:hashtag`  
**Description:** Specific hashtag की information और metrics return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/instagram/hashtags/photography \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hashtag": {
      "name": "photography",
      "id": "hashtag_id",
      "mediaCount": 500000000,
      "topMedia": [
        {
          "id": "media_id",
          "mediaUrl": "https://instagram.com/image.jpg",
          "permalink": "https://instagram.com/p/ABC123/",
          "likesCount": 1500,
          "commentsCount": 200
        }
      ],
      "recentMedia": [
        {
          "id": "media_id_2",
          "mediaUrl": "https://instagram.com/image2.jpg",
          "timestamp": "2024-01-01T14:00:00Z"
        }
      ]
    }
  }
}
```

---

## Rate Limits

### 8. Get Rate Limit Status
**Endpoint:** `GET /rate-limits`  
**Description:** Current Instagram API rate limits की status return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/instagram/rate-limits \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rateLimits": {
      "basicDisplay": {
        "limit": 200,
        "remaining": 150,
        "resetTime": "2024-01-01T16:00:00Z"
      },
      "contentPublishing": {
        "limit": 25,
        "remaining": 20,
        "resetTime": "2024-01-01T16:00:00Z"
      },
      "insights": {
        "limit": 200,
        "remaining": 180,
        "resetTime": "2024-01-01T16:00:00Z"
      },
      "messaging": {
        "limit": 100,
        "remaining": 95,
        "resetTime": "2024-01-01T16:00:00Z"
      }
    }
  }
}
```

---

## Important Notes

### Authentication Requirements
- सभी endpoints authenticated user की आवश्यकता होती है
- Instagram account connected होना चाहिए
- Valid Instagram access token required
- Different endpoints के लिए different roles required हैं

### Instagram API Limitations
- **Publishing**: 25 posts per day limit
- **Insights**: Business/Creator accounts only
- **Media**: Maximum 100 items per request
- **Rate Limits**: Varies by endpoint type

### Media Types Supported
- `IMAGE` - Single image posts
- `VIDEO` - Video posts (up to 60 seconds)
- `CAROUSEL_ALBUM` - Multiple images/videos
- `REELS` - Instagram Reels (coming soon)

### Content Guidelines
- Images: JPG, PNG formats
- Videos: MP4 format, max 100MB
- Captions: Max 2,200 characters
- Hashtags: Max 30 per post

### Error Responses
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "INSTAGRAM_API_ERROR",
    "type": "OAuthException",
    "details": "Instagram API error details",
    "fbtrace_id": "trace_id_here"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Instagram API Flow Test:
```bash
# 1. Login first (required for all Instagram endpoints)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Get Instagram profile
curl -X GET http://localhost:3000/api/instagram/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 3. Get user media
curl -X GET http://localhost:3000/api/instagram/media \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Get specific media details
curl -X GET http://localhost:3000/api/instagram/media/MEDIA_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 5. Publish new post
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"mediaType":"IMAGE","imageUrl":"https://example.com/image.jpg","caption":"Test post #test"}'

# 6. Get media insights
curl -X GET http://localhost:3000/api/instagram/media/MEDIA_ID/insights \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 7. Get account insights
curl -X GET http://localhost:3000/api/instagram/insights \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 8. Research hashtags
curl -X GET http://localhost:3000/api/instagram/hashtags/photography \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 9. Check rate limits
curl -X GET http://localhost:3000/api/instagram/rate-limits \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Publishing Different Media Types:
```bash
# Image Post
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"mediaType":"IMAGE","imageUrl":"https://example.com/image.jpg","caption":"Beautiful sunset! #photography"}'

# Video Post  
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"mediaType":"VIDEO","videoUrl":"https://example.com/video.mp4","caption":"Amazing video! #video"}'

# Carousel Post
curl -X POST http://localhost:3000/api/instagram/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"mediaType":"CAROUSEL_ALBUM","children":[{"mediaType":"IMAGE","imageUrl":"https://example.com/img1.jpg"},{"mediaType":"IMAGE","imageUrl":"https://example.com/img2.jpg"}],"caption":"Swipe for more! #carousel"}'
```

यह documentation आपको सभी Instagram API endpoints को test करने में मदद करेगी।