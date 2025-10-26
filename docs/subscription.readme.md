# Subscription API Documentation

This documentation covers all subscription and billing endpoints for the Instagram Automation SaaS application. All endpoints require authentication and appropriate permissions.

## Overview

The Subscription API provides comprehensive subscription and billing management capabilities, including plan management, payment processing, usage tracking, and billing history. The API integrates with Stripe for secure payment processing and supports multiple subscription tiers with different feature sets.

## Key Features

- **Flexible Subscription Plans**: Support for Free, Starter, Professional, and Enterprise tiers
- **Secure Payment Processing**: Integration with Stripe for PCI-compliant payment handling
- **Usage Tracking**: Real-time monitoring of plan limits and resource consumption
- **Billing History**: Complete transaction history with filtering and pagination
- **Subscription Lifecycle**: Full support for activation, cancellation, and reactivation
- **Payment Method Management**: Secure storage and updating of payment methods
- **Webhook Integration**: Real-time updates from Stripe for subscription events

## Base URL
```
http://localhost:3000/api/subscriptions
```

## Table of Contents
1. [Subscription Management](#subscription-management)
2. [Plans & Pricing](#plans--pricing)
3. [Checkout & Payment](#checkout--payment)
4. [Billing & Usage](#billing--usage)
5. [Payment Methods](#payment-methods)
6. [Usage Statistics](#usage-statistics)
7. [Webhook Handling](#webhook-handling)
8. [Data Models](#data-models)
9. [Error Responses](#error-responses)
10. [Rate Limiting](#rate-limiting)
11. [Best Practices](#best-practices)

---

## Subscription Management

### 1. Get Current Subscription
**Endpoint:** `GET /current`  
**Description:** Retrieves current subscription details for the authenticated user, including plan features, usage statistics, and billing information.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/subscriptions/current \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sub_1234567890",
    "userId": "user_123",
    "plan": "professional",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "features": {
      "maxPostsPerMonth": 500,
      "maxAutomations": 20,
      "maxPlatformAccounts": 15,
      "maxStorageGB": 50,
      "analyticsRetentionDays": 90,
      "prioritySupport": true,
      "customBranding": true,
      "apiAccess": true,
      "webhooks": true,
      "teamMembers": 5,
      "advancedAnalytics": true,
      "bulkOperations": true
    },
    "usage": {
      "postsUsed": 120,
      "automationsUsed": 8,
      "connectedAccountsUsed": 5
    },
    "billing": {
      "amount": 79,
      "currency": "USD",
      "interval": "month"
    },
    "stripeSubscriptionId": "sub_stripe_123"
  },
  "message": "Subscription retrieved successfully"
}
```

### 2. Activate Subscription
**Endpoint:** `POST /activate`  
**Description:** Activates a subscription after successful payment processing.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "sessionId": "cs_test_1234567890",
  "planId": "professional",
  "paymentIntentId": "pi_1234567890"
}
```

```bash
curl -X POST http://localhost:3000/api/subscriptions/activate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sessionId": "cs_test_1234567890",
    "planId": "professional",
    "paymentIntentId": "pi_1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_1234567890",
    "plan": "professional",
    "status": "active"
  },
  "message": "Subscription activated successfully"
}
```

### 3. Cancel Subscription
**Endpoint:** `POST /cancel`  
**Description:** Cancels the current subscription. By default, the subscription remains active until the end of the current billing period.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "cancelAtPeriodEnd": true,
  "reason": "no_longer_needed",
  "feedback": "Optional cancellation feedback"
}
```

```bash
curl -X POST http://localhost:3000/api/subscriptions/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "cancelAtPeriodEnd": true,
    "reason": "no_longer_needed",
    "feedback": "Found a better alternative"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2024-02-01T00:00:00Z"
  },
  "message": "Subscription canceled successfully. Access will continue until the end of the current billing period."
}
```

### 4. Reactivate Subscription
**Endpoint:** `POST /reactivate`  
**Description:** Reactivates a canceled subscription before the period ends.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

```bash
curl -X POST http://localhost:3000/api/subscriptions/reactivate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "cancelAtPeriodEnd": false
  },
  "message": "Subscription reactivated successfully"
}
```

---

## Plans & Pricing

### 5. Get Available Plans
**Endpoint:** `GET /plans`  
**Description:** Retrieves all available subscription plans with their features, limits, and pricing information.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "description": "Perfect for getting started",
      "price": 0,
      "currency": "USD",
      "interval": "month",
      "features": {
        "maxPosts": 10,
        "maxAutomations": 1,
        "maxConnectedAccounts": 2,
        "analytics": false,
        "prioritySupport": false,
        "customBranding": false
      },
      "limits": {
        "postsPerMonth": 10,
        "automationsActive": 1,
        "connectedAccounts": 2
      }
    },
    {
      "id": "starter",
      "name": "Starter",
      "description": "Great for small businesses",
      "price": 29,
      "currency": "USD",
      "interval": "month",
      "features": {
        "maxPosts": 100,
        "maxAutomations": 5,
        "maxConnectedAccounts": 5,
        "analytics": true,
        "prioritySupport": false,
        "customBranding": false
      },
      "limits": {
        "postsPerMonth": 100,
        "automationsActive": 5,
        "connectedAccounts": 5
      }
    },
    {
      "id": "professional",
      "name": "Professional",
      "description": "Perfect for growing businesses",
      "price": 79,
      "currency": "USD",
      "interval": "month",
      "features": {
        "maxPosts": 500,
        "maxAutomations": 20,
        "maxConnectedAccounts": 15,
        "analytics": true,
        "prioritySupport": true,
        "customBranding": true
      },
      "limits": {
        "postsPerMonth": 500,
        "automationsActive": 20,
        "connectedAccounts": 15
      }
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "description": "For large organizations",
      "price": 199,
      "currency": "USD",
      "interval": "month",
      "features": {
        "maxPosts": -1,
        "maxAutomations": -1,
        "maxConnectedAccounts": -1,
        "analytics": true,
        "prioritySupport": true,
        "customBranding": true
      },
      "limits": {
        "postsPerMonth": -1,
        "automationsActive": -1,
        "connectedAccounts": -1
      }
    }
  ],
  "message": "Plans retrieved successfully"
}
```

---

## Checkout & Payment

### 6. Create Checkout Session
**Endpoint:** `POST /checkout`  
**Description:** Creates a Stripe checkout session for subscription payment processing.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "planId": "professional",
  "interval": "month"
}
```

```bash
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "planId": "professional",
    "interval": "month"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_1234567890",
    "sessionId": "cs_test_1234567890"
  },
  "message": "Checkout session created successfully"
}
```

---

## Billing & Usage

### 7. Get Billing History
**Endpoint:** `GET /billing-history`  
**Description:** Retrieves billing history with filtering and pagination support.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 10)
- `status` (optional): Filter by payment status (completed, failed, pending)
- `startDate` (optional): Filter payments from this date (ISO 8601 format)
- `endDate` (optional): Filter payments until this date (ISO 8601 format)

```bash
curl -X GET "http://localhost:3000/api/subscriptions/billing-history?page=1&limit=10&status=completed" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "billingHistory": [
      {
        "id": "stripe_inv_1234567890",
        "amount": 79.00,
        "currency": "USD",
        "status": "completed",
        "date": "2024-01-01T12:00:00Z",
        "description": "Professional subscription",
        "paymentMethod": "card"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  },
  "message": "Billing history retrieved successfully"
}
```

---

## Payment Methods

### 8. Update Payment Method
**Endpoint:** `PUT /payment-method`  
**Description:** Updates the payment method for the current subscription.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890"
}
```

```bash
curl -X PUT http://localhost:3000/api/subscriptions/payment-method \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "paymentMethodId": "pm_1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Payment method updated successfully"
  }
}
```

---

## Usage Statistics

### 9. Get Usage Statistics
**Endpoint:** `GET /usage`  
**Description:** Retrieves current usage statistics compared to plan limits.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/subscriptions/usage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": {
      "current": 120,
      "limit": 500,
      "percentage": 24
    },
    "automations": {
      "current": 8,
      "limit": 20,
      "percentage": 40
    },
    "connectedAccounts": {
      "current": 5,
      "limit": 15,
      "percentage": 33
    },
    "storage": {
      "current": 2.5,
      "limit": 50,
      "percentage": 5,
      "unit": "GB"
    },
    "billingPeriod": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-02-01T00:00:00Z"
    }
  },
  "message": "Usage statistics retrieved successfully"
}
```

---

## Webhook Handling

### 10. Stripe Webhook Handler
**Endpoint:** `POST /webhook`  
**Description:** Handles Stripe webhook events for subscription updates.  
**Required Permission:** None (webhook endpoint)  
**Rate Limit:** Webhook rate limit applies

**Supported Events:**
- `checkout.session.completed`: Subscription activation
- `customer.subscription.updated`: Subscription changes
- `customer.subscription.deleted`: Subscription cancellation
- `invoice.payment_succeeded`: Successful payment
- `invoice.payment_failed`: Failed payment

**Webhook Payload Example:**
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_1234567890",
      "metadata": {
        "userId": "user_123",
        "planId": "professional"
      }
    }
  }
}
```

