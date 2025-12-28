# SANA - AI Mental Health Companion

A compassionate AI-powered mental health support platform featuring a 3D avatar companion, real-time video consultations, peer support forums, and intelligent conversation powered by **Groq's llama-3.3-70b**.

![SANA](Frontend/public/logo/image.png)

## 🌟 Features

### 🎭 3D Avatar Companion (Ziva)
- Interactive 3D avatar with realistic animations
- Real-time lip-sync with AI-generated speech
- Dynamic facial expressions based on conversation context
- Voice and text interaction support

### 📹 Doctor Connect (WebRTC)
- Peer-to-peer video calls for professional consultations
- Real-time audio/video streaming
- Call controls (mute, camera toggle, end call)
- Mock signaling (ready for production signaling server)

### 💬 AI Chatbot
- Powered by **Groq's llama-3.3-70b-versatile**
- Lightning-fast responses (under 1 second)
- Contextual, empathetic conversations
- Session-based chat history
- Real-time typing indicators

### 🤝 Peer Support Forum
- Anonymous peer support community
- Safe, non-judgmental space
- No gamification or pressure
- Gentle, therapeutic design

### 👤 User Profile
- Personal wellness stats
- Session tracking
- Clean, minimal interface

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Three.js** / **React Three Fiber** for 3D avatar
- **Tailwind CSS** for styling
- **WebRTC** for video calls
- **React Router** for navigation

### Backend
- **FastAPI** (Python)
- **Groq** (llama-3.3-70b-versatile) for LLM - ultra-fast inference
- **Whisper** for speech-to-text
- **Edge TTS** for text-to-speech
- **CORS** enabled for frontend integration

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Groq API Key** (Free at [console.groq.com](https://console.groq.com/keys))

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/SANA.git
cd SANA
```

### 2. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux

# Add your API key to .env
# GROQ_API_KEY=your_api_key_here
```

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd Backend
venv\Scripts\activate  # or source venv/bin/activate
uvicorn main:app --reload --port 3000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🌐 API Endpoints

### Chat Endpoints
- `POST /chat` - Text-based chat with Gemini
- `POST /talk` - Voice input (speech-to-text + LLM + text-to-speech)
- `POST /clear-history` - Clear chat session history

### Request Examples

**Text Chat:**
```bash
POST http://localhost:3000/chat
Content-Type: application/json

{
  "message": "I'm feeling anxious today",
  "sessionId": "default"
}
```

**Response:**
```json
{
  "text": "I hear you. Anxiety can feel overwhelming...",
  "facialExpression": "default",
  "animation": "Thinking",
  "audio": null
}
```

---

## 📁 Project Structure

```
SANA/
├── Backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── .env                # Your API keys (gitignored)
│
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Home with 3D avatar
│   │   │   ├── DoctorConnect.tsx     # WebRTC video calls
│   │   │   ├── PeerSupport.tsx       # Anonymous forum
│   │   │   └── Profile.tsx           # User profile
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   ├── Scene.tsx         # 3D scene setup
│   │   │   │   └── Ziva.tsx          # Avatar model
│   │   │   ├── Layout.tsx            # Shared layout
│   │   │   ├── NavigationMenu.tsx    # Sidebar navigation
│   │   │   ├── VoiceInput.tsx        # Voice recording
│   │   │   └── Chatbot.tsx           # AI chatbot
│   │   ├── services/
│   │   │   ├── ApiService.ts         # Backend API calls
│   │   │   └── webrtcService.ts      # WebRTC logic
│   │   └── App.tsx
│   ├── public/
│   │   ├── logo/
│   │   └── models/                   # 3D avatar files
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## 🎨 Design Philosophy

SANA is designed with mental health users in mind:

- **Calm, Dark Theme** - Easy on the eyes, reduces overstimulation
- **Minimal Interactions** - No overwhelming choices
- **Non-Judgmental Language** - Warm, supportive tone
- **No Gamification** - No likes, scores, or pressure
- **Privacy First** - Anonymous peer support
- **Accessible** - Responsive design, clear typography

---

## 🔐 Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

---

## 🧪 Features in Development

- [ ] Real signaling server for WebRTC (currently mock)
- [ ] User authentication
- [ ] Appointment scheduling
- [ ] Mood tracking and analytics
- [ ] Professional therapist integration
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** for ultra-fast LLM inference
- **Three.js** / **Ready Player Me** for 3D avatar technology
- **FastAPI** for the robust backend framework
- **React Three Fiber** for 3D in React

---

SANA is a support tool, not a replacement for professional mental health care.

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with 💙 by **Kaushal Jindal** for those who need support**
