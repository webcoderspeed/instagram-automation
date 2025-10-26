# Platform Integrations API Documentation

This document provides comprehensive information about platform integration endpoints and services for managing social media connections.

## Base URL
```
https://your-domain.com/api/v1
```

## Authentication
All integration endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Required Permissions
Integration endpoints require specific role-based permissions:
- `PLATFORM_READ`: View platform connections
- `PLATFORM_WRITE`: Manage platform connections
- `INTEGRATION_MANAGE`: Full integration management

## Table of Contents
1. [Platform Account Management](#platform-account-management)
2. [OAuth Integration Flow](#oauth-integration-flow)
3. [Connection Management](#connection-management)
4. [Token Management](#token-management)
5. [Platform Services](#platform-services)
6. [Error Handling](#error-handling)

---

## Platform Account Management

### Get Platform Accounts
Retrieve all connected platform accounts for the authenticated user.

**Endpoint:** `GET /platforms/accounts`

**Required Permission:** `PLATFORM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "account_id",
        "userId": "user_id",
        "platform": "instagram",
        "platformUserId": "instagram_user_id",
        "username": "user_handle",
        "displayName": "Display Name",
        "email": "user@example.com",
        "profilePicture": "https://...",
        "isVerified": true,
        "followerCount": 1500,
        "followingCount": 300,
        "postCount": 45,
        "accountType": "BUSINESS",
        "status": "active",
        "isActive": true,
        "lastSyncAt": "2024-01-15T10:30:00Z",
        "permissions": [
          "instagram_basic",
          "instagram_content_publish",
          "instagram_manage_insights"
        ],
        "capabilities": [
          "post_publishing",
          "analytics",
          "messaging"
        ],
        "stats": {
          "totalPosts": 45,
          "totalFollowers": 1500,
          "totalFollowing": 300,
          "lastPostAt": "2024-01-14T15:20:00Z",
          "engagementRate": 3.2
        },
        "settings": {
          "autoPost": true,
          "autoReply": false,
          "notifications": true,
          "timezone": "UTC"
        },
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "totalAccounts": 1,
      "activeAccounts": 1,
      "platforms": ["instagram"]
    }
  }
}
```

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/platforms/accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Platform Account by ID
Retrieve a specific platform account by its ID.

**Endpoint:** `GET /platforms/accounts/:id`

**Required Permission:** `PLATFORM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "account_id",
      "platform": "instagram",
      "username": "user_handle",
      "displayName": "Display Name",
      "status": "active",
      "isActive": true,
      "credentials": {
        "accessToken": "[REDACTED]",
        "refreshToken": "[REDACTED]",
        "expiresAt": "2024-02-15T10:30:00Z",
        "scope": ["instagram_basic", "instagram_content_publish"],
        "tokenType": "Bearer"
      },
      "lastSyncAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Update Platform Account
Update platform account settings and configuration.

**Endpoint:** `PUT /platforms/accounts/:id`

**Required Permission:** `PLATFORM_WRITE`

**Request Body:**
```json
{
  "settings": {
    "autoPost": true,
    "autoReply": false,
    "notifications": true,
    "timezone": "America/New_York"
  },
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "account_id",
      "settings": {
        "autoPost": true,
        "autoReply": false,
        "notifications": true,
        "timezone": "America/New_York"
      },
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

### Delete Platform Account
Disconnect and remove a platform account.

**Endpoint:** `DELETE /platforms/accounts/:id`

**Required Permission:** `PLATFORM_WRITE`

**Response:**
```json
{
  "success": true,
  "message": "Platform account disconnected successfully"
}
```

---

## OAuth Integration Flow

### Instagram OAuth Integration

#### Initiate Instagram Connection
Start the Instagram OAuth flow.

**Endpoint:** `GET /instagram/oauth/connect`

**Required Permission:** `PLATFORM_WRITE`

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

#### Handle OAuth Callback
Process Instagram OAuth callback after user authorization.

**Endpoint:** `GET /instagram/oauth/callback`

**Query Parameters:**
- `code`: Authorization code from Instagram
- `state`: OAuth state parameter

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "account": {
      "id": "account_id",
      "platform": "instagram",
      "username": "user_handle",
      "displayName": "Display Name",
      "profilePicture": "https://...",
      "isVerified": true,
      "accountType": "BUSINESS"
    }
  }
}
```

#### Check Connection Status
Verify if a platform is connected.

**Endpoint:** `GET /instagram/oauth/status`

**Required Permission:** `PLATFORM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "username": "user_handle",
    "connectedAt": "2024-01-15T10:30:00Z",
    "status": "active",
    "permissions": [
      "instagram_basic",
      "instagram_content_publish"
    ]
  }
}
```

---

## Connection Management

### Refresh Platform Tokens
Refresh expired access tokens for a platform account.

**Endpoint:** `POST /platforms/accounts/:id/refresh`

**Required Permission:** `PLATFORM_WRITE`

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenRefreshed": true,
    "expiresAt": "2024-02-15T10:30:00Z",
    "lastSyncAt": "2024-01-15T11:00:00Z"
  }
}
```

### Validate Platform Connection
Check if a platform connection is valid and active.

**Endpoint:** `GET /platforms/accounts/:id/validate`

**Required Permission:** `PLATFORM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "status": "active",
    "tokenExpired": false,
    "hasRequiredPermissions": true,
    "lastValidated": "2024-01-15T11:00:00Z"
  }
}
```

### Sync Platform Data
Synchronize platform account data and statistics.

**Endpoint:** `POST /platforms/accounts/:id/sync`

**Required Permission:** `PLATFORM_WRITE`

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": true,
    "lastSyncAt": "2024-01-15T11:00:00Z",
    "updatedFields": [
      "followerCount",
      "followingCount",
      "postCount",
      "profilePicture"
    ]
  }
}
```

---

## Token Management

### Get Token Status
Check the status of platform access tokens.

**Endpoint:** `GET /platforms/tokens/status`

**Required Permission:** `PLATFORM_READ`

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "platform": "instagram",
        "accountId": "account_id",
        "isValid": true,
        "expiresAt": "2024-02-15T10:30:00Z",
        "daysUntilExpiry": 30,
        "needsRefresh": false
      }
    ],
    "summary": {
      "totalTokens": 1,
      "validTokens": 1,
      "expiredTokens": 0,
      "expiringTokens": 0
    }
  }
}
```

### Refresh All Tokens
Refresh all platform tokens for the authenticated user.

**Endpoint:** `POST /platforms/tokens/refresh-all`

**Required Permission:** `PLATFORM_WRITE`

**Response:**
```json
{
  "success": true,
  "data": {
    "refreshed": [
      {
        "platform": "instagram",
        "accountId": "account_id",
        "success": true,
        "newExpiresAt": "2024-02-15T10:30:00Z"
      }
    ],
    "failed": [],
    "summary": {
      "totalAttempted": 1,
      "successful": 1,
      "failed": 0
    }
  }
}
```

---

## Platform Services

### Platform Account Service
The `PlatformAccountService` provides core functionality for managing platform connections:

#### Key Methods:
- `getPlatformAccountFromDB(userId, platform)`: Retrieve platform account from database
- `getPlatformCredentialsFromDB(userId, platform)`: Get platform credentials
- `hasActivePlatformAccount(user, platform)`: Check if user has active platform account
- `getConnectedPlatforms(user)`: Get list of connected platforms
- `validatePlatformAccount(user, platform)`: Validate platform account status

#### Platform Account Model
The `PlatformAccountModel` manages platform account data with the following features:

**Account Status Types:**
- `ACTIVE`: Account is active and functional
- `INACTIVE`: Account is temporarily inactive
- `SUSPENDED`: Account is suspended by platform
- `EXPIRED`: Account tokens have expired
- `ERROR`: Account has errors requiring attention

**Key Fields:**
- Basic info: `userId`, `platform`, `username`, `displayName`
- Authentication: `accessToken`, `refreshToken`, `tokenExpiresAt`, `scopes`
- Status: `status`, `isActive`, `lastSyncAt`, `lastErrorAt`
- Statistics: `totalPosts`, `totalFollowers`, `totalFollowing`, `engagementRate`
- Settings: `autoPost`, `autoReply`, `notifications`, `timezone`

**Instance Methods:**
- `refreshAccessToken()`: Refresh platform access token
- `updateStats(stats)`: Update account statistics
- `updateSettings(settings)`: Update account settings
- `markError(error)`: Mark account with error
- `clearError()`: Clear account errors
- `isTokenExpired()`: Check if token is expired
- `hasPermission(permission)`: Check if account has specific permission
- `hasCapability(capability)`: Check if account has specific capability
- `softDelete()`: Soft delete account
- `restore()`: Restore soft-deleted account

**Static Methods:**
- `findByUserAndPlatform(userId, platform)`: Find account by user and platform
- `findByPlatformId(platform, id)`: Find account by platform ID
- `findActiveAccounts()`: Find all active accounts
- `findByPlatform(platform)`: Find all accounts for a platform

---

## Error Handling

### Common Error Responses

**Authentication Error:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "statusCode": 401
}
```

**Platform Not Connected:**
```json
{
  "success": false,
  "error": "Instagram account not connected",
  "code": "PLATFORM_NOT_CONNECTED",
  "statusCode": 400,
  "details": {
    "platform": "instagram",
    "action": "connect_account"
  }
}
```

**Token Expired:**
```json
{
  "success": false,
  "error": "Access token has expired",
  "code": "TOKEN_EXPIRED",
  "statusCode": 401,
  "details": {
    "platform": "instagram",
    "expiresAt": "2024-01-15T10:30:00Z",
    "action": "refresh_token"
  }
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Insufficient platform permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "statusCode": 403,
  "details": {
    "platform": "instagram",
    "required": ["instagram_content_publish"],
    "current": ["instagram_basic"]
  }
}
```

### Error Codes
- `AUTH_REQUIRED`: Authentication is required
- `PLATFORM_NOT_CONNECTED`: Platform account not connected
- `TOKEN_EXPIRED`: Access token has expired
- `TOKEN_INVALID`: Access token is invalid
- `INSUFFICIENT_PERMISSIONS`: Missing required platform permissions
- `PLATFORM_ERROR`: Platform API error
- `RATE_LIMIT_EXCEEDED`: Platform rate limit exceeded
- `ACCOUNT_SUSPENDED`: Platform account is suspended
- `SYNC_FAILED`: Platform data synchronization failed

### Best Practices

1. **Token Management**: Implement automatic token refresh before expiration
2. **Error Handling**: Always check response status and handle errors gracefully
3. **Permissions**: Verify required permissions before making platform API calls
4. **Rate Limiting**: Respect platform rate limits and implement backoff strategies
5. **Data Sync**: Regularly sync platform data to keep information current
6. **Security**: Never expose access tokens in client-side code
7. **Monitoring**: Monitor platform connection health and token expiration

### Testing Platform Integrations

```bash
# Test platform connection status
curl -X GET "https://your-domain.com/api/v1/instagram/oauth/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test platform account validation
curl -X GET "https://your-domain.com/api/v1/platforms/accounts/ACCOUNT_ID/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test token refresh
curl -X POST "https://your-domain.com/api/v1/platforms/accounts/ACCOUNT_ID/refresh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
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