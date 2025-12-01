# Postman Quick Reference - All Endpoints

## 🔓 Public Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/api/hello` | Hello world | None |
| POST | `/api/auth/login` | Login (get token) | `{"email":"test@example.com","password":"password123"}` |
| GET | `/api/tree` | Get file tree | None |
| GET | `/api/file?path=...` | Read file | None (query param: `path`) |
| POST | `/api/file` | Write file | `{"path":"...","content":"..."}` |
| POST | `/api/create` | Create file/folder | `{"parent":"...","name":"..."}` |
| POST | `/api/delete` | Delete file/folder | `{"path":"..."}` |
| POST | `/api/rename` | Rename file/folder | `{"oldPath":"...","newPath":"..."}` |

## 🔒 Protected Endpoints (Need Token)

| Method | Endpoint | Description | Body | Auth |
|--------|----------|-------------|------|------|
| GET | `/api/example/me` | Get current user | None | Bearer Token |
| POST | `/api/example/create` | Create something | `{"name":"..."}` | Bearer Token |

## 🎯 Quick Setup

1. **Environment Variable:**
   - Name: `token`
   - Value: (auto-filled by login)

2. **Login Test Script:**
   ```javascript
   if (pm.response.code === 200) {
       pm.environment.set("token", pm.response.json().token);
   }
   ```

3. **Use Token:**
   - Authorization → Bearer Token → `{{token}}`

## 📋 Test Order

1. ✅ Login → Get token
2. ✅ Get Current User → Test protected endpoint
3. ✅ File operations → Test file APIs

---

**All endpoints are ready to test!** 🚀

