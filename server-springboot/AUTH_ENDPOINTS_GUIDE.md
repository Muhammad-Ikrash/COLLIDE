# Authentication Endpoints - Complete Guide

## ✅ All 6 Authentication Endpoints (Complete!)

### **1. Register** ✅ NEW
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-30T..."
    }
  }
  ```
- **Status:** 201 Created (on success)
- **Errors:**
  - 400: Email already exists
  - 400: Validation errors (name/email/password invalid)

---

### **2. Login** ✅ (Already existed)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/login`
- **Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

---

### **3. Logout** ✅ NEW
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/logout`
- **Headers:**
  - `Authorization: Bearer {{token}}` (optional)
- **Body:** None
- **Response:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
- **Note:** JWT is stateless, so logout is mainly client-side. Client should delete the token.

---

### **4. Refresh Token** ✅ NEW
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/refresh`
- **Body:**
  ```json
  {
    "token": "your_current_token_here"
  }
  ```
- **Response:**
  ```json
  {
    "token": "new_token_here",
    "user": {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com",
      "createdAt": "2025-11-30T..."
    }
  }
  ```
- **Status:** 200 OK
- **Errors:**
  - 401: Invalid or expired token
  - 401: User not found

---

### **5. Forgot Password** ✅ NEW
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "test@example.com"
  }
  ```
- **Response:**
  ```json
  {
    "message": "If the email exists, a password reset link has been sent"
  }
  ```
- **Status:** 200 OK (always - security: doesn't reveal if email exists)
- **Note:** 
  - Generates reset token (valid for 1 hour)
  - Token is printed in server console (for testing)
  - In production, send email with reset link

---

### **6. Reset Password** ✅ NEW
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/reset-password`
- **Body:**
  ```json
  {
    "token": "reset_token_from_forgot_password",
    "newPassword": "newSecurePassword123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Password reset successfully"
  }
  ```
- **Status:** 200 OK
- **Errors:**
  - 400: Invalid or expired reset token
  - 400: Validation errors (password too short)

---

## 🧪 Testing in Postman

### **Complete Test Flow:**

#### **1. Register a New User**
```
POST http://localhost:8080/api/auth/register
Body: {
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123"
}
```
**Save token from response!**

#### **2. Login with Existing User**
```
POST http://localhost:8080/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "password123"
}
```

#### **3. Refresh Token**
```
POST http://localhost:8080/api/auth/refresh
Body: {
  "token": "your_current_token"
}
```

#### **4. Forgot Password**
```
POST http://localhost:8080/api/auth/forgot-password
Body: {
  "email": "test@example.com"
}
```
**Check server console for reset token!**

#### **5. Reset Password**
```
POST http://localhost:8080/api/auth/reset-password
Body: {
  "token": "reset_token_from_console",
  "newPassword": "newPassword123"
}
```

#### **6. Logout**
```
POST http://localhost:8080/api/auth/logout
Headers: Authorization: Bearer {{token}}
```

---

## 📋 Postman Collection Setup

### **Create These Requests:**

1. **Register**
   - POST `/api/auth/register`
   - Body: name, email, password
   - Tests: Save token to environment

2. **Login**
   - POST `/api/auth/login`
   - Body: email, password
   - Tests: Save token to environment

3. **Refresh Token**
   - POST `/api/auth/refresh`
   - Body: token
   - Tests: Save new token to environment

4. **Forgot Password**
   - POST `/api/auth/forgot-password`
   - Body: email
   - Note: Check server console for token

5. **Reset Password**
   - POST `/api/auth/reset-password`
   - Body: token, newPassword

6. **Logout**
   - POST `/api/auth/logout`
   - Headers: Authorization (optional)

---

## 🔐 Security Features

### **Register:**
- ✅ Email uniqueness check
- ✅ Password hashing (BCrypt)
- ✅ Input validation
- ✅ Returns 201 Created

### **Refresh Token:**
- ✅ Validates old token
- ✅ Verifies user still exists
- ✅ Generates new token with same user info

### **Forgot Password:**
- ✅ Doesn't reveal if email exists (security)
- ✅ Generates secure UUID token
- ✅ Token expires in 1 hour
- ✅ Token stored in database

### **Reset Password:**
- ✅ Validates token and expiry
- ✅ Hashes new password
- ✅ Clears reset token after use

---

## ⚠️ Important Notes

### **Reset Token:**
- Token is printed in **server console** (for testing)
- Format: `Reset token for email@example.com: <uuid>`
- In production, send via email instead

### **Token Expiry:**
- Reset tokens: 1 hour
- JWT tokens: 24 hours (configurable)

### **Password Requirements:**
- Minimum 8 characters (enforced in Register and Reset Password)

---

## 🎯 Quick Test Checklist

- [ ] Register new user
- [ ] Login with registered user
- [ ] Login with test user (test@example.com)
- [ ] Refresh token
- [ ] Forgot password (check console for token)
- [ ] Reset password with token
- [ ] Login with new password
- [ ] Logout

---

## 📝 Example: Complete Flow

### **1. Register:**
```json
POST /api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secure123"
}
→ Get token
```

### **2. Use Protected Endpoint:**
```json
GET /api/example/me
Authorization: Bearer <token>
→ Get user info
```

### **3. Refresh Token:**
```json
POST /api/auth/refresh
{
  "token": "<old_token>"
}
→ Get new token
```

### **4. Forgot Password:**
```json
POST /api/auth/forgot-password
{
  "email": "alice@example.com"
}
→ Check server console for token
```

### **5. Reset Password:**
```json
POST /api/auth/reset-password
{
  "token": "<token_from_console>",
  "newPassword": "newSecure123"
}
→ Password updated
```

---

**All 6 authentication endpoints are now complete!** 🎉

Test them in Postman and you're ready to move on to User Management and Projects!

