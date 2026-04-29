# 🎤 AI-InterviewSim — Smart Mock Interview Platform

**AI-powered mock interview platform** that helps job seekers practice with personalized, intelligent interviews. Uses **Groq** (lightning-fast LLM inference), resume analysis, and role-specific question generation with detailed feedback.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Groq](https://img.shields.io/badge/LLM-Groq-orange.svg)](https://groq.com/)
[![LangChain](https://img.shields.io/badge/Framework-LangChain-green.svg)](https://langchain.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🎯 Core Features
- **AI-Powered Interviews**: Dynamic, personalized questions based on your resume
- **Resume Parsing**: Automatic PDF resume analysis with LLM extraction
- **Role-Specific Mode**: Tailored interviews for any job role
- **Conversation Memory**: AI remembers your answers and avoids repeating topics
- **Follow-up Questions**: Intelligent probing for incomplete or unclear answers
- **Detailed Feedback**: Scored evaluation across 6 parameters + summary

### 🚀 Advanced Features
- **Voice Interaction**: Speech-to-text and text-to-speech support
- **Webcam Attention Tracking**: Monitor focus and engagement during interview
- **Multiple UI Options**: Gradio (voice), Streamlit (chat), or CLI (terminal)
- **Semantic Duplicate Detection**: FAISS embeddings prevent similar questions
- **Production-Ready**: Error handling, retry logic, logging, type hints

---

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### 1. Get FREE Groq API Key
- Go to: **https://console.groq.com/**
- Sign up (30 seconds with Google/GitHub)
- Create API key (starts with `gsk_`)

#### 2. Clone & Configure
```bash
# Clone repository
git clone <repo-url>
cd AI-InterviewSim-main

# Create environment file
cp .env.example .env  # Linux/Mac
Copy-Item .env.example .env  # Windows

# Edit .env and add your API key
# GROQ_API_KEY=gsk_your_key_here
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Verify Setup
```bash
python config.py
```

Expected output:
```
⚙️  AI-InterviewSim Configuration
==================================================
  LLM Provider:     Groq
  LLM Model:        llama-3.1-70b-versatile
  API Key Set:      ✅ Yes
  ...
==================================================
```

---

## 🎮 Running the App

### Option 1: Gradio UI (Voice + Webcam)
**Best for:** Realistic interview experience with voice interaction

```bash
python frontend/interview.py
```

Opens at: **http://localhost:7860**

**Features:**
- 🎤 Voice-based Q&A
- 📷 Webcam feed display
- 📊 Attention tracking visualization
- 🎯 Instant feedback generation

---

### Option 2: Streamlit UI (Chat-based)
**Best for:** Clean, chat-based interface (like real chat interviews)

```bash
streamlit run UI/app.py
```

Opens at: **http://localhost:8501**

**Features:**
- 💬 Modern chat interface
- 📄 Direct PDF resume upload
- 📊 Visual feedback scores
- 📋 Full transcript export

---

### Option 3: CLI (Terminal)
**Best for:** Quick testing, development, low-resource systems

```bash
cd prototype-backend
python run_session.py
```

**Features:**
- ⌨️ Text-based interview
- 🎤 Optional voice input
- 📊 Attention tracking
- 📝 Console output

---

## ⚙️ Configuration

All settings are in **`.env`** — edit to customize:

```env
# LLM Configuration
GROQ_API_KEY=gsk_your_key_here
LLM_MODEL=llama-3.1-70b-versatile
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1024

# Available Groq Models:
#   - llama-3.1-70b-versatile (recommended, best quality)
#   - llama-3.1-8b-instant (ultra-fast)
#   - mixtral-8x7b-32768 (balanced)
#   - gemma2-9b-it (Google's Gemma)
```

### Change Model
Simply update `LLM_MODEL` in `.env`:
```env
LLM_MODEL=llama-3.1-8b-instant  # Faster, lower quality
```

No code changes needed!

---

## 🏗️ Architecture

```
User Interface Layer
├─ Gradio UI (Voice + Webcam)
├─ Streamlit UI (Chat)
└─ CLI (Terminal)

Core Logic Layer
├─ Resume Parser (PyMuPDF + Groq)
├─ Question Generator (Groq/LangChain)
├─ Follow-up Generator (Groq)
├─ InterviewSession (orchestrator)
└─ Memory System (ChatHistory + FAISS)

Utility Layer
├─ Speech-to-Text (Whisper)
├─ Text-to-Speech (gTTS)
└─ Attention Tracker (OpenCV + MediaPipe)
```

---

## 📊 How It Works

1. **Upload Resume** → PDF parsed to structured JSON via LLM
2. **Select Role** → AI tailors questions to job requirements
3. **Interview Begins** → Questions generated based on resume + role
4. **Answer Questions** → Voice or text input accepted
5. **Follow-ups** → AI probes deeper if answers are incomplete
6. **Generate Feedback** → Comprehensive scoring across 6 dimensions

---

## 🔧 Project Structure

```
AI-InterviewSim-main/
├── backend/                    # Core backend modules
│   ├── resume-parser.py       # PDF resume parser
│   ├── interview_ques_generator.py
│   ├── followup_ques_generator.py
│   ├── interview_session.py   # Main orchestrator
│   ├── memory_interview_chain.py
│   └── vector_memory.py       # FAISS semantic memory
│
├── prototype-backend/         # Enhanced backend with voice/attention
│   └── (same files, extended features)
│
├── frontend/
│   └── interview.py           # Gradio UI (voice-based)
│
├── UI/
│   └── app.py                 # Streamlit UI (chat-based)
│
├── utils/
│   ├── speech_to_text.py      # Whisper integration
│   ├── text_to_speech.py      # gTTS integration
│   └── attention_tracker.py   # OpenCV + MediaPipe
│
├── config.py                  # Centralized configuration
├── requirements.txt           # Python dependencies
├── .env.example              # Environment template
└── setup.bat / setup.sh      # Automated setup scripts
```

---

## 🧪 Development

### Run Tests
```bash
python -m pytest tests/
```

### Check Logs
Logs are stored in `logs/` directory:
```bash
tail -f logs/interview_sim_*.log
```

### Add New Features
1. Update `config.py` for new settings
2. Add logic to appropriate backend module
3. Update UI in `frontend/` or `UI/`
4. Add tests to `tests/`

---

## 🆘 Troubleshooting

### ❌ "GROQ_API_KEY not set"
```bash
# Check .env exists
ls .env  # Linux/Mac
dir .env  # Windows

# Make sure it contains:
GROQ_API_KEY=gsk_...
```

### ❌ "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### ❌ "Rate limit exceeded"
- Groq free tier: ~30 requests/minute
- Wait a few seconds and retry
- Upgrade to paid tier for higher limits

### ❌ Resume parsing fails
- Ensure PDF is text-based (not scanned image)
- Try a different PDF format
- Check that resume has standard sections

### ❌ Voice not working
```bash
# Verify audio dependencies
pip install sounddevice scipy openai-whisper pydub simpleaudio
```

---

## 📈 Roadmap

- [ ] **User Dashboard**: Track interview history and progress
- [ ] **Coding Editor**: LeetCode-style practice problems
- [ ] **Behavioral Analysis**: Confidence scoring from webcam
- [ ] **Voice Duplex**: Full real-time voice conversation
- [ ] **Multi-language Support**: Interviews in different languages
- [ ] **Export Options**: PDF/JSON interview reports
- [ ] **Mobile App**: React Native companion app

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Rahul Prajapati**  
B.Tech CSE | AI & LLM Enthusiast

- GitHub: [@rahulprajapati08](https://github.com/rahulprajapati08)
- LinkedIn: [rahul-prajapati](https://linkedin.com/in/rahul-prajapati-280166257)

---

## 🙏 Acknowledgments

- **Groq** for lightning-fast LLM inference
- **LangChain** for excellent orchestration framework
- **HuggingFace** for embedding models
- **OpenAI Whisper** for speech recognition

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ for job seekers everywhere

</div>
