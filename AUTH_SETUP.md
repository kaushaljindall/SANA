# Authentication Setup Guide

Complete authentication system with JWT and Google OAuth 2.0 for SANA.

## ✅ What's Included

### Frontend
- ✅ **Login Page** (`/login`)
  - Email/password authentication
  - Google OAuth button
  - Form validation
  - Loading states
  - Error handling

- ✅ **Register Page** (`/register`)
  - Email/password signup
  - Password strength indicator
  - Password confirmation
  - Google OAuth signup
  - Form validation

### Backend
- ✅ **JWT Authentication** endpoints
  - `/auth/register` - Create new account
  - `/auth/login` - Sign in
  - `/auth/me` - Get current user (protected)
  
- ✅ **Google OAuth 2.0**
  - `/auth/google` - Initiate Google login
  - `/auth/google/callback` - Handle callback

- ✅ **Security Features**
  - Password hashing with bcrypt
  - JWT tokens (7-day expiration)
  - Protected routes
  - CORS enabled

---

## 🚀 Quick Setup

### 1. Install Backend Dependencies

```bash
cd Backend
pip install PyJWT bcrypt email-validator
```

### 2. Generate JWT Secret

```bash
# Windows PowerShell
$bytes = New-Object Byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# macOS/Linux
openssl rand -hex 32
```

### 3. Update `.env` File

```env
GROQ_API_KEY=your_groq_key_here

# Required for JWT
SECRET_KEY=paste_your_generated_secret_here

# Optional - for Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### 4. Restart Backend

```bash
cd Backend
uvicorn main:app --reload --port 3000
```

### 5. Test It!

1. Navigate to `http://localhost:5173/register`
2. Create an account
3. Login at `http://localhost:5173/login`
4. You'll be redirected to the home page!

---

## 🔑 Google OAuth Setup (Optional)

### Step 1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Name it "SANA" (or your preference)

### Step 2: Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: Web application
4. **Name**: SANA Web Client
5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   ```
7. Click **Create**
8. Copy your **Client ID** and **Client Secret**

### Step 4: Add to `.env`

```env
GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Step 5: Test Google Login

1. Go to `/login`
2. Click "Continue with Google"
3. Select your Google account
4. You'll be redirected back authenticated!

---

## 📝 How It Works

### Registration Flow

```
1. User enters email/password
2. Frontend → POST /auth/register
3. Backend hashes password with bcrypt
4. Creates user in database
5. Generates JWT token (7-day expiry)
6. Returns token + user data
7. Frontend saves token in localStorage
8. Redirects to home page
```

### Login Flow

```
1. User enters email/password
2. Frontend → POST /auth/login
3. Backend verifies password
4. Generates JWT token
5. Returns token + user data
6. Frontend saves token
7. Redirects to home
```

### Google OAuth Flow

```
1. User clicks "Continue with Google"
2. Redirects to Google OAuth consent
3. User approves
4. Google redirects to /auth/google/callback with code
5. Backend exchanges code for access token
6. Gets user info from Google
7. Creates/finds user
8. Generates JWT token
9. Redirects to frontend with token
10. Frontend saves token
```

### Protected Routes

```typescript
// Frontend - Add to requests
const token = localStorage.getItem('token');
fetch('http://localhost:3000/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Backend - Already protected with HTTPBearer
```

---

## 🔒 Security Features

### ✅ Implemented

- **bcrypt** password hashing (salt rounds: 12)
- **JWT** tokens with expiration (7 days)
- **HTTPS-ready** (works with SSL in production)
- **CORS** configured for your frontend
- **Email validation** with pydantic
- **Password strength** indicator (frontend)

### 🚧 For Production

Add these before deploying:

1. **Real Database** (PostgreSQL/MongoDB)
   - Replace in-memory `users_db` dictionary
   - Use SQLAlchemy or similar ORM

2. **HTTPS Only**
   - Force SSL in production
   - Update OAuth redirect URIs

3. **Rate Limiting**
   - Prevent brute force attacks
   - Use slowapi or similar

4. **Email Verification**
   - Send verification emails
   - Activate accounts after email confirm

5. **Refresh Tokens**
   - Shorter access token expiry (15min)
   - Long-lived refresh tokens (30 days)

6. **Environment Variables**
   - Never commit `.env` to git
   - Use secrets manager in production

---

## 🧪 Testing

### Test Registration

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Protected Route

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🐛 Troubleshooting

**Error: "SECRET_KEY not found"**
- Add `SECRET_KEY` to `.env` file
- Generate with `openssl rand -hex 32`

**Error: "Google OAuth not configured"**
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
- Or skip Google login for now

**Error: "Invalid token"**
- Token expired (7 days)
- User needs to log in again
- Clear localStorage and login again

**Error: "Email already registered"**
- User already exists
- Use different email or login instead

---

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

---

**Your auth system is ready!** 🎉🔐
