#!/bin/bash
# ============================================
# AI-InterviewSim Setup Script (Linux/Mac)
# ============================================

echo ""
echo "============================================"
echo "  AI-InterviewSim Setup"
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://www.python.org/downloads/"
    exit 1
fi

echo "[1/5] Python found! ($(python3 --version))"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "[2/5] Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "************ IMPORTANT ************"
    echo "Please edit .env and add your GROQ_API_KEY"
    echo "Get your FREE key from: https://console.groq.com/"
    echo "***********************************"
    echo ""
    read -p "Press Enter to continue..."
else
    echo "[2/5] .env file already exists"
fi

echo ""
echo "[3/5] Installing dependencies..."
echo "This may take a few minutes..."
echo ""

pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "[4/5] Testing configuration..."
python3 config.py
if [ $? -ne 0 ]; then
    echo ""
    echo "[WARNING] Configuration test failed"
    echo "Make sure GROQ_API_KEY is set in .env"
    exit 1
fi

echo ""
echo "[5/5] Setup complete!"
echo ""
echo "============================================"
echo "  How to Run:"
echo "============================================"
echo ""
echo "Option 1 - Gradio UI (Voice + Webcam):"
echo "  python3 frontend/interview.py"
echo ""
echo "Option 2 - Streamlit UI (Chat-based):"
echo "  streamlit run UI/app.py"
echo ""
echo "Option 3 - CLI (Terminal only):"
echo "  cd prototype-backend"
echo "  python3 run_session.py"
echo ""
echo "============================================"
echo ""
