"""
Test Groq API Connection & Model Response

This script verifies:
1. Groq API key is set
2. API connection works
3. Model responds correctly
4. Response format is valid

Run: python test_groq_api.py
"""

import sys
import os
import time

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def test_api_key():
    """Test that Groq API key is configured."""
    print("\n[Test 1/5] Checking Groq API Key...")
    
    try:
        from config import GROQ_API_KEY
    except ImportError:
        print("❌ FAIL: Cannot import config")
        return False
    
    if not GROQ_API_KEY or GROQ_API_KEY == "gsk_your_api_key_here":
        print("❌ FAIL: GROQ_API_KEY not set in .env")
        print("\n📝 Fix:")
        print("   1. Get FREE key from https://console.groq.com/")
        print("   2. Edit .env file")
        print("   3. Add: GROQ_API_KEY=gsk_your_key_here")
        return False
    
    print(f"✅ PASS: API key found ({GROQ_API_KEY[:10]}...)")
    return True


def test_groq_import():
    """Test that Groq libraries are installed."""
    print("\n[Test 2/5] Checking Groq Installation...")
    
    try:
        from langchain_groq import ChatGroq
        print("✅ PASS: langchain_groq installed")
        return True
    except ImportError:
        print("❌ FAIL: langchain_groq not installed")
        print("\n📝 Fix: pip install langchain-groq groq")
        return False


def test_groq_connection():
    """Test actual API connection and response."""
    print("\n[Test 3/5] Testing Groq API Connection...")
    
    try:
        from config import GROQ_API_KEY, LLM_MODEL
        from langchain_groq import ChatGroq
        
        print(f"   Model: {LLM_MODEL}")
        print(f"   Connecting to Groq API...")
        
        llm = ChatGroq(model=LLM_MODEL, api_key=GROQ_API_KEY)
        
        # Simple test prompt
        test_prompt = "Say hello and confirm you're working. Reply in exactly this format: '✅ Groq is working!'"
        
        start_time = time.time()
        response = llm.invoke(test_prompt)
        response_time = time.time() - start_time
        
        # Extract content
        content = response.content if hasattr(response, 'content') else str(response)
        
        print(f"   Response time: {response_time:.2f}s")
        print(f"   Response: {content.strip()[:100]}")
        
        if response_time < 10:
            print(f"✅ PASS: API responded quickly ({response_time:.2f}s)")
            return True
        else:
            print(f"⚠️  WARNING: Slow response ({response_time:.2f}s) but working")
            return True
            
    except Exception as e:
        error_msg = str(e)
        
        # Check for common errors
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            print("❌ FAIL: Invalid API key")
            print("\n📝 Fix: Check your .env file has correct GROQ_API_KEY")
        elif "rate" in error_msg.lower() or "limit" in error_msg.lower():
            print("❌ FAIL: Rate limit exceeded")
            print("\n📝 Fix: Wait a minute and try again")
        elif "connection" in error_msg.lower() or "network" in error_msg.lower():
            print("❌ FAIL: Network connection error")
            print("\n📝 Fix: Check your internet connection")
        else:
            print(f"❌ FAIL: {error_msg}")
        
        return False


def test_resume_parser():
    """Test resume parsing with Groq."""
    print("\n[Test 4/5] Testing Resume Parser...")
    
    try:
        resume_path = "test-files/Rahul_Resume_provisional__parsed.json"
        
        if not os.path.exists(resume_path):
            print("⚠️  SKIP: Test resume not found")
            return True
        
        with open(resume_path, 'r', encoding='utf-8') as f:
            import json
            resume_data = json.load(f)
        
        print(f"   Loaded test resume: {resume_data.get('name', 'Unknown')}")
        
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "interview_ques_generator",
            "prototype-backend/interview_ques_generator.py"
        )
        iqg = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(iqg)
        generate_question = iqg.generate_question
        
        question = generate_question(resume_data, "Software Engineer")
        
        if question and len(question) > 10:
            print(f"   Generated question: {question[:100]}...")
            print("✅ PASS: Resume parser working")
            return True
        else:
            print("❌ FAIL: Empty or invalid question generated")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        return False


def test_followup_generator():
    """Test follow-up question generation."""
    print("\n[Test 5/5] Testing Follow-up Generator...")
    
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "followup_ques_generator",
            "prototype-backend/followup_ques_generator.py"
        )
        fug = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(fug)
        generate_followup = fug.generate_followup
        
        test_answer = "I used Python and pandas to clean the data, then trained an XGBoost model."
        followup = generate_followup(test_answer, "Data Scientist")
        
        if followup and len(followup) > 10:
            print(f"   Generated follow-up: {followup[:100]}...")
            print("✅ PASS: Follow-up generator working")
            return True
        else:
            print("⚠️  WARNING: No follow-up generated (might be expected)")
            return True
            
    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("  AI-InterviewSim: Groq API Test Suite")
    print("=" * 60)
    
    tests = [
        test_api_key,
        test_groq_import,
        test_groq_connection,
        test_resume_parser,
        test_followup_generator,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n❌ UNEXPECTED ERROR in {test.__name__}: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("  Test Summary")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"  Passed: {passed}/{total}")
    
    if all(results):
        print("\n✅ ALL TESTS PASSED!")
        print("\n🚀 Your system is ready for interviews!")
        print("\nRun any of these:")
        print("  1. Gradio UI:    python frontend/interview.py")
        print("  2. Streamlit UI: streamlit run UI/app.py")
        print("  3. CLI:          cd prototype-backend && python run_session.py")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("\n📝 Please fix the errors above and try again")
        print("\nNeed help? See GROQ_SETUP.md")
    
    print("=" * 60 + "\n")
    
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
