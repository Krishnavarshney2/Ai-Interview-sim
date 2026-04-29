@echo off
REM ============================================
REM AI-InterviewSim Setup Script (Windows)
REM ============================================

echo.
echo ============================================
echo   AI-InterviewSim Setup
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/5] Python found!
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [2/5] Creating .env file from template...
    copy .env.example .env >nul
    echo.
    echo ************ IMPORTANT ************
    echo Please edit .env and add your GROQ_API_KEY
    echo Get your FREE key from: https://console.groq.com/
    echo ***********************************
    echo.
    pause
) else (
    echo [2/5] .env file already exists
)

echo.
echo [3/5] Installing dependencies...
echo This may take a few minutes...
echo.

pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [4/5] Testing configuration...
python config.py
if errorlevel 1 (
    echo.
    echo [WARNING] Configuration test failed
    echo Make sure GROQ_API_KEY is set in .env
    pause
    exit /b 1
)

echo.
echo [5/5] Setup complete!
echo.
echo ============================================
echo   How to Run:
echo ============================================
echo.
echo Option 1 - Gradio UI ^(Voice + Webcam^):
echo   python frontend/interview.py
echo.
echo Option 2 - Streamlit UI ^(Chat-based^):
echo   streamlit run UI/app.py
echo.
echo Option 3 - CLI ^(Terminal only^):
echo   cd prototype-backend
echo   python run_session.py
echo.
echo ============================================
echo.
pause
