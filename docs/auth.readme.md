# Authentication API Documentation

यह documentation Instagram Automation SaaS application के सभी authentication endpoints के लिए है। सभी endpoints session-based authentication का उपयोग करते हैं।

## Base URL
```
http://localhost:3000/api/auth
```

## Table of Contents
1. [User Registration](#user-registration)
2. [Email Verification](#email-verification)
3. [User Login](#user-login)
4. [Session Management](#session-management)
5. [User Profile](#user-profile)
6. [Password Management](#password-management)
7. [Instagram OAuth](#instagram-oauth)

---

## User Registration

### 1. User Signup
**Endpoint:** `POST /signup`  
**Description:** नया user account बनाता है और verification email भेजता है।

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "username": "myusername",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "userId": "user_id_here",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

### 2. Verify Email
**Endpoint:** `POST /verify-email` या `GET /verify-email`  
**Description:** Email verification token को verify करता है।

```bash
# POST method
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "verification_token_here"
  }'

# GET method (email link से)
curl -X GET "http://localhost:3000/api/auth/verify-email?token=verification_token_here"
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "verified": true
  }
}
```

### 3. Resend Verification Email
**Endpoint:** `POST /resend-verification`  
**Description:** Verification email को दोबारा भेजता है।

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## User Login

### 4. User Login
**Endpoint:** `POST /login`  
**Description:** User को login करता है और session create करता है।

```bash
# Regular login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Login with Remember Me (extended session)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "rememberMe": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "myusername",
      "firstName": "John",
      "lastName": "Doe"
    },
    "session": {
      "id": "session_id",
      "expiresAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 5. User Logout
**Endpoint:** `POST /logout`  
**Description:** Current session को terminate करता है।

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Session Management

### 6. Check Session Status
**Endpoint:** `GET /session`  
**Description:** Current session की status check करता है।

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_id",
    "userId": "user_id",
    "isActive": true,
    "expiresAt": "2024-01-01T12:00:00Z",
    "rememberMe": false
  }
}
```

### 7. Refresh Session
**Endpoint:** `POST /session/refresh`  
**Description:** Current session को refresh करता है (expiry time extend करता है)।

```bash
curl -X POST http://localhost:3000/api/auth/session/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Session refreshed successfully",
  "data": {
    "sessionId": "session_id",
    "expiresAt": "2024-01-01T13:00:00Z"
  }
}
```

---

## User Profile

### 8. Get User Profile
**Endpoint:** `GET /profile`  
**Description:** Logged-in user की profile information return करता है।

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "myusername",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": true,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T11:00:00Z"
    }
  }
}
```

---

## Password Management

### 9. Forgot Password
**Endpoint:** `POST /forgot-password`  
**Description:** Password reset email भेजता है।

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 10. Verify Reset Token
**Endpoint:** `POST /verify-reset-token`  
**Description:** Password reset token को verify करता है।

```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Reset token is valid",
  "data": {
    "valid": true
  }
}
```

### 11. Reset Password
**Endpoint:** `POST /reset-password`  
**Description:** Reset token के साथ नया password set करता है।

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 12. Change Password (Authenticated)
**Endpoint:** `POST /change-password`  
**Description:** Logged-in user अपना password change कर सकता है।

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Instagram OAuth

### 13. Initiate Instagram OAuth
**Endpoint:** `GET /instagram`  
**Description:** Instagram OAuth flow शुरू करता है।

```bash
curl -X GET http://localhost:3000/api/auth/instagram \
  -b cookies.txt
```

**Response:** Redirect to Instagram OAuth URL

### 14. Instagram OAuth Callback
**Endpoint:** `GET /instagram/callback`  
**Description:** Instagram OAuth callback handle करता है।

```bash
curl -X GET "http://localhost:3000/api/auth/instagram/callback?code=oauth_code_here&state=state_here" \
  -b cookies.txt
```

### 15. Refresh Instagram Token
**Endpoint:** `POST /instagram/refresh`  
**Description:** Instagram access token को refresh करता है।

```bash
curl -X POST http://localhost:3000/api/auth/instagram/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "refreshToken": "instagram_refresh_token"
  }'
```

### 16. Get Instagram User Info
**Endpoint:** `GET /instagram/user/:userId`  
**Description:** Specific user की Instagram information return करता है।

```bash
curl -X GET http://localhost:3000/api/auth/instagram/user/user_id_here \
  -b cookies.txt
```

### 17. Revoke Instagram Token
**Endpoint:** `POST /instagram/revoke`  
**Description:** Instagram access token को revoke करता है।

```bash
curl -X POST http://localhost:3000/api/auth/instagram/revoke \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "accessToken": "instagram_access_token"
  }'
```

---

## Important Notes

### Session-Based Authentication
- सभी authenticated endpoints session cookies का उपयोग करते हैं
- `-c cookies.txt` flag से cookies save करें
- `-b cookies.txt` flag से saved cookies use करें

### Rate Limiting
- Signup: 5 requests per 15 minutes
- Login: 10 requests per 15 minutes  
- Email Verification: 3 requests per 15 minutes
- Password Reset: 3 requests per 15 minutes

### Error Responses
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

### Complete Authentication Flow Test:
```bash
# 1. Register new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser","firstName":"Test","lastName":"User"}'

# 2. Verify email (use token from email)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"verification_token_from_email"}'

# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 4. Check session
curl -X GET http://localhost:3000/api/auth/session -b cookies.txt

# 5. Get profile
curl -X GET http://localhost:3000/api/auth/profile -b cookies.txt

# 6. Refresh session
curl -X POST http://localhost:3000/api/auth/session/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 7. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

यह documentation आपको सभी authentication endpoints को test करने में मदद करेगी।