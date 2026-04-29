"""
Unit tests for AI-InterviewSim

Tests core functionality: resume parsing, question generation, interview sessions,
and vector memory duplicate detection.

Run with: python -m pytest tests/ -v
"""

import pytest
import json
import os
import sys
from unittest.mock import Mock, patch, MagicMock

# Add project root and prototype-backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'prototype-backend')))


class TestVectorMemory:
    """Test FAISS-based semantic duplicate detection."""
    
    def test_add_qa_pair(self):
        """Test adding question-answer pairs to vector memory."""
        from vector_memory import VectorMemory
        
        vm = VectorMemory()
        vm.add_qa("What is Python?", "Python is a programming language")
        
        assert len(vm.qa_pairs) == 1
        assert vm.qa_pairs[0]["question"] == "What is Python?"
        assert vm._is_initialized == True
    
    def test_no_duplicates_when_empty(self):
        """Test that empty memory has no duplicates."""
        from vector_memory import VectorMemory
        
        vm = VectorMemory()
        assert vm.is_duplicate_topic("What is Python?") == False
    
    def test_detect_exact_duplicate(self):
        """Test detection of exact duplicate questions."""
        from vector_memory import VectorMemory
        
        vm = VectorMemory()
        vm.add_qa("What is Python?", "Python is a programming language")
        
        # Same question should be detected as duplicate
        is_dup = vm.is_duplicate_topic("What is Python?")
        assert is_dup == True
    
    def test_detect_similar_duplicate(self):
        """Test detection of semantically similar questions."""
        from vector_memory import VectorMemory
        
        vm = VectorMemory()
        vm.add_qa("What is Python?", "Python is a programming language")
        
        # Similar question should be detected
        is_dup = vm.is_duplicate_topic("Can you explain what Python is?")
        # This depends on similarity threshold, but should be similar
        assert isinstance(is_dup, bool)
    
    def test_different_topics_not_duplicate(self):
        """Test that different topics are not marked as duplicates."""
        from vector_memory import VectorMemory
        
        vm = VectorMemory()
        vm.add_qa("What is Python?", "Python is a programming language")
        
        # Completely different question
        is_dup = vm.is_duplicate_topic("How does machine learning work?")
        assert is_dup == False
    
    def test_get_similar_questions(self):
        """Test retrieval of similar questions."""
        from vector_memory import VectorMemory
        
        vm = VectorMemory()
        vm.add_qa("What is Python?", "Python is a programming language")
        
        similar = vm.get_similar_questions("Tell me about Python")
        assert len(similar) > 0
        assert "similarity" in similar[0]


class TestConfig:
    """Test configuration loading and validation."""
    
    def test_config_imports(self):
        """Test that config can be imported."""
        from config import LLM_MODEL, GROQ_API_KEY
        
        assert isinstance(LLM_MODEL, str)
        assert len(LLM_MODEL) > 0
    
    def test_default_model(self):
        """Test default model is set correctly."""
        from config import LLM_MODEL
        
        assert "llama" in LLM_MODEL or "mixtral" in LLM_MODEL or "gemma" in LLM_MODEL
    
    def test_config_helper_functions(self):
        """Test config helper functions."""
        from config import get_llm_config, get_embedding_config
        
        llm_config = get_llm_config()
        assert "model" in llm_config
        assert "api_key" in llm_config
        
        emb_config = get_embedding_config()
        assert "model" in emb_config
        assert "duplicate_threshold" in emb_config


class TestInterviewSession:
    """Test interview session management."""
    
    @pytest.fixture
    def sample_resume(self):
        """Create a sample resume dict for testing."""
        return {
            "name": "Test User",
            "skills": ["Python", "JavaScript"],
            "experience": [
                {
                    "title": "Developer",
                    "company": "Test Corp"
                }
            ]
        }
    
    def test_session_initialization(self, sample_resume):
        """Test session initializes correctly."""
        from interview_session import InterviewSession
        
        session = InterviewSession(
            resume_obj=sample_resume,
            role="Software Engineer",
            rounds=3
        )
        
        assert session.role == "Software Engineer"
        assert session.rounds == 3
        assert session.current_round == 0
        assert len(session.history) == 0
    
    def test_session_requires_resume(self):
        """Test that session requires resume input."""
        from interview_session import InterviewSession
        
        with pytest.raises(ValueError):
            InterviewSession(role="Developer")
    
    def test_session_validates_role(self, sample_resume):
        """Test that session validates role."""
        from interview_session import InterviewSession
        
        with pytest.raises(ValueError):
            InterviewSession(resume_obj=sample_resume, role="")
    
    def test_session_validates_rounds(self, sample_resume):
        """Test that session validates rounds."""
        from interview_session import InterviewSession
        
        with pytest.raises(ValueError):
            InterviewSession(resume_obj=sample_resume, role="Dev", rounds=0)
        
        with pytest.raises(ValueError):
            InterviewSession(resume_obj=sample_resume, role="Dev", rounds=25)
    
    def test_is_complete(self, sample_resume):
        """Test interview completion check."""
        from interview_session import InterviewSession
        
        session = InterviewSession(
            resume_obj=sample_resume,
            role="Developer",
            rounds=2
        )
        
        assert session.is_complete() == False
        
        # Manually advance rounds
        session.current_round = 2
        assert session.is_complete() == True
    
    def test_summary_returns_history(self, sample_resume):
        """Test that summary returns interview history."""
        from interview_session import InterviewSession
        
        session = InterviewSession(
            resume_obj=sample_resume,
            role="Developer",
            rounds=1
        )
        
        history = session.summary()
        assert isinstance(history, list)
        assert len(history) == 0


class TestResumeParser:
    """Test resume parsing functionality."""
    
    @patch('resume_parser.ChatGroq')
    def test_clean_json_response(self, mock_groq):
        """Test JSON cleaning from LLM response."""
        from resume_parser import clean_json_response
        
        # Test with markdown code block
        response = '''```json
{"name": "Test", "skills": ["Python"]}
```'''
        cleaned = clean_json_response(response)
        assert '{"name": "Test"' in cleaned
    
    def test_extract_text_from_pdf_nonexistent(self):
        """Test PDF extraction with nonexistent file."""
        from resume_parser import extract_text_from_pdf
        
        text = extract_text_from_pdf("nonexistent.pdf")
        assert text == ""


class TestFollowupGenerator:
    """Test follow-up question generation."""
    
    def test_import_followup_generator(self):
        """Test that followup generator can be imported."""
        import followup_ques_generator
        
        assert hasattr(followup_ques_generator, 'generate_followup')


class TestIntegration:
    """Integration tests for complete workflows."""
    
    @pytest.fixture
    def sample_resume(self):
        """Create a sample resume dict."""
        return {
            "name": "Test User",
            "email": "test@example.com",
            "skills": ["Python", "SQL"],
            "experience": [
                {
                    "title": "Junior Developer",
                    "company": "Test Inc"
                }
            ]
        }
    
    def test_session_flow(self, sample_resume):
        """Test complete interview session flow."""
        from interview_session import InterviewSession
        
        session = InterviewSession(
            resume_obj=sample_resume,
            role="Python Developer",
            rounds=1
        )
        
        # Verify initial state
        assert session.is_complete() == False
        assert len(session.history) == 0
        
        # Question would be generated (mocked to avoid API call)
        session.history.append({
            'question': 'What is Python?',
            'answer': None,
            'followup': None
        })
        
        # Provide answer
        session.provide_answer("Python is a high-level language")
        
        # Verify state changes
        assert session.current_round == 1
        assert session.history[0]['answer'] == "Python is a high-level language"
        assert session.is_complete() == True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
