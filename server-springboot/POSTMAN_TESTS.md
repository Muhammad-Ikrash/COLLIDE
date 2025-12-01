# Complete Postman Test Suite - All Backend Endpoints

This file contains **ALL** the tests you need to run in Postman to verify your backend is working correctly.

## 📋 Setup Instructions

1. **Set Base URL**: Create a Postman environment variable:
   - Variable: `baseUrl`
   - Value: `http://localhost:8080`

2. **Save Token Automatically**: Add this to your Login request's "Tests" tab:
   ```javascript
   if (pm.response.code === 200) {
       pm.environment.set("token", pm.response.json().token);
       console.log("Token saved to environment!");
   }
   ```

3. **Use Token in Requests**: For protected endpoints, add this header:
   - Key: `Authorization`
   - Value: `Bearer {{token}}`

---

## 🔓 **PUBLIC ENDPOINTS** (No Token Required)

### 1. Hello World Test
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/hello`
- **Headers:** None
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  "Hello, World!"
  ```

---

### 2. Login
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com",
      "createdAt": "2025-11-30T..."
    }
  }
  ```
- **Postman Test Script:**
  ```javascript
  pm.test("Status code is 200", function () {
      pm.response.to.have.status(200);
  });
  pm.test("Response has token", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property('token');
      pm.environment.set("token", jsonData.token);
  });
  pm.test("Response has user info", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property('user');
      pm.expect(jsonData.user).to.have.property('email');
  });
  ```

---

### 3. Register
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/register`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "New User",
    "email": "newuser@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "New User",
      "email": "newuser@example.com",
      "createdAt": "2025-11-30T..."
    }
  }
  ```
- **Postman Test Script:**
  ```javascript
  pm.test("Status code is 201", function () {
      pm.response.to.have.status(201);
  });
  pm.test("Response has token", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property('token');
  });
  ```

---

### 4. Forgot Password
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/forgot-password`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "If the email exists, a password reset link has been sent"
  }
  ```
- **Note:** Check server console for reset token (development mode)

---

### 5. Reset Password
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/reset-password`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "token": "reset-token-from-server-console",
    "newPassword": "newpassword123",
    "confirmNewPassword": "newpassword123"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Password reset successfully"
  }
  ```

---

### 6. Refresh Token
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/refresh`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "token": "{{token}}"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "token": "new-token-here...",
    "user": {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com",
      "createdAt": "2025-11-30T..."
    }
  }
  ```

---

## 🔒 **PROTECTED ENDPOINTS** (Token Required)

### 7. Get Current User
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "createdAt": "2025-11-30T..."
  }
  ```
- **Postman Test Script:**
  ```javascript
  pm.test("Status code is 200", function () {
      pm.response.to.have.status(200);
  });
  pm.test("Response has user data", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property('id');
      pm.expect(jsonData).to.have.property('email');
  });
  ```

---

### 8. Update Profile
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me`
- **Headers:**
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "Updated Name"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "name": "Updated Name",
    "email": "test@example.com",
    "createdAt": "2025-11-30T...",
    "message": "Profile updated successfully"
  }
  ```

---

### 9. Change Password
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/users/me/password`
- **Headers:**
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "currentPassword": "password123",
    "newPassword": "newpassword123"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

---

### 10. Create Project
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/projects`
- **Headers:**
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "My New Project"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "name": "My New Project",
    "ownerId": 1,
    "createdAt": "2025-11-30T...",
    "lastModifiedAt": "2025-11-30T..."
  }
  ```
- **Postman Test Script:**
  ```javascript
  pm.test("Status code is 201", function () {
      pm.response.to.have.status(201);
  });
  pm.test("Response has project ID", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property('id');
      pm.environment.set("projectId", jsonData.id);
  });
  ```

---

### 11. Get User Projects
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/projects`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "projects": [
      {
        "id": 1,
        "name": "My New Project",
        "ownerId": 1,
        "createdAt": "2025-11-30T...",
        "lastModifiedAt": "2025-11-30T..."
      }
    ]
  }
  ```

---

### 12. Get Project by ID
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "name": "My New Project",
    "ownerId": 1,
    "createdAt": "2025-11-30T...",
    "lastModifiedAt": "2025-11-30T..."
  }
  ```

