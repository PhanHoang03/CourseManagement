# Postman Testing Guide - Authentication API

## Prerequisites

1. **Start the server:**
   ```bash
   cd Backend
   npm run dev
   ```
   Server should run on `http://localhost:5000`

2. **Verify server is running:**
   - Open Postman
   - Create a GET request to: `http://localhost:5000/health`
   - Should return: `{ "status": "ok", ... }`

---

## Testing Endpoints

### 1. Register a New User

**Endpoint:** `POST http://localhost:5000/api/v1/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "address": "123 Main St",
    "role": "trainee"
  }
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "trainee",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the tokens!** You'll need them for protected routes.

---

### 2. Login

**Endpoint:** `POST http://localhost:5000/api/v1/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "trainee"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the tokens again!**

---

### 3. Get Current User (Protected Route)

**Endpoint:** `GET http://localhost:5000/api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <your_access_token_here>
Content-Type: application/json
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJ0cmFpbmVlIn0...
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "address": "123 Main St",
    "role": "trainee",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Test without token:** Should return `401 Unauthorized`

---

### 4. Refresh Access Token

**Endpoint:** `POST http://localhost:5000/api/v1/auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### 5. Change Password (Protected Route)

**Endpoint:** `POST http://localhost:5000/api/v1/auth/change-password`

**Headers:**
```
Authorization: Bearer <your_access_token_here>
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword456"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 6. Logout (Protected Route)

**Endpoint:** `POST http://localhost:5000/api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <your_access_token_here>
Content-Type: application/json
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Postman Collection Setup

### Create a Postman Environment

1. Click **Environments** → **+** (Create Environment)
2. Name it: `Course Management API`
3. Add variables:
   - `base_url`: `http://localhost:5000`
   - `access_token`: (leave empty, will be set automatically)
   - `refresh_token`: (leave empty, will be set automatically)

### Use Environment Variables

Instead of hardcoding URLs, use:
- `{{base_url}}/api/v1/auth/register`
- `{{base_url}}/api/v1/auth/login`

### Auto-save Tokens (Using Tests)

Add this to your **Login** request's **Tests** tab:

```javascript
// Parse response
const response = pm.response.json();

// Save tokens to environment
if (response.data && response.data.accessToken) {
    pm.environment.set("access_token", response.data.accessToken);
    pm.environment.set("refresh_token", response.data.refreshToken);
    console.log("Tokens saved to environment");
}
```

Then in protected routes, use:
```
Authorization: Bearer {{access_token}}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Email already registered"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "path": "body.password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## Testing Checklist

- [ ] Server is running (`/health` endpoint works)
- [ ] Register a new user (save tokens)
- [ ] Try to register with same email (should fail with 409)
- [ ] Login with correct credentials (save tokens)
- [ ] Login with wrong password (should fail with 401)
- [ ] Get current user with valid token (should succeed)
- [ ] Get current user without token (should fail with 401)
- [ ] Get current user with invalid token (should fail with 401)
- [ ] Refresh token with valid refresh token
- [ ] Change password with correct current password
- [ ] Change password with wrong current password (should fail)
- [ ] Logout (should succeed)

---

## Quick Test Script

Here's a quick test sequence:

1. **Register:**
   ```json
   POST /api/v1/auth/register
   {
     "username": "testuser",
     "email": "test@test.com",
     "password": "Test1234",
     "firstName": "Test",
     "lastName": "User",
     "role": "trainee"
   }
   ```

2. **Login:**
   ```json
   POST /api/v1/auth/login
   {
     "email": "test@test.com",
     "password": "Test1234"
   }
   ```

3. **Get Me (use token from login):**
   ```
   GET /api/v1/auth/me
   Authorization: Bearer <token>
   ```

---

## Tips

1. **Use Postman Collections:** Create a collection for "Authentication" to organize all requests
2. **Save Responses:** Use Postman's "Save Response" feature to keep examples
3. **Use Variables:** Store tokens in environment variables for easy reuse
4. **Test Error Cases:** Don't just test success cases - test validation errors, unauthorized access, etc.
5. **Check Console:** Watch your server console for any errors or logs

---

## Troubleshooting

**Server not starting?**
- Check if port 5000 is already in use
- Verify `.env` file exists and has `DATABASE_URL`
- Check database connection

**401 Unauthorized?**
- Verify token is in format: `Bearer <token>` (with space)
- Check if token is expired
- Verify JWT_SECRET in `.env`

**500 Internal Server Error?**
- Check server console for error details
- Verify database is running and accessible
- Check Prisma client is generated: `npm run prisma:generate`

**Validation Errors?**
- Check request body matches schema exactly
- Verify all required fields are present
- Check field types (strings, numbers, etc.)

---

Happy Testing! 🚀
