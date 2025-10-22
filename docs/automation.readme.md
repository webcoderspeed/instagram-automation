# Automation API Documentation

यह documentation Instagram Automation SaaS application के सभी automation endpoints के लिए है। सभी endpoints authentication की आवश्यकता होती है।

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
**Description:** User के सभी automations की list return करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X GET http://localhost:3000/api/automation \
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
        "type": "like_posts",
        "status": "active",
        "createdAt": "2024-01-01T10:00:00Z",
        "lastRun": "2024-01-01T11:00:00Z",
        "settings": {
          "targetHashtags": ["#photography", "#nature"],
          "likesPerHour": 30
        }
      }
    ],
    "total": 5,
    "active": 3,
    "paused": 2
  }
}
```

### 2. Get Automation by ID
**Endpoint:** `GET /:id`  
**Description:** Specific automation की details return करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X GET http://localhost:3000/api/automation/automation_id_here \
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
      "settings": {
        "targetHashtags": ["#photography", "#nature"],
        "likesPerHour": 30,
        "maxLikesPerDay": 500
      },
      "schedule": {
        "enabled": true,
        "startTime": "09:00",
        "endTime": "18:00",
        "timezone": "Asia/Kolkata"
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T11:00:00Z"
    }
  }
}
```

### 3. Create New Automation
**Endpoint:** `POST /`  
**Description:** नया automation create करता है।  
**Required Role:** `CREATE_AUTOMATION`

```bash
curl -X POST http://localhost:3000/api/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Auto Follow Users",
    "description": "Automatically follows users based on hashtags",
    "type": "follow_users",
    "settings": {
      "targetHashtags": ["#fitness", "#health"],
      "followsPerHour": 20,
      "maxFollowsPerDay": 200
    },
    "schedule": {
      "enabled": true,
      "startTime": "10:00",
      "endTime": "17:00",
      "timezone": "Asia/Kolkata"
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
      "type": "follow_users",
      "status": "inactive",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 4. Update Automation
**Endpoint:** `PUT /:id`  
**Description:** Existing automation को update करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X PUT http://localhost:3000/api/automation/automation_id_here \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated Auto Follow",
    "settings": {
      "targetHashtags": ["#fitness", "#health", "#wellness"],
      "followsPerHour": 25,
      "maxFollowsPerDay": 250
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
      "name": "Updated Auto Follow",
      "updatedAt": "2024-01-01T13:00:00Z"
    }
  }
}
```

### 5. Delete Automation
**Endpoint:** `DELETE /:id`  
**Description:** Automation को delete करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X DELETE http://localhost:3000/api/automation/automation_id_here \
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

### 6. Get Automation Templates
**Endpoint:** `GET /templates`  
**Description:** Available automation templates की list return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/automation/templates \
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
        "description": "Automatically engage with posts using specific hashtags",
        "type": "hashtag_engagement",
        "category": "engagement",
        "defaultSettings": {
          "likesPerHour": 30,
          "commentsPerHour": 5,
          "followsPerHour": 10
        }
      },
      {
        "id": "template_2",
        "name": "Story Viewer",
        "description": "Automatically view stories from followed accounts",
        "type": "story_viewer",
        "category": "engagement",
        "defaultSettings": {
          "storiesPerHour": 50,
          "viewDuration": 3
        }
      }
    ]
  }
}
```

---

## Automation Control

### 7. Start Automation
**Endpoint:** `POST /:id/start`  
**Description:** Automation को start करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X POST http://localhost:3000/api/automation/automation_id_here/start \
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
      "startedAt": "2024-01-01T14:00:00Z"
    }
  }
}
```

### 8. Pause Automation
**Endpoint:** `POST /:id/pause`  
**Description:** Running automation को pause करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X POST http://localhost:3000/api/automation/automation_id_here/pause \
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
      "pausedAt": "2024-01-01T15:00:00Z"
    }
  }
}
```

### 9. Stop Automation
**Endpoint:** `POST /:id/stop`  
**Description:** Automation को completely stop करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X POST http://localhost:3000/api/automation/automation_id_here/stop \
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
      "stoppedAt": "2024-01-01T16:00:00Z"
    }
  }
}
```

