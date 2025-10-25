# Dashboard API Documentation

## Base URL
```
https://api.yourapp.com/api/dashboard
```

## Table of Contents
- [Overview](#overview)
- [Dashboard Endpoints](#dashboard-endpoints)
  - [Get Dashboard Overview](#get-dashboard-overview)
  - [Get Analytics](#get-analytics)
  - [Get Content Calendar](#get-content-calendar)
  - [Get Recent Activity](#get-recent-activity)
  - [Get Insights](#get-insights)
  - [Get Comprehensive Stats](#get-comprehensive-stats)
  - [Get Detailed Analytics](#get-detailed-analytics)
  - [Get Calendar Service](#get-calendar-service)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)

---

## Overview

The Dashboard API provides comprehensive analytics, insights, and overview data for your social media automation platform. It aggregates data from posts, campaigns, automations, and platform accounts to give you a complete picture of your social media performance.

### Key Features
- Real-time dashboard overview with key metrics
- Detailed analytics with time-based filtering
- Content calendar for scheduling visualization
- Recent activity tracking
- AI-powered insights and recommendations
- Comprehensive statistics across all platforms

---

## Dashboard Endpoints

### Get Dashboard Overview
Retrieve a comprehensive overview of your dashboard with key metrics and summary data.

**Endpoint:** `GET /api/dashboard/overview`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (optional): Time period (7d, 30d, 90d, 1y) - default: 30d

**Example Request:**
```bash
curl -X GET "https://api.yourapp.com/api/dashboard/overview?timeRange=30d" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "connectedAccounts": 3,
    "totalPosts": 156,
    "activeAutomations": 8,
    "totalCampaigns": 12,
    "engagementMetrics": {
      "totalLikes": 5420,
      "totalComments": 890,
      "totalShares": 234,
      "totalViews": 45600,
      "engagementRate": 4.8
    },
    "recentActivity": {
      "postsThisWeek": 7,
      "followersGained": 45,
      "automationsExecuted": 24,
      "campaignsCompleted": 2
    },
    "topPerformingPosts": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "content": "Amazing sunset photography tips...",
        "platform": "instagram",
        "likes": 245,
        "comments": 32,
        "shares": 12,
        "engagementRate": 8.2,
        "publishedAt": "2023-07-30T18:00:00.000Z"
      }
    ],
    "upcomingPosts": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "content": "New product launch announcement...",
        "platform": "instagram",
        "scheduledAt": "2023-08-01T15:00:00.000Z",
        "status": "scheduled"
      }
    ]
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Get Analytics
Retrieve detailed analytics data with filtering and time-based analysis.

**Endpoint:** `GET /api/dashboard/analytics`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (optional): Time period (7d, 30d, 90d, 1y) - default: 30d
- `platform` (optional): Filter by platform (instagram, facebook, twitter, etc.)
- `metric` (optional): Specific metric type (likes, comments, shares, views, etc.)

**Example Request:**
```bash
curl -X GET "https://api.yourapp.com/api/dashboard/analytics?timeRange=30d&platform=instagram&metric=engagement" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "analytics": [
      {
        "date": "2023-07-01T00:00:00.000Z",
        "value": 125,
        "metricType": "engagement",
        "platform": "instagram",
        "changePercent": 5.2
      },
      {
        "date": "2023-07-02T00:00:00.000Z",
        "value": 142,
        "metricType": "engagement",
        "platform": "instagram",
        "changePercent": 13.6
      }
    ],
    "summary": {
      "total": 4250,
      "average": 141.7,
      "max": 245,
      "min": 89,
      "growthRate": 15.3
    },
    "timeRange": "30d",
    "metric": "engagement",
    "platform": "instagram"
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Get Content Calendar
Retrieve content calendar data for a specific month and year.

**Endpoint:** `GET /api/dashboard/content-calendar`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `month` (optional): Month (1-12) - default: current month
- `year` (optional): Year - default: current year
- `platform` (optional): Filter by platform

**Example Request:**
```bash
curl -X GET "https://api.yourapp.com/api/dashboard/content-calendar?month=8&year=2023&platform=instagram" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "calendar": {
      "2023-08-01": [
        {
          "id": "64a1b2c3d4e5f6789012345",
          "content": "Good morning! Hope you have a great day!",
          "platform": "instagram",
          "status": "published",
          "publishedAt": "2023-08-01T09:00:00.000Z",
          "mediaCount": 1
        }
      ],
      "2023-08-02": [
        {
          "id": "64a1b2c3d4e5f6789012346",
          "content": "New product announcement coming soon...",
          "platform": "instagram",
          "status": "scheduled",
          "scheduledAt": "2023-08-02T15:00:00.000Z",
          "mediaCount": 2
        },
        {
          "id": "64a1b2c3d4e5f6789012347",
          "type": "campaign",
          "name": "Summer Sale Campaign",
          "status": "active",
          "startDate": "2023-08-02T00:00:00.000Z",
          "endDate": "2023-08-15T23:59:59.999Z"
        }
      ]
    },
    "month": 8,
    "year": 2023,
    "platform": "instagram"
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Get Recent Activity
Retrieve recent activity and events from your social media accounts including posts, automations, and engagement metrics.

**Endpoint:** `GET /api/dashboard/recent-activity`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `platform` (optional): Filter by platform
- `type` (optional): Filter by activity type (post, automation, comment, like, follow, etc.)

**Activity Types:**
- `post`: Social media posts and content
- `automation`: Automation executions and updates
- `comment`: Comments received or made
- `like`: Likes received or given
- `follow`: New followers or following actions
- `engagement`: General engagement activities

**Example Request:**
```bash
curl -X GET "https://api.yourapp.com/api/dashboard/recent-activity?limit=10&offset=0" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "type": "post",
        "action": "published",
        "title": "New post published",
        "description": "Amazing sunset photography tips...",
        "platform": "instagram",
        "timestamp": "2023-07-31T18:00:00.000Z",
        "metadata": {
          "likes": 45,
          "comments": 8,
          "mediaType": "image"
        }
      },
      {
        "id": "64a1b2c3d4e5f6789012346",
        "type": "automation",
        "action": "executed",
        "title": "Daily Post Scheduler executed",
        "description": "Automation completed successfully",
        "timestamp": "2023-07-31T09:00:00.000Z",
        "metadata": {
          "executionTime": 1250,
          "status": "success"
        }
      },
      {
        "id": "64a1b2c3d4e5f6789012347",
        "type": "campaign",
        "action": "started",
        "title": "Summer Sale Campaign started",
        "description": "Campaign is now active",
        "timestamp": "2023-07-31T00:00:00.000Z",
        "metadata": {
          "duration": "14 days",
          "targetPosts": 20
        }
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 156,
      "hasMore": true
    }
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Get Insights
Retrieve AI-powered insights and recommendations based on your data.

**Endpoint:** `GET /api/dashboard/insights`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (optional): Time period for analysis (7d, 30d, 90d, 1y) - default: 30d
- `platform` (optional): Filter by platform

**Example Request:**
```bash
curl -X GET "https://api.yourapp.com/api/dashboard/insights?timeRange=30d" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "performance",
        "title": "Peak Engagement Time",
        "description": "Your posts perform best between 6-8 PM",
        "recommendation": "Schedule more posts during this time window",
        "impact": "high",
        "data": {
          "peakHours": ["18:00", "19:00", "20:00"],
          "averageEngagement": 8.2,
          "improvementPotential": "25%"
        }
      },
      {
        "type": "content",
        "title": "Top Performing Content Type",
        "description": "Carousel posts generate 40% more engagement",
        "recommendation": "Create more carousel content",
        "impact": "medium",
        "data": {
          "contentTypes": {
            "carousel": 8.5,
            "image": 6.1,
            "video": 7.2
          }
        }
      },
      {
        "type": "hashtags",
        "title": "Hashtag Optimization",
        "description": "Using 8-12 hashtags yields best results",
        "recommendation": "Optimize hashtag count in your posts",
        "impact": "medium",
        "data": {
          "optimalRange": "8-12",
          "currentAverage": 6,
          "potentialIncrease": "15%"
        }
      }
    ],
    "summary": {
      "totalInsights": 3,
      "highImpact": 1,
      "mediumImpact": 2,
      "lowImpact": 0
    }
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Get Comprehensive Stats
Retrieve comprehensive dashboard statistics using the dashboard service.

**Endpoint:** `GET /api/dashboard/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (optional): Time period (7d, 30d, 90d, 1y) - default: 30d

**Example Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPosts": 156,
      "totalFollowers": 2450,
      "totalEngagement": 12500,
      "activeAutomations": 8,
      "connectedAccounts": 3
    },
    "growth": {
      "followersGrowth": 15.2,
      "engagementGrowth": 12.8,
      "postsGrowth": 8.5
    },
    "performance": {
      "averageEngagementRate": 4.8,
      "topPerformingPlatform": "instagram",
      "bestPostingTime": "19:00"
    },
    "predictions": {
      "nextMonthFollowers": 2820,
      "nextMonthEngagement": 14100,
      "growthTrend": "positive"
    }
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Get Detailed Analytics
Retrieve detailed analytics using the dashboard service with advanced filtering.

**Endpoint:** `GET /api/dashboard/analytics/detailed`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (optional): Time period (7d, 30d, 90d, 1y) - default: 30d
- `metrics` (optional): Comma-separated list of metrics
- `groupBy` (optional): Group data by (day, week, month)
- `platform` (optional): Filter by platform

### Get Calendar Service
Retrieve content calendar using the dashboard service with enhanced features.

**Endpoint:** `GET /api/dashboard/calendar/service`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `month` (optional): Month (1-12) - default: current month
- `year` (optional): Year - default: current year
- `view` (optional): Calendar view (month, week, day) - default: month
- `includeAnalytics` (optional): Include performance analytics (true/false) - default: false

---

## Data Models

### Dashboard Overview Model
```typescript
interface DashboardOverview {
  connectedAccounts: number;
  totalPosts: number;
  activeAutomations: number;
  totalCampaigns: number;
  engagementMetrics: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    engagementRate: number;
  };
  recentActivity: {
    postsThisWeek: number;
    followersGained: number;
    automationsExecuted: number;
    campaignsCompleted: number;
  };
  topPerformingPosts: Post[];
  upcomingPosts: ScheduledPost[];
}
```

### Analytics Data Model
```typescript
interface AnalyticsData {
  date: Date;
  value: number;
  metricType: string;
  platform: string;
  changePercent: number;
}

interface AnalyticsSummary {
  total: number;
  average: number;
  max: number;
  min: number;
  growthRate: number;
}
```

### Activity Model
```typescript
interface Activity {
  id: string;
  type: 'post' | 'automation' | 'campaign' | 'account';
  action: string;
  title: string;
  description: string;
  platform?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

### Insight Model
```typescript
interface Insight {
  type: 'performance' | 'content' | 'hashtags' | 'timing' | 'audience';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  data: Record<string, any>;
}
```

---

## Error Handling

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Invalid or missing authentication token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation errors
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TIME_RANGE",
    "message": "Invalid time range specified",
    "details": {
      "validRanges": ["7d", "30d", "90d", "1y"]
    }
  },
  "meta": {
    "timestamp": "2023-07-31T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

---

## Rate Limiting

- **General API calls**: 1000 requests per hour per user
- **Analytics endpoints**: 500 requests per hour per user
- **Real-time data**: 100 requests per minute per user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1627776000
```

---

## Best Practices

### 1. Efficient Data Fetching
- Use appropriate time ranges to limit data volume
- Filter by platform when possible to reduce response size
- Implement client-side caching for frequently accessed data
- Use pagination for large datasets

### 2. Real-time Updates
- Implement WebSocket connections for real-time dashboard updates
- Use polling intervals of 30 seconds or more for live data
- Cache dashboard data and refresh periodically
- Subscribe to relevant webhook events for instant updates

### 3. Performance Optimization
- Request only the metrics you need using query parameters
- Use the summary endpoints for overview data
- Implement progressive loading for detailed analytics
- Consider using the detailed analytics endpoint for complex queries

### 4. Data Visualization
- Use the provided time-series data for charts and graphs
- Implement responsive design for mobile dashboard viewing
- Show loading states while fetching analytics data
- Provide export functionality for analytics reports

### 5. Error Handling
- Implement retry logic for failed requests
- Show meaningful error messages to users
- Gracefully handle missing or incomplete data
- Provide fallback data when real-time updates fail