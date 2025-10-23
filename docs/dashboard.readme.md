# Dashboard API Documentation

This documentation covers all dashboard endpoints for the Instagram Automation SaaS application. These endpoints provide dashboard analytics, overview, content calendar, and insights.

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
7. [Error Responses](#error-responses)
8. [Authentication](#authentication)

---

## Dashboard Overview

### 1. Get Dashboard Overview
**Endpoint:** `GET /overview`  
**Description:** Retrieves dashboard overview with key metrics and summary data.  
**Required Permission:** `ANALYTICS_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/dashboard/overview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
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
      "engagementRate": 5.1,
      "activeAutomations": 8,
      "scheduledPosts": 12
    },
    "recentMetrics": {
      "postsThisWeek": 7,
      "followersGained": 45,
      "likesReceived": 890,
      "commentsReceived": 123,
      "engagementGrowth": 12.5
    },
    "topPerformingPosts": [
      {
        "id": "post_123",
        "caption": "Amazing sunset photography tips...",
        "likes": 245,
        "comments": 32,
        "engagement": 277,
        "engagementRate": 8.2,
        "publishedAt": "2024-01-15T10:30:00Z",
        "mediaType": "image"
      },
      {
        "id": "post_124",
        "caption": "Behind the scenes content...",
        "likes": 189,
        "comments": 28,
        "engagement": 217,
        "engagementRate": 7.1,
        "publishedAt": "2024-01-14T15:45:00Z",
        "mediaType": "carousel"
      }
    ],
    "upcomingPosts": [
      {
        "id": "scheduled_456",
        "caption": "New product launch announcement...",
        "scheduledFor": "2024-01-20T15:00:00Z",
        "status": "scheduled",
        "mediaType": "image",
        "automationId": "auto_123"
      },
      {
        "id": "scheduled_457",
        "caption": "Weekly motivation quote...",
        "scheduledFor": "2024-01-21T09:00:00Z",
        "status": "scheduled",
        "mediaType": "image",
        "automationId": "auto_124"
      }
    ],
    "quickStats": {
      "todaysPosts": 2,
      "weeklyGoal": 7,
      "weeklyProgress": 71.4,
      "averageEngagementRate": 5.8
    }
  },
  "message": "Dashboard overview retrieved successfully"
}
```

---

## Analytics

### 2. Get Detailed Analytics
**Endpoint:** `GET /analytics`  
**Description:** Retrieves comprehensive analytics data including engagement, audience, and content metrics.  
**Required Permission:** `ANALYTICS_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/dashboard/analytics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `period` (optional) - Time period (7d, 30d, 90d, 1y) - default: 30d
- `metrics` (optional) - Comma-separated list of specific metrics to include

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "engagement": {
      "totalLikes": 5420,
      "totalComments": 890,
      "totalShares": 234,
      "totalSaves": 156,
      "averageEngagementRate": 4.8,
      "engagementTrend": "increasing",
      "engagementGrowth": 15.2,
      "bestPerformingPostType": "carousel",
      "peakEngagementHours": ["18:00", "19:00", "20:00"]
    },
    "audience": {
      "totalFollowers": 2450,
      "followersGrowth": {
        "thisWeek": 45,
        "thisMonth": 180,
        "percentage": 7.9,
        "trend": "increasing"
      },
      "demographics": {
        "ageGroups": {
          "18-24": 35,
          "25-34": 40,
          "35-44": 20,
          "45+": 5
        },
        "genderDistribution": {
          "female": 58,
          "male": 40,
          "other": 2
        },
        "topLocations": [
          {"country": "India", "percentage": 65, "city": "Mumbai"},
          {"country": "USA", "percentage": 20, "city": "New York"},
          {"country": "UK", "percentage": 10, "city": "London"},
          {"country": "Canada", "percentage": 5, "city": "Toronto"}
        ]
      },
      "activityPatterns": {
        "mostActiveDays": ["Monday", "Wednesday", "Friday"],
        "mostActiveHours": ["18:00", "19:00", "20:00"],
        "timeZone": "Asia/Kolkata"
      }
    },
    "content": {
      "totalPosts": 156,
      "postsThisMonth": 24,
      "averagePostsPerWeek": 6,
      "contentTypes": {
        "image": 45,
        "carousel": 35,
        "video": 20
      },
      "topHashtags": [
        {"tag": "#photography", "usage": 45, "avgEngagement": 5.2},
        {"tag": "#nature", "usage": 38, "avgEngagement": 4.8},
        {"tag": "#sunset", "usage": 32, "avgEngagement": 6.1},
        {"tag": "#travel", "usage": 28, "avgEngagement": 5.5}
      ],
      "contentPerformance": {
        "bestPerformingTime": "19:00",
        "bestPerformingDay": "Wednesday",
        "averageLikesPerPost": 78,
        "averageCommentsPerPost": 12,
        "averageReachPerPost": 1250
      }
    },
    "reach": {
      "totalReach": 45000,
      "totalImpressions": 78000,
      "reachGrowth": 22.5,
      "impressionsGrowth": 18.7,
      "averageReachPerPost": 1250,
      "organicReach": 38000,
      "hashtagReach": 7000
    }
  },
  "message": "Analytics data retrieved successfully"
}
```

### 3. Get Analytics by Date Range
**Endpoint:** `GET /analytics/range`  
**Description:** Retrieves analytics data for a specific date range.  
**Required Permission:** `ANALYTICS_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET "http://localhost:3000/api/dashboard/analytics/range?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `startDate` (required) - Start date in YYYY-MM-DD format
- `endDate` (required) - End date in YYYY-MM-DD format
- `granularity` (optional) - Data granularity (daily, weekly, monthly) - default: daily

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "granularity": "daily"
    },
    "timeSeries": [
      {
        "date": "2024-01-01",
        "posts": 2,
        "likes": 156,
        "comments": 23,
        "followers": 2405,
        "reach": 1890,
        "impressions": 3200
      },
      {
        "date": "2024-01-02",
        "posts": 1,
        "likes": 89,
        "comments": 12,
        "followers": 2408,
        "reach": 1245,
        "impressions": 2100
      }
    ],
    "summary": {
      "totalPosts": 24,
      "totalLikes": 1890,
      "totalComments": 234,
      "followersGained": 45,
      "averageEngagementRate": 4.8,
      "bestPerformingDate": "2024-01-15"
    }
  },
  "message": "Analytics range data retrieved successfully"
}
```

---

## Content Calendar

### 4. Get Content Calendar
**Endpoint:** `GET /content-calendar`  
**Description:** Retrieves content calendar for specified month/year with scheduled and published posts.  
**Required Permission:** `CONTENT_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET "http://localhost:3000/api/dashboard/content-calendar?month=1&year=2024" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `month` (optional) - Month number (1-12, default: current month)
- `year` (optional) - Year (default: current year)
- `view` (optional) - Calendar view (month, week, day) - default: month

**Response:**
```json
{
  "success": true,
  "data": {
    "calendar": {
      "month": 1,
      "year": 2024,
      "view": "month",
      "days": [
        {
          "date": "2024-01-15",
          "dayOfWeek": "Monday",
          "posts": [
            {
              "id": "post_123",
              "type": "published",
              "mediaType": "image",
              "caption": "Morning motivation for the week ahead...",
              "scheduledTime": "09:00",
              "publishedTime": "09:00",
              "status": "published",
              "engagement": {
                "likes": 156,
                "comments": 23
              },
              "automationId": "auto_123"
            },
            {
              "id": "scheduled_456",
              "type": "scheduled",
              "mediaType": "carousel",
              "caption": "Product showcase - New collection...",
              "scheduledTime": "15:00",
              "status": "scheduled",
              "automationId": "auto_124"
            }
          ],
          "totalPosts": 2,
          "publishedPosts": 1,
          "scheduledPosts": 1
        },
        {
          "date": "2024-01-16",
          "dayOfWeek": "Tuesday",
          "posts": [
            {
              "id": "scheduled_457",
              "type": "scheduled",
              "mediaType": "video",
              "caption": "Behind the scenes content creation...",
              "scheduledTime": "18:00",
              "status": "scheduled",
              "automationId": "auto_125"
            }
          ],
          "totalPosts": 1,
          "publishedPosts": 0,
          "scheduledPosts": 1
        }
      ]
    },
    "summary": {
      "totalScheduled": 24,
      "totalPublished": 18,
      "totalDraft": 6,
      "busyDays": ["2024-01-15", "2024-01-22", "2024-01-29"],
      "averagePostsPerDay": 1.2,
      "mostActiveDay": "Monday",
      "upcomingDeadlines": [
        {
          "date": "2024-01-20",
          "postsCount": 3,
          "priority": "high"
        }
      ]
    },
    "monthlyGoals": {
      "targetPosts": 30,
      "currentPosts": 24,
      "progress": 80,
      "remainingDays": 7
    }
  },
  "message": "Content calendar retrieved successfully"
}
```

---

## Recent Activity

### 5. Get Recent Activity
**Endpoint:** `GET /recent-activity`  
**Description:** Retrieves recent activity feed including posts, automations, and engagement.  
**Required Permission:** `USER_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/dashboard/recent-activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `limit` (optional) - Number of activities to return (default: 20, max: 100)
- `type` (optional) - Filter by activity type (post, automation, engagement, follower)
- `since` (optional) - ISO date string to get activities since that date

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity_123",
        "type": "post_published",
        "title": "Post Published",
        "description": "New post published: 'Amazing sunset photography tips...'",
        "timestamp": "2024-01-15T10:30:00Z",
        "metadata": {
          "postId": "post_123",
          "mediaType": "image",
          "engagement": {
            "likes": 45,
            "comments": 8,
            "shares": 2
          },
          "automationId": "auto_123"
        },
        "priority": "normal"
      },
      {
        "id": "activity_124",
        "type": "follower_milestone",
        "title": "Follower Milestone",
        "description": "Reached 2,500 followers!",
        "timestamp": "2024-01-14T16:20:00Z",
        "metadata": {
          "milestone": 2500,
          "previousCount": 2450,
          "growthRate": 2.0
        },
        "priority": "high"
      },
      {
        "id": "activity_125",
        "type": "automation_triggered",
        "title": "Automation Executed",
        "description": "Auto-reply sent to 5 new comments",
        "timestamp": "2024-01-14T14:15:00Z",
        "metadata": {
          "automationId": "auto_123",
          "automationName": "Comment Auto-Reply",
          "repliesCount": 5,
          "triggerType": "comment_received"
        },
        "priority": "normal"
      },
      {
        "id": "activity_126",
        "type": "engagement_spike",
        "title": "High Engagement",
        "description": "Post received 200+ likes in 1 hour",
        "timestamp": "2024-01-13T19:45:00Z",
        "metadata": {
          "postId": "post_122",
          "engagementCount": 234,
          "timeframe": "1 hour",
          "engagementRate": 9.2
        },
        "priority": "high"
      },
      {
        "id": "activity_127",
        "type": "automation_paused",
        "title": "Automation Paused",
        "description": "Automation 'Daily Quotes' was paused due to rate limit",
        "timestamp": "2024-01-13T12:30:00Z",
        "metadata": {
          "automationId": "auto_125",
          "automationName": "Daily Quotes",
          "reason": "rate_limit_reached",
          "pauseDuration": "2 hours"
        },
        "priority": "medium"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "hasMore": true,
      "nextCursor": "activity_127"
    },
    "summary": {
      "totalActivities": 156,
      "todaysActivities": 8,
      "highPriorityCount": 3,
      "lastActivityTime": "2024-01-15T10:30:00Z"
    }
  },
  "message": "Recent activity retrieved successfully"
}
```

---

## Insights

### 6. Get Insights and Recommendations
**Endpoint:** `GET /insights`  
**Description:** Retrieves AI-powered insights and recommendations for content strategy.  
**Required Permission:** `ANALYTICS_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/dashboard/insights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `category` (optional) - Filter by insight category (performance, growth, content, audience)
- `priority` (optional) - Filter by priority level (high, medium, low)