---

## Data Models

### Subscription Model
```typescript
interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  features: SubscriptionFeatures;
  usage: UsageStats;
  billing: BillingInfo;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription Features
```typescript
interface SubscriptionFeatures {
  maxPostsPerMonth: number; // -1 for unlimited
  maxAutomations: number;
  maxPlatformAccounts: number;
  maxStorageGB: number;
  analyticsRetentionDays: number;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  teamMembers: number;
  advancedAnalytics: boolean;
  bulkOperations: boolean;
}
```

### Usage Statistics
```typescript
interface UsageStats {
  postsUsed: number;
  automationsUsed: number;
  connectedAccountsUsed: number;
  storageUsed?: number;
}
```

### Billing Information
```typescript
interface BillingInfo {
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}
```

### Payment History
```typescript
interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded';
  description: string;
  paymentDate: Date;
  paymentMethod?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}
```

---

## Error Responses

### Common HTTP Status Codes

| Status Code | Description | Example Scenario |
|-------------|-------------|------------------|
| 400 | Bad Request | Invalid plan ID or missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the operation |
| 404 | Not Found | Subscription or plan not found |
| 409 | Conflict | User already has an active subscription |
| 422 | Unprocessable Entity | Validation errors in request data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error or Stripe API failure |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "No active subscription found for this user",
    "details": {
      "userId": "user_123",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}
```

