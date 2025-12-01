# Complete Postman Collection - All Available Endpoints

## 📋 All Available APIs to Test

Here are **ALL** the endpoints you can test in Postman:

---

## 🔓 **Public Endpoints** (No Token Required)

### **1. Hello World**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/hello`
- **Headers:** None
- **Body:** None
- **Expected Response:** `"Hello, World!"`

---

### **2. Login**
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
- **Postman Test Script** (to save token):
  ```javascript
  if (pm.response.code === 200) {
      pm.environment.set("token", pm.response.json().token);
      console.log("Token saved!");
  }
  ```

---

### **3. Get File Tree**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/tree`
- **Headers:** None
- **Body:** None
- **Note:** Returns file tree from hardcoded path: `C:\Users\Admin\Desktop\filetree`
- **Expected Response:** File tree structure

---

### **4. Read File**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/file?path=C:\Users\Admin\Desktop\filetree\example.txt`
- **Headers:** None
- **Body:** None
- **Query Params:**
  - `path`: Full path to file
- **Note:** File must be within the root directory
- **Expected Response:**
  ```json
  {
    "path": "C:\\Users\\Admin\\Desktop\\filetree\\example.txt",
    "content": "file content here"
  }
  ```

---

### **5. Write File**
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/file`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "path": "C:\\Users\\Admin\\Desktop\\filetree\\test.txt",
    "content": "Hello from Postman!"
  }
  ```
- **Expected Response:**
  ```json
  {
    "path": "C:\\Users\\Admin\\Desktop\\filetree\\test.txt"
  }
  ```

---

### **6. Create File/Folder**
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/create`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "parent": "C:\\Users\\Admin\\Desktop\\filetree",
    "name": "newfile.txt"
  }
  ```
- **Note:** If name has a dot (.), it's a file. Otherwise, it's a folder.
- **Expected Response:**
  ```json
  {
    "path": "C:\\Users\\Admin\\Desktop\\filetree\\newfile.txt",
    "type": "file"
  }
  ```

---

### **7. Delete File/Folder**
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/delete`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "path": "C:\\Users\\Admin\\Desktop\\filetree\\test.txt"
  }
  ```
- **Expected Response:**
  ```json
  {
    "path": "C:\\Users\\Admin\\Desktop\\filetree\\test.txt"
  }
  ```

---

### **8. Rename File/Folder**
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/rename`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "oldPath": "C:\\Users\\Admin\\Desktop\\filetree\\oldname.txt",
    "newPath": "C:\\Users\\Admin\\Desktop\\filetree\\newname.txt"
  }
  ```
- **Expected Response:**
  ```json
  {
    "oldPath": "C:\\Users\\Admin\\Desktop\\filetree\\oldname.txt",
    "newPath": "C:\\Users\\Admin\\Desktop\\filetree\\newname.txt"
  }
  ```

---

## 🔒 **Protected Endpoints** (Require Token)

**Important:** For all protected endpoints, you need:
- **Authorization Tab:**
  - Type: `Bearer Token`
  - Token: `{{token}}` (from environment variable)

---

### **9. Get Current User (Example)**
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/example/me`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** None
- **Expected Response:**
  ```json
  {
    "userId": 1,
    "email": "test@example.com",
    "message": "This is a protected endpoint! You are authenticated."
  }
  ```

---

### **10. Create Something (Example)**
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/example/create`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body (raw JSON):**
  ```json
  {
    "name": "My Test Item"
  }
  ```
- **Expected Response:**
  ```json
  {
    "userId": 1,
    "name": "My Test Item",
    "message": "Created by user 1"
  }
  ```

---

## 📦 **Postman Collection Structure**

Organize your requests like this:

```
COLLIDE API Collection
├── Auth
│   └── Login
├── Example (Protected)
│   ├── Get Current User
│   └── Create Something
├── File Operations
│   ├── Get File Tree
│   ├── Read File
│   ├── Write File
│   ├── Create File/Folder
│   ├── Delete File/Folder
│   └── Rename File/Folder
└── Public
    └── Hello
```

---

## 🎯 **Testing Flow**

### **Step 1: Setup Environment**
1. Create environment: "COLLIDE Local"
2. Add variable: `token` (leave empty)

### **Step 2: Test Public Endpoints**
1. **Hello** - Should work immediately
2. **Login** - Get token (saves automatically with test script)

### **Step 3: Test Protected Endpoints**
1. **Get Current User** - Should work with saved token
2. **Create Something** - Should work with saved token

### **Step 4: Test File Operations**
1. **Get File Tree** - See what files exist
2. **Create File** - Create a test file
3. **Read File** - Read the file you created
4. **Write File** - Update file content
5. **Rename File** - Rename the file
6. **Delete File** - Delete the file

---

## 💡 **Quick Postman Setup**

### **1. Create Collection**
- Name: "COLLIDE API"
- Description: "All COLLIDE backend endpoints"

### **2. Create Environment**
- Name: "COLLIDE Local"
- Variables:
  - `baseUrl`: `http://localhost:8080`
  - `token`: (empty, auto-filled by login)

### **3. Collection Variables** (Optional)
Add to collection:
- `baseUrl`: `http://localhost:8080`

Then use `{{baseUrl}}/api/auth/login` in URLs

---

## 🔧 **Postman Test Scripts**

### **Login Request - Save Token:**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    console.log("✅ Token saved to environment");
} else {
    console.log("❌ Login failed");
}
```

### **Protected Endpoint - Verify Token Works:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has userId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('userId');
});
```

---

## ⚠️ **Important Notes**

### **File Operations:**
- **Hardcoded Path:** All file operations use: `C:\Users\Admin\Desktop\filetree`
- **Access Denied:** If you get 403, the path is outside the root directory
- **Path Format:** Use Windows paths: `C:\\Users\\Admin\\Desktop\\filetree\\file.txt`

### **Protected Endpoints:**
- **Token Required:** Must run Login first to get token
- **Token Expires:** Tokens expire after 24 hours (default)
- **Invalid Token:** Returns 401 Unauthorized

---

## 🧪 **Complete Test Checklist**

### **Public Endpoints:**
- [ ] GET /api/hello
- [ ] POST /api/auth/login (save token)

### **Protected Endpoints:**
- [ ] GET /api/example/me (with token)
- [ ] POST /api/example/create (with token)
- [ ] GET /api/example/me (without token - should fail)

### **File Operations:**
- [ ] GET /api/tree
- [ ] POST /api/create (create file)
- [ ] GET /api/file?path=... (read file)
- [ ] POST /api/file (write file)
- [ ] POST /api/rename (rename file)
- [ ] POST /api/delete (delete file)

---

## 📝 **Example: Complete Postman Request**

### **Login Request:**
```
Method: POST
URL: http://localhost:8080/api/auth/login
Headers:
  Content-Type: application/json
Body (raw JSON):
  {
    "email": "test@example.com",
    "password": "password123"
  }
Tests:
  if (pm.response.code === 200) {
      pm.environment.set("token", pm.response.json().token);
  }
```

### **Protected Request:**
```
Method: GET
URL: http://localhost:8080/api/example/me
Authorization:
  Type: Bearer Token
  Token: {{token}}
```

---

**That's all the endpoints you can test right now!** 🎉

Start with Login, then test the protected endpoints, then try the file operations!

