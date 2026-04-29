# 🧪 Testing Guide

Complete testing setup and commands for **AI-InterviewSim** (Luminal AI).

---

## 📋 Quick Reference

| Test Type | Command | Location |
|-----------|---------|----------|
| **Backend Unit Tests** | `python -m pytest tests/ -v` | Project root |
| **Backend Coverage** | `python -m pytest tests/ --cov=prototype-backend --cov-report=html` | Project root |
| **Backend API Test** | `python test_groq_api.py` | Project root |
| **Frontend Unit Tests** | `npm test` | `frontend-next/` |
| **Frontend Watch Mode** | `npm run test:watch` | `frontend-next/` |
| **Frontend Coverage** | `npm run test:coverage` | `frontend-next/` |
| **Frontend Lint** | `npm run lint` | `frontend-next/` |
| **Full Test Suite** | See [Complete Test Run](#complete-test-run) below | - |

---

## 🐍 Backend Testing

### Prerequisites
```bash
# Install test dependencies (if not already installed)
pip install pytest pytest-cov
```

### Run All Backend Tests
```bash
# From project root (AI-InterviewSim-main/)
python -m pytest tests/ -v
```

### Run Specific Test File
```bash
python -m pytest tests/test_interview.py -v
```

### Run with Coverage Report
```bash
# Terminal coverage report
python -m pytest tests/ --cov=prototype-backend --cov-report=term

# HTML coverage report (opens in browser)
python -m pytest tests/ --cov=prototype-backend --cov-report=html
# Report saved to: htmlcov/index.html
```

### Test Groq API Connection
```bash
# Diagnostic test for Groq API
python test_groq_api.py
```

### Backend Test Structure
```
tests/
└── test_interview.py
    ├── TestVectorMemory      # FAISS semantic search tests
    ├── TestConfig            # Configuration tests
    ├── TestInterviewSession  # Session management tests
    ├── TestResumeParser      # Resume parsing tests
    ├── TestFollowupGenerator # Follow-up question tests
    └── TestIntegration       # End-to-end workflow tests
```

---

## ⚛️ Frontend Testing (Next.js)

### Prerequisites
```bash
# From frontend-next/ directory
cd frontend-next
npm install
```

> Testing libraries already installed: `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`

### Run All Frontend Tests
```bash
# From frontend-next/ directory
npm test
```

### Run Tests in Watch Mode
```bash
# Auto-runs tests on file changes
npm run test:watch
```

### Run Tests with Coverage
```bash
# Generates coverage report
npm run test:coverage

# Report saved to: coverage/lcov-report/index.html
```

### Run Linter
```bash
# Check code quality and formatting
npm run lint
```

### Frontend Test Structure
```
frontend-next/
├── __tests__/
│   ├── Footer.test.tsx      # Component test
│   ├── Navbar.test.tsx      # Component test
│   ├── logger.test.ts       # Utility test
│   └── api.test.ts          # API integration test
├── jest.config.js           # Jest configuration
└── jest.setup.js            # Test setup (imports jest-dom)
```

---

## 🚀 Complete Test Run

### Option 1: Manual Step-by-Step
```bash
# 1. Start in project root
cd C:\Users\krish\Desktop\inter-ai-view\Ai-Interview-sim\AI-InterviewSim-main

# 2. Run backend tests
python -m pytest tests/ -v

# 3. Run Groq API diagnostic
python test_groq_api.py

# 4. Switch to frontend
cd frontend-next

# 5. Run frontend tests
npm test

# 6. Run linter
npm run lint
```

### Option 2: Automated Script (Windows)
Create `run-tests.bat`:
```batch
@echo off
echo ========================================
echo Running AI-InterviewSim Test Suite
echo ========================================
echo.

echo [1/4] Running Backend Tests...
python -m pytest tests/ -v
if errorlevel 1 goto failed

echo.
echo [2/4] Running Groq API Diagnostic...
python test_groq_api.py
if errorlevel 1 goto failed

echo.
echo [3/4] Running Frontend Tests...
cd frontend-next
npm test -- --watchAll=false
if errorlevel 1 goto failed

echo.
echo [4/4] Running Frontend Linter...
npm run lint
if errorlevel 1 goto failed

echo.
echo ========================================
echo All tests passed!
echo ========================================
goto end

:failed
echo.
echo ========================================
echo TESTS FAILED
echo ========================================
exit /b 1

:end
```

### Option 3: Automated Script (Linux/Mac)
Create `run-tests.sh`:
```bash
#!/bin/bash
set -e

echo "========================================"
echo "Running AI-InterviewSim Test Suite"
echo "========================================"

echo ""
echo "[1/4] Running Backend Tests..."
python -m pytest tests/ -v

echo ""
echo "[2/4] Running Groq API Diagnostic..."
python test_groq_api.py

echo ""
echo "[3/4] Running Frontend Tests..."
cd frontend-next
npm test -- --watchAll=false

echo ""
echo "[4/4] Running Frontend Linter..."
npm run lint

echo ""
echo "========================================"
echo "All tests passed!"
echo "========================================"
```

---

## 📊 Test Coverage

### Backend Coverage Goals
| Module | Target Coverage |
|--------|----------------|
| `prototype-backend/interview_session.py` | 80%+ |
| `prototype-backend/resume_parser.py` | 75%+ |
| `prototype-backend/vector_memory.py` | 70%+ |
| `config.py` | 90%+ |

### Frontend Coverage Goals
| Module | Target Coverage |
|--------|----------------|
| `components/` | 70%+ |
| `lib/api.ts` | 80%+ |
| `lib/logger.ts` | 90%+ |
| `context/` | 60%+ |

---

## 🛠️ Writing New Tests

### Backend Test Example
```python
# tests/test_new_feature.py
import pytest
from prototype-backend.some_module import SomeClass

class TestSomeClass:
    def test_basic_functionality(self):
        obj = SomeClass()
        result = obj.do_something()
        assert result == expected_value

    def test_error_handling(self):
        with pytest.raises(ValueError):
            SomeClass(invalid_param=True)
```

### Frontend Test Example
```tsx
// __tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockFn = jest.fn();
    render(<MyComponent onClick={mockFn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

---

## 🐛 Troubleshooting

### Backend Tests
| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: prototype-backend` | Run from project root, not tests/ folder |
| `GROQ_API_KEY not set` | Check `.env` file has valid API key |
| `pytest not found` | Run `pip install pytest pytest-cov` |
| FAISS import error | Run `pip install faiss-cpu` |

### Frontend Tests
| Issue | Solution |
|-------|----------|
| `jest not found` | Run `cd frontend-next && npm install` |
| `Cannot find module` | Check import paths match project structure |
| CSS import errors | `identity-obj-proxy` handles `.css` imports |
| Mock errors | Ensure mocks match actual module exports |

---

## 📁 Test Files Summary

### Backend
- `tests/test_interview.py` — Core backend functionality (285 lines)
- `test_groq_api.py` — API connectivity diagnostic (230 lines)
- `test_resume_endpoint.py` — Resume upload endpoint test

### Frontend
- `__tests__/Footer.test.tsx` — Footer component tests
- `__tests__/Navbar.test.tsx` — Navbar component tests
- `__tests__/logger.test.ts` — Logger utility tests
- `__tests__/api.test.ts` — API client tests

### Config
- `jest.config.js` — Jest configuration
- `jest.setup.js` — Test environment setup

---

## ✅ CI/CD Ready Commands

For GitHub Actions or other CI/CD:

```yaml
# Example GitHub Actions workflow
jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov
      - run: python -m pytest tests/ -v --cov=prototype-backend

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend-next && npm install
      - run: cd frontend-next && npm test -- --watchAll=false
      - run: cd frontend-next && npm run lint
```

---

## 🎯 Test Checklist Before Deployment

- [ ] `python -m pytest tests/ -v` passes
- [ ] `python test_groq_api.py` passes
- [ ] `cd frontend-next && npm test -- --watchAll=false` passes
- [ ] `cd frontend-next && npm run lint` passes
- [ ] `cd frontend-next && npm run build` succeeds
- [ ] `.env` variables are configured

---

*Last updated: April 2026*
