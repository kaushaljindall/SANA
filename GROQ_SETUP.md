# Quick Setup Guide - Switching to Groq

## ✅ Changes Made

The backend has been migrated from Google Gemini to **Groq** for faster, more reliable LLM responses.

## 🚀 Setup Steps

### 1. Get your FREE Groq API Key
1. Go to: **https://console.groq.com/**
2. Sign up (free, no credit card required)
3. Navigate to: **https://console.groq.com/keys**
4. Click "Create API Key"
5. Copy your key

### 2. Update your `.env` file

In `Backend/.env`, replace:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Install/Update Dependencies

```bash
cd Backend
pip install groq
```

### 4. Start the Backend

```bash
cd Backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

uvicorn main:app --reload --port 3000
```

### 5. Test the Chatbot

1. Start frontend: `cd Frontend && npm run dev`
2. Open app in browser
3. Click "I'm here to listen"
4. Type a message
5. You should get instant responses! ⚡

## 🎯 Benefits of Groq

| Feature | Gemini | Groq |
|---------|--------|------|
| **Response Time** | 2-5 seconds | <1 second |
| **Reliability** | Variable | Consistent |
| **JSON Mode** | Tricky | Native |
| **API Limits** | Rate limited | Very generous |
| **Cost** | Paid after quota | Free tier is huge |

## 🐛 Troubleshooting

**Error: "GROQ_API_KEY not found"**
- Make sure `.env` file exists in `Backend/` folder
- Check that the variable name is exactly `GROQ_API_KEY`
- Restart the backend after changing `.env`

**Error: "I'm having trouble connecting"**
- Check that backend is running on port 3000
- Verify your API key is valid
- Check console logs in terminal

## 📝 What Changed

- `Backend/main.py` - Complete rewrite using Groq client
- `Backend/.env.example` - Updated to GROQ_API_KEY
- `Backend/requirements.txt` - Already had groq package
- `README.md` - Updated documentation
- Frontend - No changes needed!

---

**You're all set!** The chatbot will now respond lightning-fast with Groq! ⚡💙