### Subscription-Specific Error Codes

| Error Code | Description |
|------------|-------------|
| `SUBSCRIPTION_NOT_FOUND` | No subscription found for the user |
| `SUBSCRIPTION_ALREADY_EXISTS` | User already has an active subscription |
| `INVALID_PLAN` | Specified plan ID is invalid |
| `PAYMENT_FAILED` | Payment processing failed |
| `STRIPE_ERROR` | Error from Stripe payment processor |
| `USAGE_LIMIT_EXCEEDED` | Plan usage limits exceeded |
| `SUBSCRIPTION_CANCELLED` | Operation not allowed on cancelled subscription |

---

## Rate Limiting

### Rate Limit Policies

| Endpoint Category | Requests per Minute | Burst Limit |
|-------------------|-------------------|-------------|
| General API calls | 60 | 10 |
| Checkout operations | 10 | 3 |
| Webhook endpoints | 100 | 20 |
| Usage statistics | 30 | 5 |

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60,
      "limit": 60,
      "remaining": 0
    }
  }
}
```

---

## Best Practices

### 1. Subscription Management
- **Check subscription status** before allowing access to premium features
- **Handle subscription state changes** gracefully in your application
- **Implement proper error handling** for payment failures and subscription issues
- **Use webhooks** for real-time subscription updates rather than polling

### 2. Payment Processing
- **Validate plan selections** before creating checkout sessions
- **Handle payment failures** with appropriate user messaging
- **Implement retry logic** for failed API calls to Stripe
- **Store minimal payment data** and rely on Stripe for sensitive information

### 3. Usage Tracking
- **Monitor usage limits** proactively to prevent service interruptions
- **Implement soft limits** with warnings before hard limits are reached
- **Cache usage statistics** to reduce database load
- **Update usage counters** asynchronously when possible

### 4. Security Considerations
- **Validate webhook signatures** to ensure authenticity
- **Use HTTPS** for all subscription-related communications
- **Implement proper authentication** and authorization checks
- **Log subscription events** for audit and debugging purposes

### 5. User Experience
- **Provide clear pricing information** and feature comparisons
- **Implement graceful degradation** when limits are reached
- **Send proactive notifications** for billing issues and renewals
- **Offer easy subscription management** through your application interface

### 6. Error Handling
- **Implement exponential backoff** for retrying failed requests
- **Provide meaningful error messages** to users
- **Log detailed error information** for debugging
- **Handle edge cases** like subscription state transitions

### 7. Performance Optimization
- **Cache subscription data** to reduce API calls
- **Use pagination** for large datasets like billing history
- **Implement efficient database queries** for usage statistics
- **Monitor API response times** and optimize slow endpoints

### 3. Cancel Subscription
**Endpoint:** `POST /cancel`  
**Description:** Cancels the current subscription (will remain active until period end).  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "reason": "no_longer_needed",
  "feedback": "Optional cancellation feedback"
}
```

