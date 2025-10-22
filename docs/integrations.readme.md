# Integrations API Documentation

यह documentation Instagram Automation SaaS application के सभी integrations endpoints के लिए है। ये endpoints platform connections, OAuth integrations, और social media account management के लिए हैं।

## Base URL
```
http://localhost:3000/api/integrations
```

## Table of Contents
1. [Platform Management](#platform-management)
2. [Connection Management](#connection-management)
3. [OAuth Flow](#oauth-flow)
4. [Token Management](#token-management)
5. [Platform Insights](#platform-insights)

---

## Authentication Required
सभी integration endpoints के लिए authentication की आवश्यकता होती है।

```bash
# सभी requests में cookies include करें
-b cookies.txt
```

---

## Platform Management

### 1. Get Available Platforms
**Endpoint:** `GET /platforms`  
**Description:** Available platforms और उनकी connection status प्राप्त करता है।  
**Access:** Private - Verified user access required

```bash
curl -X GET http://localhost:3000/api/integrations/platforms \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "id": "instagram",
        "name": "Instagram",
        "description": "Connect your Instagram Business account",
        "icon": "instagram-icon.svg",
        "isConnected": true,
        "connectionStatus": "active",
        "features": [
          "Post publishing",
          "Analytics",
          "Auto-replies",
          "Story management"
        ],
        "requiredPermissions": [
          "instagram_basic",
          "instagram_content_publish",
          "pages_read_engagement"
        ]
      },
      {
        "id": "facebook",
        "name": "Facebook",
        "description": "Connect your Facebook Page",
        "icon": "facebook-icon.svg",
        "isConnected": false,
        "connectionStatus": "not_connected",
        "features": [
          "Page management",
          "Post publishing",
          "Analytics"
        ]
      }
    ],
    "summary": {
      "totalPlatforms": 2,
      "connectedPlatforms": 1,
      "availableFeatures": 8
    }
  }
}
```

### 2. Get Connected Platforms
**Endpoint:** `GET /connected`  
**Description:** User के सभी connected platforms प्राप्त करता है।  
**Access:** Private - Integration manager access required

```bash
curl -X GET http://localhost:3000/api/integrations/connected \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectedPlatforms": [
      {
        "id": "conn_123",
        "platform": "instagram",
        "accountName": "@myinstagram",
        "accountId": "17841405309213570",
        "connectedAt": "2024-01-15T10:30:00Z",
        "status": "active",
        "permissions": [
          "instagram_basic",
          "instagram_content_publish"
        ],
        "tokenExpiresAt": "2024-03-15T10:30:00Z",
        "lastSyncAt": "2024-01-20T08:15:00Z",
        "features": {
          "publishing": true,
          "analytics": true,
          "autoReply": true
        }
      }
    ],
    "summary": {
      "totalConnected": 1,
      "activeConnections": 1,
      "expiringSoon": 0
    }
  }
}
```

---

## Connection Management

### 3. Get Platform Connection by ID
**Endpoint:** `GET /:id`  
**Description:** Specific platform connection की details प्राप्त करता है।  
**Access:** Private - Integration manager access required

```bash
curl -X GET http://localhost:3000/api/integrations/conn_123 \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connection": {
      "id": "conn_123",
      "platform": "instagram",
      "accountName": "@myinstagram",
      "accountId": "17841405309213570",
      "connectedAt": "2024-01-15T10:30:00Z",
      "status": "active",
      "permissions": [
        "instagram_basic",
        "instagram_content_publish",
        "pages_read_engagement"
      ],
      "tokenExpiresAt": "2024-03-15T10:30:00Z",
      "lastSyncAt": "2024-01-20T08:15:00Z",
      "accountInfo": {
        "username": "myinstagram",
        "name": "My Instagram Account",
        "profilePicture": "https://example.com/profile.jpg",
        "followersCount": 2450,
        "followingCount": 180,
        "mediaCount": 156
      },
      "features": {
        "publishing": true,
        "analytics": true,
        "autoReply": true,
        "stories": true
      },
      "settings": {
        "autoPublish": true,
        "autoReply": true,
        "analyticsSync": true
      }
    }
  }
}
```

### 4. Disconnect Platform
**Endpoint:** `DELETE /:id/disconnect`  
**Description:** Platform account को disconnect करता है।  
**Access:** Private - Integration manager access required

```bash
curl -X DELETE http://localhost:3000/api/integrations/conn_123/disconnect \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "reason": "No longer needed",
    "revokeTokens": true
  }'
```

**Request Body:**
```json
{
  "reason": "string (optional)",
  "revokeTokens": "boolean (default: true)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Platform disconnected successfully",
  "data": {
    "disconnectedAt": "2024-01-20T10:30:00Z",
    "platform": "instagram",
    "tokensRevoked": true
  }
}
```

---

## OAuth Flow

### 5. Initiate Platform Connection
**Endpoint:** `POST /:platform/connect`  
**Description:** Platform के लिए OAuth connection शुरू करता है।  
**Access:** Private - Connect account permission required

```bash
curl -X POST http://localhost:3000/api/integrations/instagram/connect \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "scopes": ["instagram_basic", "instagram_content_publish"],
    "redirectUri": "http://localhost:3000/api/integrations/instagram/callback"
  }'
```

**Request Body:**
```json
{
  "scopes": ["string array (optional)"],
  "redirectUri": "string (optional)",
  "state": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://api.instagram.com/oauth/authorize?client_id=123&redirect_uri=...",
    "state": "random_state_string",
    "expiresAt": "2024-01-20T10:40:00Z"
  }
}
```

### 6. Handle OAuth Callback
**Endpoint:** `GET /:platform/callback`  
**Description:** OAuth callback को handle करता है और connection complete करता है।  
**Access:** Private - Verified user access required

```bash
curl -X GET "http://localhost:3000/api/integrations/instagram/callback?code=oauth_code&state=state_string" \
  -b cookies.txt
```

**Query Parameters:**
- `code`: OAuth authorization code
- `state`: State parameter for security

**Response:**
```json
{
  "success": true,
  "message": "Platform connected successfully",
  "data": {
    "connectionId": "conn_123",
    "platform": "instagram",
    "accountName": "@myinstagram",
    "connectedAt": "2024-01-20T10:30:00Z",
    "permissions": [
      "instagram_basic",
      "instagram_content_publish"
    ]
  }
}
```

---

## Token Management

### 7. Refresh Platform Tokens
**Endpoint:** `POST /:id/refresh`  
**Description:** Platform tokens को refresh करता है।  
**Access:** Private - Integration manager access required

```bash
curl -X POST http://localhost:3000/api/integrations/conn_123/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "forceRefresh": false
  }'
```

**Request Body:**
```json
{
  "forceRefresh": "boolean (default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "connectionId": "conn_123",
    "refreshedAt": "2024-01-20T10:30:00Z",
    "newExpiresAt": "2024-03-20T10:30:00Z",
    "status": "active"
  }
}
```

### 8. Test Platform Connection
**Endpoint:** `POST /:id/test`  
**Description:** Platform connection को test करता है।  
**Access:** Private - Integration manager access required

```bash
curl -X POST http://localhost:3000/api/integrations/conn_123/test \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "testType": "basic"
  }'
```

**Request Body:**
```json
{
  "testType": "basic | full | permissions (default: basic)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionStatus": "active",
    "testResults": {
      "authentication": "passed",
      "permissions": "passed",
      "apiAccess": "passed",
      "dataRetrieval": "passed"
    },
    "testedAt": "2024-01-20T10:30:00Z",
    "issues": [],
    "recommendations": [
      "Consider refreshing tokens in 30 days"
    ]
  }
}
```

---

## Platform Insights

### 9. Get Platform Insights
**Endpoint:** `GET /:id/insights`  
**Description:** Platform analytics/insights प्राप्त करता है।  
**Access:** Private - Analytics access required

```bash
curl -X GET "http://localhost:3000/api/integrations/conn_123/insights?period=30d" \
  -b cookies.txt
```

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, default: 30d)
- `metrics`: Specific metrics to include (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": "instagram",
    "period": "30d",
    "insights": {
      "overview": {
        "totalPosts": 24,
        "totalReach": 15420,
        "totalImpressions": 28350,
        "totalEngagement": 1890,
        "engagementRate": 6.7
      },
      "audience": {
        "followersGrowth": 180,
        "followersGrowthRate": 7.9,
        "demographics": {
          "ageGroups": {
            "18-24": 35,
            "25-34": 40,
            "35-44": 20,
            "45+": 5
          },
          "topCities": [
            {"name": "Mumbai", "percentage": 25},
            {"name": "Delhi", "percentage": 20},
            {"name": "Bangalore", "percentage": 15}
          ]
        }
      },
      "content": {
        "topPosts": [
          {
            "id": "post_123",
            "caption": "Amazing sunset...",
            "likes": 245,
            "comments": 32,
            "reach": 1890,
            "impressions": 2340
          }
        ],
        "contentTypes": {
          "photo": {"count": 18, "avgEngagement": 78},
          "carousel": {"count": 4, "avgEngagement": 95},
          "video": {"count": 2, "avgEngagement": 120}
        }
      },
      "performance": {
        "bestPostingTimes": ["18:00", "19:00", "20:00"],
        "bestPostingDays": ["Monday", "Wednesday", "Friday"],
        "hashtagPerformance": [
          {"tag": "#photography", "reach": 2340, "engagement": 156},
          {"tag": "#nature", "reach": 1890, "engagement": 123}
        ]
      }
    }
  }
}
```

---

## Error Responses
सभी endpoints में error के case में यह format होता है:
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

## Common HTTP Status Codes
- `200` - Success
- `201` - Created (new connection)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Connection not found)
- `409` - Conflict (Platform already connected)
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Integration Testing:
```bash
# 1. Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Get available platforms
curl -X GET http://localhost:3000/api/integrations/platforms \
  -b cookies.txt

# 3. Initiate Instagram connection
curl -X POST http://localhost:3000/api/integrations/instagram/connect \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"scopes":["instagram_basic","instagram_content_publish"]}'

# 4. Get connected platforms
curl -X GET http://localhost:3000/api/integrations/connected \
  -b cookies.txt

# 5. Test connection
curl -X POST http://localhost:3000/api/integrations/conn_123/test \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"testType":"basic"}'

# 6. Get platform insights
curl -X GET http://localhost:3000/api/integrations/conn_123/insights \
  -b cookies.txt

# 7. Refresh tokens
curl -X POST http://localhost:3000/api/integrations/conn_123/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{}'
```

---

## Notes
- OAuth flow में user को external platform पर redirect किया जाता है
- Tokens automatically refresh होते हैं जब possible हो
- Connection status real-time monitor होती है
- Platform permissions user के account type पर depend करते हैं
- Insights data platform के API limitations के अनुसार available होता है