# Subscription API Documentation

यह documentation Instagram Automation SaaS application के सभी subscription और billing endpoints के लिए है। सभी endpoints authentication की आवश्यकता होती है।

## Base URL
```
http://localhost:3000/api/subscriptions
```

## Table of Contents
1. [Subscription Management](#subscription-management)
2. [Plans & Pricing](#plans--pricing)
3. [Checkout & Payment](#checkout--payment)
4. [Billing & Usage](#billing--usage)

---

## Subscription Management

### 1. Get Current Subscription
**Endpoint:** `GET /current`  
**Description:** User के current subscription की details return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/subscriptions/current \
  -H "Content-Type: application/json" \
  -b cookies.txt
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
        "currency": "INR",
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
  }
}
```

### 2. Activate Subscription
**Endpoint:** `POST /activate`  
**Description:** Payment के बाद subscription को activate करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X POST http://localhost:3000/api/subscriptions/activate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sessionId": "cs_test_1234567890",
    "planId": "plan_premium"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "planId": "plan_premium",
      "activatedAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 3. Cancel Subscription
**Endpoint:** `POST /cancel`  
**Description:** Current subscription को cancel करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X POST http://localhost:3000/api/subscriptions/cancel \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "reason": "no_longer_needed",
    "feedback": "Found a better alternative",
    "cancelAtPeriodEnd": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "cancelAtPeriodEnd": true,
      "cancelledAt": "2024-01-01T15:00:00Z",
      "currentPeriodEnd": "2024-02-01T00:00:00Z"
    }
  }
}
```

### 4. Reactivate Subscription
**Endpoint:** `POST /reactivate`  
**Description:** Cancelled subscription को reactivate करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X POST http://localhost:3000/api/subscriptions/reactivate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "planId": "plan_premium"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "status": "active",
      "cancelAtPeriodEnd": false,
      "reactivatedAt": "2024-01-01T16:00:00Z"
    }
  }
}
```

---

## Plans & Pricing

### 5. Get Available Plans
**Endpoint:** `GET /plans`  
**Description:** Available subscription plans की list return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_basic",
        "name": "Basic Plan",
        "description": "Perfect for getting started with Instagram automation",
        "pricing": {
          "monthly": {
            "amount": 999,
            "currency": "INR",
            "priceId": "price_basic_monthly"
          },
          "yearly": {
            "amount": 9999,
            "currency": "INR",
            "priceId": "price_basic_yearly",
            "discount": 17
          }
        },
        "features": [
          "5 automations",
          "100 posts per month",
          "Basic analytics",
          "Email support"
        ],
        "limits": {
          "automations": 5,
          "postsPerMonth": 100,
          "analyticsRetention": 30
        },
        "popular": false
      },
      {
        "id": "plan_premium",
        "name": "Premium Plan",
        "description": "Advanced features for serious content creators",
        "pricing": {
          "monthly": {
            "amount": 2999,
            "currency": "INR",
            "priceId": "price_premium_monthly"
          },
          "yearly": {
            "amount": 29999,
            "currency": "INR",
            "priceId": "price_premium_yearly",
            "discount": 17
          }
        },
        "features": [
          "Unlimited automations",
          "1000 posts per month",
          "Advanced analytics",
          "Priority support",
          "Custom scheduling",
          "Team collaboration"
        ],
        "limits": {
          "automations": -1,
          "postsPerMonth": 1000,
          "analyticsRetention": 90
        },
        "popular": true
      },
      {
        "id": "plan_enterprise",
        "name": "Enterprise Plan",
        "description": "Complete solution for agencies and large teams",
        "pricing": {
          "monthly": {
            "amount": 9999,
            "currency": "INR",
            "priceId": "price_enterprise_monthly"
          },
          "yearly": {
            "amount": 99999,
            "currency": "INR",
            "priceId": "price_enterprise_yearly",
            "discount": 17
          }
        },
        "features": [
          "Unlimited everything",
          "White-label solution",
          "API access",
          "Dedicated support",
          "Custom integrations",
          "Advanced reporting"
        ],
        "limits": {
          "automations": -1,
          "postsPerMonth": -1,
          "analyticsRetention": 365
        },
        "popular": false
      }
    ]
  }
}
```

---

## Checkout & Payment

### 6. Create Checkout Session
**Endpoint:** `POST /checkout`  
**Description:** Subscription purchase के लिए checkout session create करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "priceId": "price_premium_monthly",
    "planId": "plan_premium",
    "successUrl": "https://yourapp.com/success",
    "cancelUrl": "https://yourapp.com/cancel",
    "couponCode": "SAVE20"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutSession": {
      "id": "cs_test_1234567890",
      "url": "https://checkout.stripe.com/pay/cs_test_1234567890",
      "expiresAt": "2024-01-01T13:00:00Z"
    },
    "planDetails": {
      "id": "plan_premium",
      "name": "Premium Plan",
      "amount": 2999,
      "currency": "INR",
      "interval": "month"
    }
  }
}
```

### 7. Update Payment Method
**Endpoint:** `PUT /payment-method`  
**Description:** Subscription के payment method को update करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X PUT http://localhost:3000/api/subscriptions/payment-method \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "paymentMethodId": "pm_1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method updated successfully",
  "data": {
    "paymentMethod": {
      "id": "pm_1234567890",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      }
    }
  }
}
```