```bash
curl -X POST http://localhost:3000/api/subscriptions/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "reason": "no_longer_needed",
    "feedback": "Found a better alternative"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "cancelAtPeriodEnd": true,
      "canceledAt": "2024-01-15T12:00:00Z",
      "currentPeriodEnd": "2024-02-01T00:00:00Z"
    }
  },
  "message": "Subscription canceled successfully. Access will continue until the end of the current billing period."
}
```

### 4. Reactivate Subscription
**Endpoint:** `POST /reactivate`  
**Description:** Reactivates a canceled subscription before the period ends.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

```bash
curl -X POST http://localhost:3000/api/subscriptions/reactivate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "cancelAtPeriodEnd": false,
      "reactivatedAt": "2024-01-20T12:00:00Z"
    }
  },
  "message": "Subscription reactivated successfully"
}
```

---

## Plans & Pricing

### 5. Get Available Plans
**Endpoint:** `GET /plans`  
**Description:** Retrieves all available subscription plans and their pricing.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_free",
        "name": "Free Plan",
        "description": "Perfect for getting started",
        "price": {
          "amount": 0,
          "currency": "USD",
          "interval": "month"
        },
        "features": [
          "5 automations",
          "Basic analytics",
          "Email support",
          "50 posts per month"
        ],
        "limits": {
          "automations": 5,
          "posts": 50,
          "analytics": "basic"
        },
        "popular": false
      },
      {
        "id": "plan_premium",
        "name": "Premium Plan",
        "description": "For growing businesses",
        "price": {
          "amount": 2999,
          "currency": "USD",
          "interval": "month"
        },
        "features": [
          "Unlimited automations",
          "Advanced analytics",
          "Priority support",
          "1000 posts per month",
          "Custom scheduling"
        ],
        "limits": {
          "automations": -1,
          "posts": 1000,
          "analytics": "advanced"
        },
        "popular": true
      },
      {
        "id": "plan_enterprise",
        "name": "Enterprise Plan",
        "description": "For large organizations",
        "price": {
          "amount": 9999,
          "currency": "USD",
          "interval": "month"
        },
        "features": [
          "Unlimited everything",
          "Custom integrations",
          "Dedicated support",
          "White-label options",
          "API access"
        ],
        "limits": {
          "automations": -1,
          "posts": -1,
          "analytics": "enterprise"
        },
        "popular": false
      }
    ]
  },
  "message": "Plans retrieved successfully"
}
```

---

## Checkout & Payment

### 6. Create Checkout Session
**Endpoint:** `POST /checkout`  
**Description:** Creates a Stripe checkout session for subscription payment.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "planId": "plan_premium",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

```bash
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "planId": "plan_premium",
    "successUrl": "https://yourapp.com/success",
    "cancelUrl": "https://yourapp.com/cancel"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkout": {
      "sessionId": "cs_test_1234567890",
      "url": "https://checkout.stripe.com/pay/cs_test_1234567890",
      "expiresAt": "2024-01-01T13:00:00Z"
    }
  },
  "message": "Checkout session created successfully"
}
```

---

## Payment Methods

### 7. Update Payment Method
**Endpoint:** `PUT /payment-method`  
**Description:** Updates the default payment method for the subscription.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890"
}
```

```bash
curl -X PUT http://localhost:3000/api/subscriptions/payment-method \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "paymentMethodId": "pm_1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentMethod": {
      "id": "pm_1234567890",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "isDefault": true
    }
  },
  "message": "Payment method updated successfully"
}
```

---

## Billing & Usage

### 8. Get Billing History
**Endpoint:** `GET /billing-history`  
**Description:** Retrieves billing history and invoices for the user.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/subscriptions/billing-history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `limit` (optional) - Number of records to return (default: 10, max: 100)
- `startingAfter` (optional) - Pagination cursor for next page

