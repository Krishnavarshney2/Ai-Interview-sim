# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your FREE Groq API Key
1. Visit **https://console.groq.com/**
2. Sign up with Google/GitHub (30 seconds)
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_`)

### Step 2: Setup
**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Step 3: Add Your API Key
Edit `.env` file and paste your key:
```
GROQ_API_KEY=gsk_your_key_here
```

### Step 4: Verify
```bash
python config.py
```

Should show: `API Key Set: ✅ Yes`

### Step 5: Run!
```bash
# Option 1: Gradio (Voice + Webcam)
python frontend/interview.py

# Option 2: Streamlit (Chat)
streamlit run UI/app.py

# Option 3: CLI
cd prototype-backend
python run_session.py
```

---

## 🎯 First Interview Walkthrough

1. **Upload Resume**: Select your PDF resume
2. **Enter Role**: e.g., "Software Engineer"
3. **Choose Questions**: 3-5 recommended
4. **Start Interview**: Answer questions naturally
5. **Get Feedback**: Detailed scores + summary

---

## 💡 Pro Tips

- ✅ Be specific in answers for better feedback
- ✅ Use examples from your experience
- ✅ Don't rush - AI tracks response time
- ✅ Try different roles to practice various topics
- ✅ Review feedback to identify weak areas

---

## 🆘 Need Help?

**Common Issues:**

| Problem | Solution |
|---------|----------|
| "GROQ_API_KEY not set" | Edit `.env` and add your key |
| "Module not found" | Run `pip install -r requirements.txt` |
| Resume won't parse | Ensure it's a text-based PDF |
| Voice not working | Check microphone permissions |

**Full Documentation:** See `README.md`

**Setup Guide:** See `GROQ_SETUP.md`

---

## 🎓 Learn More

- **Architecture**: Read `MIGRATION_COMPLETE.md`
- **Configuration**: See `config.py` comments
- **Troubleshooting**: Check `README.md` → Troubleshooting

---

**Ready? Let's ace that interview! 🚀**
