# Automation API Documentation

यह documentation Instagram Automation SaaS application के सभी automation endpoints के लिए है। सभी endpoints authentication और role-based permissions की आवश्यकता होती है।

## Base URL
```
http://localhost:3000/api/automation
```

## Table of Contents
1. [Automation Management](#automation-management)
2. [Automation Templates](#automation-templates)
3. [Automation Control](#automation-control)
4. [Automation Analytics](#automation-analytics)

---

## Automation Management

### 1. Get All Automations
**Endpoint:** `GET /`  
**Description:** User के सभी automations की paginated list return करता है with filtering options।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_LIST`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active, paused, stopped)
- `type` (optional): Filter by automation type
- `search` (optional): Search by name or description

```bash
curl -X GET "http://localhost:3000/api/automation?page=1&limit=10&status=active" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "automations": [
      {
        "id": "automation_id",
        "name": "Auto Like Posts",
        "description": "Automatically likes posts with specific hashtags",
        "type": "like_posts",
        "status": "active",
        "platformAccountId": "platform_account_id",
        "settings": {
          "targetHashtags": ["#photography", "#nature"],
          "likesPerHour": 30,
          "maxLikesPerDay": 500
        },
        "schedule": {
          "enabled": true,
          "startTime": "09:00",
          "endTime": "18:00",
          "timezone": "Asia/Kolkata",
          "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T11:00:00Z",
        "lastRun": "2024-01-01T11:00:00Z",
        "nextRun": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "total": 25,
      "active": 15,
      "paused": 8,
      "stopped": 2
    }
  }
}
```

### 2. Get Automation by ID
**Endpoint:** `GET /:id`  
**Description:** Specific automation की detailed information return करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_READ`

```bash
curl -X GET http://localhost:3000/api/automations/automation_id_here \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "automation": {
      "id": "automation_id",
      "name": "Auto Like Posts",
      "description": "Automatically likes posts with specific hashtags",
      "type": "like_posts",
      "status": "active",
      "platformAccountId": "platform_account_id",
      "settings": {
        "targetHashtags": ["#photography", "#nature"],
        "likesPerHour": 30,
        "maxLikesPerDay": 500,
        "targetAccounts": ["@photographer1", "@naturelover"],
        "avoidRecentlyLiked": true,
        "minFollowers": 100,
        "maxFollowers": 10000
      },
      "schedule": {
        "enabled": true,
        "startTime": "09:00",
        "endTime": "18:00",
        "timezone": "Asia/Kolkata",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T11:00:00Z",
      "lastRun": "2024-01-01T11:00:00Z",
      "nextRun": "2024-01-01T12:00:00Z",
      "runCount": 150,
      "successCount": 145,
      "errorCount": 5
    }
  }
}
```

### 3. Create New Automation
**Endpoint:** `POST /`  
**Description:** नया automation create करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_CREATE`  
**Validation:** createAutomationSchema applied

```bash
curl -X POST http://localhost:3000/api/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Auto Follow Users",
    "description": "Automatically follow users based on hashtags",
    "type": "follow_users",
    "platformAccountId": "platform_account_id",
    "settings": {
      "targetHashtags": ["#photography", "#travel"],
      "followsPerHour": 20,
      "maxFollowsPerDay": 200,
      "minFollowers": 50,
      "maxFollowers": 5000
    },
    "schedule": {
      "enabled": true,
      "startTime": "10:00",
      "endTime": "17:00",
      "timezone": "Asia/Kolkata",
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Automation created successfully",
  "data": {
    "automation": {
      "id": "new_automation_id",
      "name": "Auto Follow Users",
      "description": "Automatically follow users based on hashtags",
      "type": "follow_users",
      "status": "paused",
      "platformAccountId": "platform_account_id",
      "settings": {
        "targetHashtags": ["#photography", "#travel"],
        "followsPerHour": 20,
        "maxFollowsPerDay": 200,
        "minFollowers": 50,
        "maxFollowers": 5000
      },
      "schedule": {
        "enabled": true,
        "startTime": "10:00",
        "endTime": "17:00",
        "timezone": "Asia/Kolkata",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 4. Update Automation
**Endpoint:** `PUT /:id`  
**Description:** Existing automation को update करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_UPDATE`  
**Validation:** updateAutomationSchema applied

```bash
curl -X PUT http://localhost:3000/api/automations/automation_id_here \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated Auto Like Posts",
    "settings": {
      "targetHashtags": ["#photography", "#nature", "#landscape"],
      "likesPerHour": 25,
      "maxLikesPerDay": 400
    },
    "schedule": {
      "enabled": true,
      "startTime": "08:00",
      "endTime": "20:00"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Automation updated successfully",
  "data": {
    "automation": {
      "id": "automation_id",
      "name": "Updated Auto Like Posts",
      "description": "Automatically likes posts with specific hashtags",
      "type": "like_posts",
      "status": "active",
      "settings": {
        "targetHashtags": ["#photography", "#nature", "#landscape"],
        "likesPerHour": 25,
        "maxLikesPerDay": 400
      },
      "schedule": {
        "enabled": true,
        "startTime": "08:00",
        "endTime": "20:00",
        "timezone": "Asia/Kolkata",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "updatedAt": "2024-01-01T13:00:00Z"
    }
  }
}
```

### 5. Delete Automation
**Endpoint:** `DELETE /:id`  
**Description:** Automation को permanently delete करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_DELETE`

```bash
curl -X DELETE http://localhost:3000/api/automations/automation_id_here \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Automation deleted successfully"
}
```

---

## Automation Templates

### 6. Get All Templates
**Endpoint:** `GET /templates`  
**Description:** Available automation templates की list return करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_LIST`

```bash
curl -X GET http://localhost:3000/api/automations/templates \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_1",
        "name": "Hashtag Engagement",
        "description": "Automatically like and comment on posts with specific hashtags",
        "type": "engagement",
        "category": "growth",
        "defaultSettings": {
          "targetHashtags": [],
          "likesPerHour": 30,
          "commentsPerHour": 10,
          "maxActionsPerDay": 500
        },
        "features": ["auto_like", "auto_comment", "hashtag_targeting"],
        "popularity": 95
      },
      {
        "id": "template_2",
        "name": "Follow Back Automation",
        "description": "Automatically follow back users who follow you",
        "type": "follow_back",
        "category": "engagement",
        "defaultSettings": {
          "followBackDelay": 300,
          "maxFollowsPerDay": 100
        },
        "features": ["auto_follow_back", "delay_control"],
        "popularity": 87
      }
    ]
  }
}
```

---

## Automation Control

### 7. Start Automation
**Endpoint:** `POST /:id/start`  
**Description:** Paused या stopped automation को start करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_START`

```bash
curl -X POST http://localhost:3000/api/automations/automation_id_here/start \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Automation started successfully",
  "data": {
    "automation": {
      "id": "automation_id",
      "status": "active",
      "startedAt": "2024-01-01T14:00:00Z",
      "nextRun": "2024-01-01T14:30:00Z"
    }
  }
}
```

### 8. Stop Automation
**Endpoint:** `POST /:id/stop`  
**Description:** Running automation को stop करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_STOP`

```bash
curl -X POST http://localhost:3000/api/automations/automation_id_here/stop \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Automation stopped successfully",
  "data": {
    "automation": {
      "id": "automation_id",
      "status": "stopped",
      "stoppedAt": "2024-01-01T14:30:00Z"
    }
  }
}
```

### 9. Pause Automation
**Endpoint:** `POST /:id/pause`  
**Description:** Running automation को temporarily pause करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_PAUSE`

```bash
curl -X POST http://localhost:3000/api/automations/automation_id_here/pause \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Automation paused successfully",
  "data": {
    "automation": {
      "id": "automation_id",
      "status": "paused",
      "pausedAt": "2024-01-01T14:45:00Z"
    }
  }
}
```

### 10. Execute Automation Manually
**Endpoint:** `POST /:id/execute`  
**Description:** Automation को manually execute करता है (schedule के बिना)।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_EXECUTE`

```bash
curl -X POST http://localhost:3000/api/automations/automation_id_here/execute \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Automation executed successfully",
  "data": {
    "execution": {
      "id": "execution_id",
      "automationId": "automation_id",
      "status": "completed",
      "startedAt": "2024-01-01T15:00:00Z",
      "completedAt": "2024-01-01T15:05:00Z",
      "actionsPerformed": 25,
      "errors": 0
    }
  }
}
```

---

## Automation Analytics

### 11. Get Automation Analytics
**Endpoint:** `GET /:id/analytics`  
**Description:** Specific automation के performance analytics return करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_ANALYTICS`

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y) - default: 30d
- `metrics` (optional): Specific metrics to include

```bash
curl -X GET "http://localhost:3000/api/automations/automation_id_here/analytics?period=30d" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "automationId": "automation_id",
      "period": "30d",
      "summary": {
        "totalRuns": 150,
        "successfulRuns": 145,
        "failedRuns": 5,
        "totalActions": 4500,
        "successRate": 96.67,
        "averageActionsPerRun": 30
      },
      "dailyStats": [
        {
          "date": "2024-01-01",
          "runs": 5,
          "actions": 150,
          "errors": 0,
          "successRate": 100
        }
      ],
      "actionBreakdown": {
        "likes": 3000,
        "comments": 800,
        "follows": 500,
        "unfollows": 200
      },
      "performance": {
        "averageRunDuration": 300,
        "peakHours": ["10:00", "14:00", "18:00"],
        "bestPerformingDays": ["monday", "wednesday", "friday"]
      }
    }
  }
}
```

### 12. Get Automation Statistics Overview
**Endpoint:** `GET /stats`  
**Description:** User के सभी automations का overall statistics overview return करता है।  
**Authentication:** Required (authMiddleware.authenticate)  
**Permission:** `AUTOMATION_ANALYTICS`

```bash
curl -X GET http://localhost:3000/api/automations/stats/overview \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAutomations": 25,
      "activeAutomations": 15,
      "pausedAutomations": 8,
      "stoppedAutomations": 2,
      "totalActionsToday": 1250,
      "totalActionsThisMonth": 45000
    },
    "performance": {
      "averageSuccessRate": 94.5,
      "totalSuccessfulActions": 42750,
      "totalFailedActions": 2250,
      "mostActiveAutomation": {
        "id": "automation_id",
        "name": "Auto Like Posts",
        "actionsToday": 150
      }
    },
    "trends": {
      "actionsGrowth": 12.5,
      "successRateChange": 2.1,
      "newAutomationsThisMonth": 3
    },
    "typeBreakdown": {
      "like_posts": 10,
      "follow_users": 8,
      "comment_posts": 4,
      "unfollow_users": 3
    }
  }
}
```

---

## Error Responses

सभी endpoints निम्नलिखित error format का उपयोग करते हैं:

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

### Common Error Codes:
- `400` - Bad Request (Invalid input data)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Automation not found)
- `409` - Conflict (Automation already running/stopped)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

### Automation-Specific Errors:
- `AUTOMATION_NOT_FOUND` - Automation doesn't exist
- `AUTOMATION_ALREADY_RUNNING` - Cannot start already running automation
- `AUTOMATION_NOT_RUNNING` - Cannot stop/pause non-running automation
- `PLATFORM_ACCOUNT_REQUIRED` - Valid Instagram account connection required
- `INVALID_AUTOMATION_TYPE` - Unsupported automation type
- `SCHEDULE_CONFLICT` - Automation schedule conflicts with existing automation

---

## Automation Types

### Available Automation Types:

1. **like_posts** - Automatically like posts based on hashtags/accounts
2. **follow_users** - Automatically follow users based on criteria
3. **unfollow_users** - Automatically unfollow users based on criteria
4. **comment_posts** - Automatically comment on posts with predefined messages
5. **story_view** - Automatically view stories from target accounts
6. **dm_users** - Send direct messages to users (premium feature)

### Settings Schema by Type:

#### Like Posts (`like_posts`):
```json
{
  "targetHashtags": ["#hashtag1", "#hashtag2"],
  "targetAccounts": ["@account1", "@account2"],
  "likesPerHour": 30,
  "maxLikesPerDay": 500,
  "minFollowers": 100,
  "maxFollowers": 10000,
  "avoidRecentlyLiked": true
}
```

#### Follow Users (`follow_users`):
```json
{
  "targetHashtags": ["#hashtag1", "#hashtag2"],
  "followsPerHour": 20,
  "maxFollowsPerDay": 200,
  "minFollowers": 50,
  "maxFollowers": 5000,
  "followBackOnly": false
}
```

#### Comment Posts (`comment_posts`):
```json
{
  "targetHashtags": ["#hashtag1", "#hashtag2"],
  "comments": ["Nice post!", "Great content!", "Amazing!"],
  "commentsPerHour": 10,
  "maxCommentsPerDay": 100,
  "randomizeComments": true
}
```

---

## Rate Limiting

निम्नलिखित endpoints पर rate limiting लागू है:

- **Create Automation:** 10 requests per hour
- **Execute Automation:** 5 requests per minute per automation
- **Analytics:** 100 requests per hour
- **General:** Standard rate limiting on all endpoints

Rate limit exceed होने पर `429` status code के साथ error response मिलता है।

---

## Security Features

1. **Role-based Access Control:** Different permissions for different operations
2. **Platform Account Validation:** Ensures valid Instagram connection
3. **Rate Limiting:** Prevents abuse and API overuse
4. **Audit Logging:** All automation actions are logged
5. **Safe Defaults:** Conservative default settings to prevent account issues
6. **Compliance Monitoring:** Ensures Instagram API compliance