**Response:**
```json
{
  "success": true,
  "data": {
    "billingHistory": [
      {
        "id": "in_1234567890",
        "amount": 2999,
        "currency": "USD",
        "status": "paid",
        "date": "2024-01-01T12:00:00Z",
        "description": "Premium Plan - January 2024",
        "invoiceUrl": "https://invoice.stripe.com/i/acct_123/test_456",
        "paymentMethod": {
          "type": "card",
          "last4": "4242"
        }
      },
      {
        "id": "in_0987654321",
        "amount": 2999,
        "currency": "USD",
        "status": "paid",
        "date": "2023-12-01T12:00:00Z",
        "description": "Premium Plan - December 2023",
        "invoiceUrl": "https://invoice.stripe.com/i/acct_123/test_789",
        "paymentMethod": {
          "type": "card",
          "last4": "4242"
        }
      }
    ],
    "hasMore": false
  },
  "message": "Billing history retrieved successfully"
}
```

### 9. Get Usage Statistics
**Endpoint:** `GET /usage`  
**Description:** Retrieves current usage statistics for the subscription.  
**Required Permission:** `SUBSCRIPTION_READ`  
**Rate Limit:** General rate limit applies

```bash
curl -X GET http://localhost:3000/api/subscriptions/usage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token"
```

**Query Parameters:**
- `period` (optional) - Time period (current, last_month, last_3_months)

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "period": "current",
      "periodStart": "2024-01-01T00:00:00Z",
      "periodEnd": "2024-02-01T00:00:00Z",
      "automations": {
        "used": 15,
        "limit": -1,
        "percentage": 0
      },
      "posts": {
        "used": 120,
        "limit": 1000,
        "percentage": 12.0
      },
      "apiCalls": {
        "used": 5000,
        "limit": 50000,
        "percentage": 10.0
      },
      "storage": {
        "used": 2048,
        "limit": 10240,
        "percentage": 20.0,
        "unit": "MB"
      }
    },
    "trends": {
      "automationsGrowth": 25.0,
      "postsGrowth": 15.5,
      "apiCallsGrowth": -5.2
    }
  },
  "message": "Usage statistics retrieved successfully"
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
        "field": "planId",
        "message": "Plan ID is required"
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
    "requiredPermission": "SUBSCRIPTION_READ"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "Subscription not found"
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

### Subscription-Specific Error Codes

**SUBSCRIPTION_ALREADY_ACTIVE**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_ALREADY_ACTIVE",
    "message": "User already has an active subscription"
  }
}
```

**SUBSCRIPTION_CANNOT_CANCEL**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_CANNOT_CANCEL",
    "message": "Subscription cannot be canceled at this time"
  }
}
```

**PAYMENT_FAILED**
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment processing failed",
    "details": {
      "stripeError": "Your card was declined",
      "declineCode": "generic_decline"
    }
  }
}
```

**PLAN_NOT_FOUND**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Subscription plan not found"
  }
}
```

**USAGE_LIMIT_EXCEEDED**
```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "Usage limit exceeded for current plan",
    "details": {
      "resource": "posts",
      "used": 1000,
      "limit": 1000
    }
  }
}
```

---

## Authentication

All subscription API endpoints require:

1. **User Authentication**: Valid JWT token in Authorization header
2. **Permissions**: Specific permissions based on endpoint requirements

### Required Permissions

- `SUBSCRIPTION_READ` - For reading subscription details, plans, billing history, and usage
- `SUBSCRIPTION_UPDATE` - For creating, activating, canceling, and updating subscriptions

### Rate Limiting

- **General endpoints**: 1000 requests per hour per user
- **Checkout endpoints**: 100 requests per hour per user

Rate limits are enforced per user and reset every hour. When rate limit is exceeded, the API returns a 429 status code with retry information.

### Security Features

- All requests must be made over HTTPS in production
- JWT tokens expire after 24 hours
- Payment processing handled securely through Stripe
- All sensitive payment data is handled by Stripe (PCI compliant)
- Subscription data is encrypted in transit and at rest
- Request validation and sanitization applied to all inputs

### Webhook Integration

The subscription system integrates with Stripe webhooks to handle:
- Payment success/failure notifications
- Subscription status changes
- Invoice payment updates
- Payment method updates

These webhooks ensure real-time synchronization between Stripe and the application database.