@echo off
REM ============================================
REM AI-InterviewSim Full System Test
REM ============================================

echo.
echo ============================================
echo   Testing AI-InterviewSim
echo ============================================
echo.

echo [Test 1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python not found
    pause
    exit /b 1
)
echo [PASS] Python found
echo.

echo [Test 2/6] Checking .env file...
if not exist ".env" (
    echo [FAIL] .env file not found
    echo Please run setup.bat first or create .env from .env.example
    pause
    exit /b 1
)
echo [PASS] .env file exists
echo.

echo [Test 3/6] Testing configuration...
python config.py
if errorlevel 1 (
    echo [FAIL] Configuration test failed
    pause
    exit /b 1
)
echo.

echo [Test 4/6] Checking dependencies...
python -c "import langchain_groq; import groq; import fitz; import gradio; import streamlit; import faiss" 2>nul
if errorlevel 1 (
    echo [FAIL] Some dependencies are missing
    echo Installing missing packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [FAIL] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [PASS] All dependencies installed
)
echo.

echo [Test 5/6] Testing imports...
python -c "import sys; sys.path.insert(0, '.'); from config import LLM_MODEL, GROQ_API_KEY; print(f'LLM Model: {LLM_MODEL}'); print(f'API Key: {GROQ_API_KEY[:10]}...')" 2>nul
if errorlevel 1 (
    echo [FAIL] Import test failed
    pause
    exit /b 1
)
echo [PASS] Imports working
echo.

echo [Test 6/6] Checking test resume...
if exist "test-files\Rahul_Resume_provisional__parsed.json" (
    echo [PASS] Test resume found
) else (
    echo [WARNING] Test resume not found
)
echo.

echo ============================================
echo   All Pre-Flight Checks Passed!
echo ============================================
echo.
echo You can now run any of these:
echo.
echo 1. Gradio UI:       python frontend/interview.py
echo 2. Streamlit UI:    streamlit run UI/app.py
echo 3. CLI:             cd prototype-backend ^&^& python run_session.py
echo.
echo ============================================
echo.
pause