**Response:**
```json
{
  "success": true,
  "data": {
    "performanceInsights": [
      {
        "id": "insight_001",
        "type": "best_posting_time",
        "category": "performance",
        "title": "Optimal Posting Time",
        "description": "Your audience is most active between 6-8 PM IST",
        "recommendation": "Schedule more posts during evening hours to maximize engagement",
        "impact": "high",
        "confidence": 92,
        "data": {
          "bestHours": ["18:00", "19:00", "20:00"],
          "engagementIncrease": "23%",
          "currentAverageEngagement": 4.8,
          "projectedEngagement": 5.9
        },
        "actionItems": [
          "Reschedule existing automations to peak hours",
          "Create content specifically for evening audience",
          "Monitor engagement during recommended times"
        ]
      },
      {
        "id": "insight_002",
        "type": "content_performance",
        "category": "content",
        "title": "Top Performing Content Type",
        "description": "Carousel posts get 40% more engagement than single images",
        "recommendation": "Increase carousel content ratio to 50% of total posts",
        "impact": "medium",
        "confidence": 87,
        "data": {
          "carouselEngagement": 6.2,
          "imageEngagement": 4.4,
          "videoEngagement": 3.8,
          "currentCarouselRatio": 35,
          "recommendedRatio": 50
        },
        "actionItems": [
          "Create more multi-slide content",
          "Repurpose single images into carousels",
          "Plan carousel-specific content themes"
        ]
      }
    ],
    "growthOpportunities": [
      {
        "id": "opportunity_001",
        "type": "hashtag_optimization",
        "category": "growth",
        "title": "Hashtag Strategy Enhancement",
        "description": "Using trending hashtags can increase reach by 35%",
        "potentialImpact": "high",
        "effort": "low",
        "timeframe": "1-2 weeks",
        "actionItems": [
          "Research trending hashtags in photography niche",
          "Use 8-12 hashtags per post (currently using 5-7)",
          "Mix popular and niche-specific tags",
          "Create branded hashtag for community building"
        ],
        "expectedResults": {
          "reachIncrease": "35%",
          "engagementIncrease": "20%",
          "followerGrowth": "15%"
        }
      },
      {
        "id": "opportunity_002",
        "type": "audience_expansion",
        "category": "growth",
        "title": "Geographic Expansion",
        "description": "Opportunity to grow audience in US and UK markets",
        "potentialImpact": "medium",
        "effort": "medium",
        "timeframe": "4-6 weeks",
        "actionItems": [
          "Create content relevant to US/UK time zones",
          "Use location-specific hashtags",
          "Engage with accounts in target regions",
          "Consider English captions for broader appeal"
        ],
        "expectedResults": {
          "internationalFollowers": "+25%",
          "globalReach": "+40%",
          "diversifiedAudience": "improved"
        }
      }
    ],
    "alerts": [
      {
        "id": "alert_001",
        "type": "engagement_drop",
        "severity": "medium",
        "title": "Engagement Rate Decline",
        "message": "Engagement rate decreased by 15% this week compared to last week",
        "suggestion": "Review recent content strategy and posting times",
        "urgency": "moderate",
        "detectedAt": "2024-01-15T08:00:00Z",
        "data": {
          "currentRate": 4.2,
          "previousRate": 4.9,
          "decline": 15,
          "affectedPosts": 7
        },
        "recommendedActions": [
          "Analyze underperforming posts",
          "Return to previously successful content themes",
          "Increase audience interaction through stories"
        ]
      },
      {
        "id": "alert_002",
        "type": "automation_issue",
        "severity": "high",
        "title": "Automation Rate Limit",
        "message": "3 automations paused due to Instagram rate limits",
        "suggestion": "Reduce automation frequency or spread actions across longer time periods",
        "urgency": "high",
        "detectedAt": "2024-01-14T22:30:00Z",
        "data": {
          "pausedAutomations": 3,
          "affectedActions": ["auto_like", "auto_comment", "auto_follow"],
          "estimatedResumeTime": "2024-01-15T06:00:00Z"
        },
        "recommendedActions": [
          "Adjust automation timing intervals",
          "Review Instagram API usage limits",
          "Consider premium automation features"
        ]
      }
    ],
    "summary": {
      "totalInsights": 8,
      "highImpactInsights": 3,
      "activeAlerts": 2,
      "implementedRecommendations": 5,
      "lastUpdated": "2024-01-15T12:00:00Z"
    }
  },
  "message": "Insights and recommendations retrieved successfully"
}
```