### 10. Execute Automation (Manual)
**Endpoint:** `POST /:id/execute`  
**Description:** Automation को manually execute करता है।  
**Required Role:** `AUTOMATION_MANAGER`

```bash
curl -X POST http://localhost:3000/api/automation/automation_id_here/execute \
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
      "executedAt": "2024-01-01T17:00:00Z",
      "results": {
        "actionsPerformed": 25,
        "successRate": 96
      }
    }
  }
}
```

---

## Automation Analytics

### 11. Get Automation Analytics
**Endpoint:** `GET /:id/analytics`  
**Description:** Specific automation के analytics return करता है।  
**Required Role:** `ANALYTICS_ACCESS`

```bash
curl -X GET http://localhost:3000/api/automation/automation_id_here/analytics \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Query Parameters:**
- `period` - Time period (7d, 30d, 90d) - Default: 7d
- `timezone` - Timezone for data - Default: UTC

```bash
curl -X GET "http://localhost:3000/api/automation/automation_id_here/analytics?period=30d&timezone=Asia/Kolkata" \
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
      "totalExecutions": 150,
      "successfulExecutions": 144,
      "failedExecutions": 6,
      "successRate": 96,
      "totalActions": 3600,
      "averageActionsPerExecution": 24,
      "performance": {
        "likes": 2400,
        "follows": 800,
        "comments": 400,
        "unfollows": 200
      },
      "dailyStats": [
        {
          "date": "2024-01-01",
          "executions": 5,
          "actions": 120,
          "successRate": 100
        }
      ]
    }
  }
}
```

### 12. Get Automation Stats Overview
**Endpoint:** `GET /stats/overview`  
**Description:** सभी automations का overview stats return करता है।  
**Required Role:** `ANALYTICS_ACCESS`

```bash
curl -X GET http://localhost:3000/api/automation/stats/overview \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAutomations": 8,
      "activeAutomations": 5,
      "pausedAutomations": 2,
      "stoppedAutomations": 1,
      "totalExecutionsToday": 45,
      "totalActionsToday": 1080,
      "averageSuccessRate": 94.5,
      "topPerformingAutomation": {
        "id": "automation_id",
        "name": "Auto Like Posts",
        "successRate": 98.2
      },
      "recentActivity": [
        {
          "automationId": "automation_id",
          "automationName": "Auto Follow Users",
          "action": "started",
          "timestamp": "2024-01-01T18:00:00Z"
        }
      ]
    }
  }
}
```

---

## Important Notes

### Authentication Requirements
- सभी endpoints authenticated user की आवश्यकता होती है
- Different endpoints के लिए different roles required हैं
- Session cookies का उपयोग करें (`-b cookies.txt`)

### Rate Limiting
- Automation Creation: 10 requests per hour
- Automation Control: 60 requests per hour
- Analytics: 100 requests per hour

### Automation Types
Available automation types:
- `like_posts` - Auto like posts with hashtags
- `follow_users` - Auto follow users
- `unfollow_users` - Auto unfollow users
- `comment_posts` - Auto comment on posts
- `story_viewer` - Auto view stories
- `hashtag_engagement` - Complete hashtag engagement

### Automation Status
- `inactive` - Created but not started
- `active` - Currently running
- `paused` - Temporarily stopped
- `stopped` - Completely stopped
- `error` - Error occurred

### Error Responses
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

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Automation Flow Test:
```bash
# 1. Login first (required for all automation endpoints)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Get automation templates
curl -X GET http://localhost:3000/api/automation/templates \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 3. Create new automation
curl -X POST http://localhost:3000/api/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Automation","type":"like_posts","settings":{"targetHashtags":["#test"],"likesPerHour":10}}'

# 4. Get all automations
curl -X GET http://localhost:3000/api/automation \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 5. Start automation
curl -X POST http://localhost:3000/api/automation/AUTOMATION_ID/start \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 6. Get automation analytics
curl -X GET http://localhost:3000/api/automation/AUTOMATION_ID/analytics \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 7. Pause automation
curl -X POST http://localhost:3000/api/automation/AUTOMATION_ID/pause \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 8. Get stats overview
curl -X GET http://localhost:3000/api/automation/stats/overview \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

यह documentation आपको सभी automation endpoints को test करने में मदद करेगी।