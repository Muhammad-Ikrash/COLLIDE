# Testing APIs with Postman

## ✅ Yes, You Can Use Postman!

Postman is perfect for testing your APIs. Here's how to set it up:

---

## 🚀 Quick Setup

### **1. Download Postman** (if you don't have it)
- Go to: https://www.postman.com/downloads/
- Download and install

### **2. Create a New Collection**
1. Open Postman
2. Click "New" → "Collection"
3. Name it: "COLLIDE API"

---

## 📝 Setting Up Requests

### **Request 1: Login (Get Token)**

1. **Create New Request:**
   - Click "New" → "HTTP Request"
   - Name it: "Login"

2. **Configure Request:**
   - **Method:** `POST`
   - **URL:** `http://localhost:8080/api/auth/login`

3. **Headers Tab:**
   - Key: `Content-Type`
   - Value: `application/json`

4. **Body Tab:**
   - Select "raw"
   - Select "JSON" from dropdown
   - Enter:
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

5. **Click "Send"**

6. **Save the Token:**
   - In the response, copy the `token` value
   - We'll use this for protected endpoints

---

### **Request 2: Test Protected Endpoint**

1. **Create New Request:**
   - Click "New" → "HTTP Request"
   - Name it: "Get Current User"

2. **Configure Request:**
   - **Method:** `GET`
   - **URL:** `http://localhost:8080/api/example/me`

3. **Authorization Tab:**
   - **Type:** Select "Bearer Token"
   - **Token:** Paste the token from login response

4. **Click "Send"**

---

## 🔄 Using Environment Variables (Recommended)

Instead of copying/pasting tokens, use Postman environments:

### **Step 1: Create Environment**
1. Click the gear icon (top right) → "Manage Environments"
2. Click "Add"
3. Name it: "COLLIDE Local"
4. Add variable:
   - **Variable:** `token`
   - **Initial Value:** (leave empty)
   - **Current Value:** (leave empty)
5. Click "Add" → "Add"

### **Step 2: Save Token Automatically**
1. Go to your **Login** request
2. Click "Tests" tab (below URL)
3. Add this script:
   ```javascript
   if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       pm.environment.set("token", jsonData.token);
       console.log("Token saved to environment!");
   }
   ```
4. Now when you run Login, the token is automatically saved!

### **Step 3: Use Token in Other Requests**
1. Go to your protected endpoint request
2. **Authorization Tab:**
   - **Type:** Bearer Token
   - **Token:** `{{token}}` (this uses the environment variable)

---

## 📋 Complete Request Collection

Here are all the requests you should create:

### **1. Login**
- **Method:** POST
- **URL:** `http://localhost:8080/api/auth/login`
- **Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Tests Tab:** (to save token)
  ```javascript
  if (pm.response.code === 200) {
      pm.environment.set("token", pm.response.json().token);
  }
  ```

### **2. Get Current User (Protected)**
- **Method:** GET
- **URL:** `http://localhost:8080/api/example/me`
- **Authorization:** Bearer Token `{{token}}`

### **3. Hello (Public)**
- **Method:** GET
- **URL:** `http://localhost:8080/api/hello`
- No authorization needed

---

## 🎯 Quick Test Flow

1. **Start your server:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

2. **In Postman:**
   - Run "Login" request
   - Check response - you should get a token
   - Run "Get Current User" request
   - Should work with the saved token!

---

## 💡 Pro Tips

### **Tip 1: Organize with Folders**
- Create folders in your collection:
  - "Auth" (login, register, etc.)
  - "Users" (get current user, update profile)
  - "Projects" (create, list, etc.)

### **Tip 2: Use Pre-request Scripts**
To automatically set headers:
1. Go to Collection → "Pre-request Script" tab
2. Add:
   ```javascript
   pm.request.headers.add({
       key: "Content-Type",
       value: "application/json"
   });
   ```

### **Tip 3: Test Assertions**
Add tests to verify responses:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
});
```

### **Tip 4: Export/Import**
- Export your collection to share with team
- File → Export → Collection v2.1

---

## 🐛 Troubleshooting

### **"Connection refused"**
- Make sure server is running on port 8080
- Check URL is correct: `http://localhost:8080`

### **"401 Unauthorized"**
- Token expired or invalid
- Run Login request again to get new token
- Check token is set in Authorization tab

### **"404 Not Found"**
- Check endpoint URL is correct
- Make sure server is running
- Verify endpoint exists in your code

---

## 📚 Example: Complete Login Flow

1. **Create Collection:** "COLLIDE API"
2. **Create Environment:** "COLLIDE Local"
3. **Create Request:** "Login"
   - POST `http://localhost:8080/api/auth/login`
   - Body: `{"email":"test@example.com","password":"password123"}`
   - Tests: Save token to environment
4. **Create Request:** "Get Current User"
   - GET `http://localhost:8080/api/example/me`
   - Auth: Bearer `{{token}}`
5. **Run Login** → Token saved automatically
6. **Run Get Current User** → Should work!

---

**That's it! Postman is perfect for testing your APIs!** 🎉