---

### 13. Update Project
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}`
- **Headers:**
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "Updated Project Name"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "name": "Updated Project Name",
    "ownerId": 1,
    "createdAt": "2025-11-30T...",
    "lastModifiedAt": "2025-11-30T...",
    "message": "Project updated successfully"
  }
  ```

---

### 14. Delete Project
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Project deleted successfully"
  }
  ```

---

### 15. Add Project Member
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}/members`
- **Headers:**
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "newuser@example.com",
    "role": "CONTRIBUTOR"
  }
  ```
- **Note:** Role can be: `ADMIN`, `CO_ADMIN`, `CONTRIBUTOR`, `VIEWER`, `BANNED`
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "userId": 2,
    "userName": "New User",
    "userEmail": "newuser@example.com",
    "role": "CONTRIBUTOR",
    "message": "Member added successfully"
  }
  ```

---

### 16. Get Project Members
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}/members`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "members": [
      {
        "id": 1,
        "userId": 1,
        "userName": "Test User",
        "userEmail": "test@example.com",
        "role": "ADMIN",
        "createdAt": "2025-11-30T..."
      },
      {
        "id": 2,
        "userId": 2,
        "userName": "New User",
        "userEmail": "newuser@example.com",
        "role": "CONTRIBUTOR",
        "createdAt": "2025-11-30T..."
      }
    ]
  }
  ```

---

### 17. Update Member Role
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}/members/{{userId}}`
- **Headers:**
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "role": "CO_ADMIN"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "id": 2,
    "userId": 2,
    "role": "CO_ADMIN",
    "message": "Member role updated successfully"
  }
  ```

---

### 18. Remove Project Member
- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/projects/{{projectId}}/members/{{userId}}`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Member removed successfully"
  }
  ```

---

### 19. Logout
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/logout`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### 20. Example Protected Endpoint - Get Current User Info
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/example/me`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "userId": 1,
    "email": "test@example.com",
    "message": "This is a protected endpoint! You are authenticated."
  }
  ```

---

## 🧪 **TESTING WORKFLOW**

### Recommended Test Order:

1. **Login** → Save token
2. **Get Current User** → Verify token works
3. **Create Project** → Save project ID
4. **Get User Projects** → Verify project appears
5. **Get Project by ID** → Verify project details
6. **Update Project** → Verify changes
7. **Register New User** → Get second user token
8. **Add Project Member** → Add second user to project
9. **Get Project Members** → Verify member added
10. **Update Member Role** → Change role
11. **Remove Project Member** → Remove member
12. **Update Profile** → Change name
13. **Change Password** → Update password
14. **Delete Project** → Clean up

---

## ❌ **ERROR RESPONSES TO TEST**

### Test Invalid Login:
- **Body:** `{"email": "wrong@example.com", "password": "wrong"}`
- **Expected:** `400 Bad Request` with `{"error": "Invalid email or password"}`

### Test Unauthorized Access:
- **Request:** Any protected endpoint without `Authorization` header
- **Expected:** `401 Unauthorized` with `{"error": "Missing or invalid Authorization header"}`

### Test Invalid Token:
- **Request:** Protected endpoint with `Authorization: Bearer invalid-token`
- **Expected:** `401 Unauthorized` with `{"error": "Invalid or expired token"}`

### Test Access Denied:
- **Request:** Update/Delete project you don't own
- **Expected:** `403 Forbidden` with `{"error": "You don't have permission..."}`

---

## 📝 **NOTES**

- All timestamps are in ISO 8601 format
- Token expires after 24 hours (configurable in `application.properties`)
- Project owner is automatically added as ADMIN
- Only ADMIN and CO_ADMIN can add/remove members
- Project owner cannot be removed
- All protected endpoints require valid JWT token in `Authorization: Bearer <token>` header

---

## ✅ **SUCCESS CRITERIA**

Your backend is working correctly if:
- ✅ All public endpoints return expected responses
- ✅ Login returns a valid token
- ✅ Protected endpoints work with token
- ✅ Project CRUD operations work
- ✅ Member management works
- ✅ Error responses are correct
- ✅ Unauthorized access is blocked

---

**Total Endpoints: 20**
- Public: 6
- Protected: 14

