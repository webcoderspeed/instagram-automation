# Subscription API Documentation

This documentation covers all subscription and billing endpoints for the Instagram Automation SaaS application. All endpoints require authentication.

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
6. [Error Responses](#error-responses)
7. [Authentication](#authentication)

---

## Subscription Management

### 1. Get Current Subscription
**Endpoint:** `GET /current`  
**Description:** Retrieves current subscription details for the authenticated user.  
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
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "planId": "plan_premium",
      "planName": "Premium Plan",
      "currentPeriodStart": "2024-01-01T00:00:00Z",
      "currentPeriodEnd": "2024-02-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "trialEnd": null,
      "pricing": {
        "amount": 2999,
        "currency": "USD",
        "interval": "month",
        "intervalCount": 1
      },
      "features": [
        "unlimited_automations",
        "advanced_analytics",
        "priority_support",
        "custom_scheduling"
      ],
      "usage": {
        "automationsUsed": 15,
        "automationsLimit": -1,
        "postsPublished": 120,
        "postsLimit": 1000
      }
    }
  },
  "message": "Subscription retrieved successfully"
}
```

### 2. Activate Subscription
**Endpoint:** `POST /activate`  
**Description:** Activates a subscription after successful payment.  
**Required Permission:** `SUBSCRIPTION_UPDATE`  
**Rate Limit:** General rate limit applies

**Request Body:**
```json
{
  "sessionId": "cs_test_1234567890",
  "planId": "plan_premium"
}
```

```bash
curl -X POST http://localhost:3000/api/subscriptions/activate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "sessionId": "cs_test_1234567890",
    "planId": "plan_premium"
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
      "planId": "plan_premium",
      "activatedAt": "2024-01-01T12:00:00Z",
      "currentPeriodStart": "2024-01-01T12:00:00Z",
      "currentPeriodEnd": "2024-02-01T12:00:00Z"
    }
  },
  "message": "Subscription activated successfully"
}
```

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