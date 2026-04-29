# 🚀 Groq API Setup Guide

## Step 1: Get Your FREE Groq API Key

1. Go to **https://console.groq.com/**
2. Sign up with Google/GitHub (takes 30 seconds)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Copy the key (starts with `gsk_`)

## Step 2: Create Your `.env` File

1. In the project root (`AI-InterviewSim-main/`), create a file named `.env`
2. Copy the contents from `.env.example`:

```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# Linux/Mac:
cp .env.example .env
```

3. Open `.env` and replace `gsk_your_api_key_here` with your actual key:

```
GROQ_API_KEY=gsk_ABC123XYZ_your_actual_key_here
```

## Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 4: Test Configuration

```bash
python config.py
```

You should see:
```
⚙️  AI-InterviewSim Configuration
==================================================
  LLM Provider:     Groq
  LLM Model:        llama-3.1-70b-versatile
  API Key Set:      ✅ Yes
  ...
```

## Step 5: Run the App

### Option A: Gradio UI (Voice + Webcam)
```bash
python frontend/interview.py
```
Opens at: http://localhost:7860

### Option B: Streamlit UI (Chat-based)
```bash
streamlit run UI/app.py
```
Opens at: http://localhost:8501

### Option C: CLI (Terminal only)
```bash
cd prototype-backend
python run_session.py
```

## Available Groq Models

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| `llama-3.1-70b-versatile` | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | **Recommended** |
| `llama-3.1-8b-instant` | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | Ultra-fast testing |
| `mixtral-8x7b-32768` | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Balanced |
| `gemma2-9b-it` | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Google's model |

To change model, edit `.env`:
```
LLM_MODEL=llama-3.1-8b-instant
```

## Troubleshooting

### ❌ "GROQ_API_KEY not set" error
- Make sure `.env` file exists in project root
- Check that `GROQ_API_KEY=gsk_...` line is present
- Restart your terminal/Python session

### ❌ "ModuleNotFoundError: langchain_groq"
```bash
pip install langchain-groq groq
```

### ❌ "Rate limit exceeded"
- Groq free tier has rate limits
- Wait a few seconds and retry
- Consider upgrading to paid tier

## Benefits of Groq vs Ollama

| Feature | Ollama (Old) | Groq (New) |
|---------|-------------|-----------|
| **Speed** | Slow (local GPU) | ⚡ Lightning fast (cloud) |
| **Setup** | Install Ollama + download models | Just API key |
| **Quality** | Varies by local model | Consistent, high-quality |
| **RAM** | 4-8GB local models | 0GB (cloud-based) |
| **Cost** | Free but hardware-heavy | **FREE tier** + generous limits |
| **Models** | Limited | Llama 3, Mixtral, Gemma |

## Next Steps

1. ✅ Get Groq API key
2. ✅ Create `.env` file
3. ✅ Install dependencies
4. ✅ Run `python config.py` to verify
5. 🎯 Start interviewing!