---

## Billing & Usage

### 8. Get Billing History
**Endpoint:** `GET /billing-history`  
**Description:** User की billing history return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/subscriptions/billing-history \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Query Parameters:**
- `limit` - Number of records to return (default: 10, max: 100)
- `startingAfter` - Pagination cursor for next page

```bash
curl -X GET "http://localhost:3000/api/subscriptions/billing-history?limit=20&startingAfter=inv_1234567890" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "billingHistory": [
      {
        "id": "inv_1234567890",
        "number": "INV-2024-001",
        "status": "paid",
        "amount": 2999,
        "currency": "INR",
        "description": "Premium Plan - Monthly",
        "periodStart": "2024-01-01T00:00:00Z",
        "periodEnd": "2024-02-01T00:00:00Z",
        "paidAt": "2024-01-01T12:00:00Z",
        "dueDate": "2024-01-01T00:00:00Z",
        "invoiceUrl": "https://invoice.stripe.com/i/inv_1234567890",
        "downloadUrl": "https://invoice.stripe.com/i/inv_1234567890/pdf"
      },
      {
        "id": "inv_0987654321",
        "number": "INV-2023-012",
        "status": "paid",
        "amount": 2999,
        "currency": "INR",
        "description": "Premium Plan - Monthly",
        "periodStart": "2023-12-01T00:00:00Z",
        "periodEnd": "2024-01-01T00:00:00Z",
        "paidAt": "2023-12-01T12:00:00Z",
        "dueDate": "2023-12-01T00:00:00Z"
      }
    ],
    "hasMore": true,
    "totalCount": 12
  }
}
```

### 9. Get Usage Statistics
**Endpoint:** `GET /usage`  
**Description:** Current billing period के usage statistics return करता है।  
**Required Role:** `VERIFIED_USER`

```bash
curl -X GET http://localhost:3000/api/subscriptions/usage \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "billingPeriod": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-02-01T00:00:00Z",
        "daysRemaining": 15
      },
      "automations": {
        "used": 15,
        "limit": -1,
        "percentage": 0
      },
      "postsPublished": {
        "used": 120,
        "limit": 1000,
        "percentage": 12
      },
      "apiCalls": {
        "used": 5000,
        "limit": 50000,
        "percentage": 10
      },
      "storage": {
        "used": 250,
        "limit": 5000,
        "unit": "MB",
        "percentage": 5
      },
      "features": {
        "advancedAnalytics": true,
        "prioritySupport": true,
        "customScheduling": true,
        "teamCollaboration": true
      },
      "overageCharges": {
        "posts": 0,
        "apiCalls": 0,
        "storage": 0,
        "total": 0
      }
    }
  }
}
```

---

## Important Notes

### Authentication Requirements
- सभी endpoints authenticated user की आवश्यकता होती है
- `VERIFIED_USER` role minimum requirement है
- Session cookies का उपयोग करें (`-b cookies.txt`)

### Payment Processing
- Stripe payment gateway का उपयोग
- Secure checkout sessions
- Automatic invoice generation
- Multiple payment methods supported

### Subscription Status
- `active` - Active subscription
- `trialing` - In trial period
- `past_due` - Payment failed
- `canceled` - Cancelled subscription
- `unpaid` - Payment pending

### Plan Features
- **Basic Plan**: 5 automations, 100 posts/month
- **Premium Plan**: Unlimited automations, 1000 posts/month
- **Enterprise Plan**: Unlimited everything + white-label

### Billing Cycles
- Monthly billing on the same date
- Yearly billing with 17% discount
- Prorated charges for plan changes
- Grace period for failed payments

### Error Responses
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "SUBSCRIPTION_ERROR",
    "type": "payment_failed",
    "details": "Payment method declined"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Payment Required
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Testing Workflow

### Complete Subscription Flow Test:
```bash
# 1. Login first (required for all subscription endpoints)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Get available plans
curl -X GET http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 3. Get current subscription (if any)
curl -X GET http://localhost:3000/api/subscriptions/current \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Create checkout session
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"priceId":"price_premium_monthly","planId":"plan_premium","successUrl":"https://app.com/success","cancelUrl":"https://app.com/cancel"}'

# 5. Activate subscription (after payment)
curl -X POST http://localhost:3000/api/subscriptions/activate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"sessionId":"cs_test_1234567890","planId":"plan_premium"}'

# 6. Get usage statistics
curl -X GET http://localhost:3000/api/subscriptions/usage \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 7. Get billing history
curl -X GET http://localhost:3000/api/subscriptions/billing-history \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 8. Update payment method
curl -X PUT http://localhost:3000/api/subscriptions/payment-method \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"paymentMethodId":"pm_1234567890"}'

# 9. Cancel subscription
curl -X POST http://localhost:3000/api/subscriptions/cancel \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reason":"no_longer_needed","cancelAtPeriodEnd":true}'

# 10. Reactivate subscription
curl -X POST http://localhost:3000/api/subscriptions/reactivate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"planId":"plan_premium"}'
```

### Plan Comparison Test:
```bash
# Get all plans and compare features
curl -X GET http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -b cookies.txt | jq '.data.plans[] | {name: .name, price: .pricing.monthly.amount, features: .features}'
```

यह documentation आपको सभी subscription और billing endpoints को test करने में मदद करेगी।