---

## Comprehensive Statistics

### 7. Get Comprehensive Statistics
**Endpoint:** `GET /stats`  
**Description:** Retrieves comprehensive dashboard statistics and KPIs.  
**Required Permission:** `ANALYTICS_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `period` (optional) - Time period for statistics (7d, 30d, 90d, 1y) - default: 30d
- `compare` (optional) - Compare with previous period (true/false) - default: false

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "overview": {
      "totalPosts": 156,
      "totalFollowers": 2450,
      "totalEngagement": 12500,
      "averageEngagementRate": 5.1,
      "totalReach": 45000,
      "totalImpressions": 78000,
      "profileViews": 3200,
      "websiteClicks": 156
    },
    "growth": {
      "followersGrowth": {
        "daily": 1.2,
        "weekly": 8.5,
        "monthly": 35.2,
        "trend": "increasing"
      },
      "engagementGrowth": {
        "daily": 2.1,
        "weekly": 12.3,
        "monthly": 28.7,
        "trend": "increasing"
      },
      "reachGrowth": {
        "daily": 3.5,
        "weekly": 15.2,
        "monthly": 42.8,
        "trend": "increasing"
      }
    },
    "contentStats": {
      "postsPerWeek": 6,
      "averageLikesPerPost": 78,
      "averageCommentsPerPost": 12,
      "averageSharesPerPost": 3,
      "averageSavesPerPost": 8,
      "topPerformingPostType": "carousel",
      "contentTypeDistribution": {
        "image": 45,
        "carousel": 35,
        "video": 20
      },
      "hashtagPerformance": {
        "averageHashtagsPerPost": 8,
        "topPerformingHashtag": "#photography",
        "hashtagReach": 15000
      }
    },
    "audienceInsights": {
      "mostActiveHours": ["18:00", "19:00", "20:00"],
      "mostActiveDays": ["Monday", "Wednesday", "Friday"],
      "topAgeGroup": "25-34",
      "topLocation": "Mumbai, India",
      "genderDistribution": {
        "female": 58,
        "male": 40,
        "other": 2
      },
      "audienceGrowthRate": 7.9,
      "audienceRetentionRate": 92.3
    },
    "automationStats": {
      "totalAutomations": 8,
      "activeAutomations": 6,
      "pausedAutomations": 2,
      "automationSuccessRate": 94.5,
      "totalAutomatedActions": 1250,
      "automationEngagementBoost": 23.5
    },
    "comparison": {
      "previousPeriod": "2023-12-01 to 2023-12-31",
      "changes": {
        "followers": "+15.2%",
        "engagement": "+28.7%",
        "reach": "+42.8%",
        "posts": "+12.5%"
      }
    },
    "goals": {
      "monthlyFollowerTarget": 2500,
      "currentProgress": 98.0,
      "monthlyPostTarget": 30,
      "postsProgress": 80.0,
      "engagementRateTarget": 5.5,
      "engagementProgress": 92.7
    }
  },
  "message": "Comprehensive statistics retrieved successfully"
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
        "field": "period",
        "message": "Period must be one of: 7d, 30d, 90d, 1y"
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
    "requiredPermission": "ANALYTICS_READ"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Requested resource not found"
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

### Dashboard-Specific Error Codes

**DATA_NOT_AVAILABLE**
```json
{
  "success": false,
  "error": {
    "code": "DATA_NOT_AVAILABLE",
    "message": "Analytics data not available for the requested period",
    "details": {
      "reason": "insufficient_data",
      "minimumPeriod": "7d"
    }
  }
}
```

**ANALYTICS_SERVICE_ERROR**
```json
{
  "success": false,
  "error": {
    "code": "ANALYTICS_SERVICE_ERROR",
    "message": "Analytics service temporarily unavailable",
    "details": {
      "service": "instagram_insights",
      "retryAfter": 300
    }
  }
}
```

---

## Authentication

All dashboard API endpoints require:

1. **User Authentication**: Valid JWT token in Authorization header
2. **Permissions**: Specific permissions based on endpoint requirements

### Required Permissions

- `ANALYTICS_READ` - For accessing analytics, insights, and statistics
- `CONTENT_READ` - For accessing content calendar and post data
- `USER_READ` - For accessing basic dashboard overview and activity

### Rate Limiting

- **General endpoints**: 1000 requests per hour per user
- **Analytics endpoints**: 500 requests per hour per user (due to computational overhead)

Rate limits are enforced per user and reset every hour. When rate limit is exceeded, the API returns a 429 status code with retry information.

### Security Features

- All requests must be made over HTTPS in production
- JWT tokens expire after 24 hours
- Dashboard data is user-specific and isolated
- Request validation and sanitization applied to all inputs
- Analytics data is cached for performance optimization
- Sensitive metrics are only available to account owners

### Data Freshness

- **Real-time data**: Recent activity, current follower count
- **Near real-time** (5-15 minutes): Engagement metrics, post performance
- **Hourly updates**: Detailed analytics, audience insights
- **Daily updates**: Growth trends, comprehensive statistics

### Performance Considerations

- Large date ranges may take longer to process
- Analytics data is cached for 15 minutes to improve performance
- Use pagination for large datasets (recent activity, content calendar)
- Consider using specific metric filters to reduce response size