# Dashboard API Documentation

यह documentation Instagram Automation SaaS application के सभी dashboard endpoints के लिए है। ये endpoints dashboard analytics, overview, content calendar, और insights प्रदान करते हैं।

## Base URL
```
http://localhost:3000/api/dashboard
```

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Analytics](#analytics)
3. [Content Calendar](#content-calendar)
4. [Recent Activity](#recent-activity)
5. [Insights](#insights)
6. [Comprehensive Statistics](#comprehensive-statistics)

---

## Authentication Required
सभी dashboard endpoints के लिए authentication और proper permissions की आवश्यकता होती है।

```bash
# सभी requests में cookies include करें
-b cookies.txt
```

---

## Dashboard Overview

### 1. Get Dashboard Overview
**Endpoint:** `GET /overview`  
**Description:** Dashboard overview with key metrics प्राप्त करता है।  
**Access:** Private - Analytics access required

```bash
curl -X GET http://localhost:3000/api/dashboard/overview \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPosts": 156,
      "totalFollowers": 2450,
      "totalEngagement": 12500,
      "engagementRate": 5.1
    },
    "recentMetrics": {
      "postsThisWeek": 7,
      "followersGained": 45,
      "likesReceived": 890,
      "commentsReceived": 123
    },
    "topPerformingPosts": [
      {
        "id": "post_123",
        "caption": "Amazing sunset...",
        "likes": 245,
        "comments": 32,
        "engagement": 277,
        "publishedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "upcomingPosts": [
      {
        "id": "scheduled_456",
        "caption": "New product launch...",
        "scheduledFor": "2024-01-20T15:00:00Z",
        "status": "scheduled"
      }
    ]
  }
}
```

---

## Analytics

### 2. Get Detailed Analytics
**Endpoint:** `GET /analytics`  
**Description:** Detailed analytics data प्राप्त करता है।  
**Access:** Private - Analytics access required

```bash
curl -X GET http://localhost:3000/api/dashboard/analytics \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "engagement": {
      "totalLikes": 5420,
      "totalComments": 890,
      "totalShares": 234,
      "averageEngagementRate": 4.8,
      "engagementTrend": "increasing"
    },
    "audience": {
      "totalFollowers": 2450,
      "followersGrowth": {
        "thisWeek": 45,
        "thisMonth": 180,
        "percentage": 7.9
      },
      "demographics": {
        "ageGroups": {
          "18-24": 35,
          "25-34": 40,
          "35-44": 20,
          "45+": 5
        },
        "topLocations": [
          {"country": "India", "percentage": 65},
          {"country": "USA", "percentage": 20},
          {"country": "UK", "percentage": 10}
        ]
      }
    },
    "content": {
      "totalPosts": 156,
      "postsThisMonth": 24,
      "averagePostsPerWeek": 6,
      "topHashtags": [
        {"tag": "#photography", "usage": 45},
        {"tag": "#nature", "usage": 38},
        {"tag": "#sunset", "usage": 32}
      ]
    }
  }
}
```

### 3. Get Detailed Analytics (Service-based)
**Endpoint:** `GET /analytics/detailed`  
**Description:** Dashboard service का उपयोग करके detailed analytics प्राप्त करता है।  
**Access:** Private - Analytics access required

```bash
curl -X GET http://localhost:3000/api/dashboard/analytics/detailed \
  -b cookies.txt
```

---

## Content Calendar

### 4. Get Content Calendar
**Endpoint:** `GET /content-calendar`  
**Description:** Specified month/year के लिए content calendar प्राप्त करता है।  
**Access:** Private - Content manager access required

```bash
curl -X GET "http://localhost:3000/api/dashboard/content-calendar?month=1&year=2024" \
  -b cookies.txt
```

**Query Parameters:**
- `month` (optional): Month number (1-12, default: current month)
- `year` (optional): Year (default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "calendar": {
      "month": 1,
      "year": 2024,
      "days": [
        {
          "date": "2024-01-15",
          "posts": [
            {
              "id": "post_123",
              "type": "image",
              "caption": "Morning motivation...",
              "scheduledTime": "09:00",
              "status": "published"
            },
            {
              "id": "scheduled_456",
              "type": "carousel",
              "caption": "Product showcase...",
              "scheduledTime": "15:00",
              "status": "scheduled"
            }
          ]
        }
      ]
    },
    "summary": {
      "totalScheduled": 24,
      "totalPublished": 18,
      "totalDraft": 6,
      "busyDays": ["2024-01-15", "2024-01-22", "2024-01-29"]
    }
  }
}
```

### 5. Get Content Calendar (Service-based)
**Endpoint:** `GET /calendar/service`  
**Description:** Dashboard service का उपयोग करके content calendar प्राप्त करता है।  
**Access:** Private - Content manager access required

```bash
curl -X GET http://localhost:3000/api/dashboard/calendar/service \
  -b cookies.txt
```

---

## Recent Activity

### 6. Get Recent Activity
**Endpoint:** `GET /recent-activity`  
**Description:** Recent activity feed प्राप्त करता है।  
**Access:** Private - Verified user access required

```bash
curl -X GET http://localhost:3000/api/dashboard/recent-activity \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "type": "post_published",
        "description": "New post published: 'Amazing sunset...'",
        "timestamp": "2024-01-15T10:30:00Z",
        "metadata": {
          "postId": "post_123",
          "engagement": {
            "likes": 45,
            "comments": 8
          }
        }
      },
      {
        "id": "activity_124",
        "type": "follower_milestone",
        "description": "Reached 2,500 followers!",
        "timestamp": "2024-01-14T16:20:00Z",
        "metadata": {
          "milestone": 2500,
          "previousCount": 2450
        }
      },
      {
        "id": "activity_125",
        "type": "automation_triggered",
        "description": "Auto-reply sent to 5 new comments",
        "timestamp": "2024-01-14T14:15:00Z",
        "metadata": {
          "automationId": "auto_123",
          "repliesCount": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "hasMore": true
    }
  }
}
```

---

## Insights

### 7. Get Insights and Recommendations
**Endpoint:** `GET /insights`  
**Description:** Insights और recommendations प्राप्त करता है।  
**Access:** Private - Analytics access required

```bash
curl -X GET http://localhost:3000/api/dashboard/insights \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "performanceInsights": [
      {
        "type": "best_posting_time",
        "title": "Optimal Posting Time",
        "description": "Your audience is most active between 6-8 PM",
        "recommendation": "Schedule more posts during evening hours",
        "impact": "high",
        "data": {
          "bestHours": ["18:00", "19:00", "20:00"],
          "engagementIncrease": "23%"
        }
      },
      {
        "type": "content_performance",
        "title": "Top Performing Content",
        "description": "Photo posts get 40% more engagement than videos",
        "recommendation": "Increase photo content ratio",
        "impact": "medium",
        "data": {
          "photoEngagement": 4.8,
          "videoEngagement": 3.4
        }
      }
    ],
    "growthOpportunities": [
      {
        "type": "hashtag_optimization",
        "title": "Hashtag Strategy",
        "description": "Using trending hashtags can increase reach by 35%",
        "actionItems": [
          "Research trending hashtags in your niche",
          "Use 8-12 hashtags per post",
          "Mix popular and niche-specific tags"
        ]
      }
    ],
    "alerts": [
      {
        "type": "engagement_drop",
        "severity": "medium",
        "message": "Engagement rate decreased by 15% this week",
        "suggestion": "Review recent content strategy"
      }
    ]
  }
}
```

---

## Comprehensive Statistics

### 8. Get Comprehensive Statistics
**Endpoint:** `GET /stats`  
**Description:** Dashboard service का उपयोग करके comprehensive statistics प्राप्त करता है।  
**Access:** Private - Analytics access required

```bash
curl -X GET http://localhost:3000/api/dashboard/stats \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPosts": 156,
      "totalFollowers": 2450,
      "totalEngagement": 12500,
      "averageEngagementRate": 5.1
    },
    "growth": {
      "followersGrowth": {
        "daily": 1.2,
        "weekly": 8.5,
        "monthly": 35.2
      },
      "engagementGrowth": {
        "daily": 2.1,
        "weekly": 12.3,
        "monthly": 28.7
      }
    },
    "contentStats": {
      "postsPerWeek": 6,
      "averageLikesPerPost": 78,
      "averageCommentsPerPost": 12,
      "topPerformingPostType": "photo"
    },
    "audienceInsights": {
      "mostActiveHours": ["18:00", "19:00", "20:00"],
      "mostActiveDays": ["Monday", "Wednesday", "Friday"],
      "topAgeGroup": "25-34",
      "topLocation": "Mumbai, India"
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
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Dashboard Testing:
```bash
# 1. Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Get dashboard overview
curl -X GET http://localhost:3000/api/dashboard/overview \
  -b cookies.txt

# 3. Get detailed analytics
curl -X GET http://localhost:3000/api/dashboard/analytics \
  -b cookies.txt

# 4. Get content calendar for current month
curl -X GET http://localhost:3000/api/dashboard/content-calendar \
  -b cookies.txt

# 5. Get recent activity
curl -X GET http://localhost:3000/api/dashboard/recent-activity \
  -b cookies.txt

# 6. Get insights and recommendations
curl -X GET http://localhost:3000/api/dashboard/insights \
  -b cookies.txt

# 7. Get comprehensive statistics
curl -X GET http://localhost:3000/api/dashboard/stats \
  -b cookies.txt
```

---

## Notes
- सभी dashboard data user-specific है
- Content calendar month/year parameters optional हैं
- Analytics data real-time update होता है
- Insights AI-powered recommendations हैं
- Permissions के अनुसार data access control होता है