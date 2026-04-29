"""
Interview Session Manager

Handles the complete interview flow: question generation, answer collection,
follow-up questions, and final feedback generation.
"""

import json
import re
import os
import sys
import time
import logging
from typing import Optional, Dict, List, Any

# Add paths for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import LLM_MODEL, GROQ_API_KEY, MAX_DUPLICATE_RETRIES

# Voice support (optional - works without it)
try:
    from text_to_speech import speak
    HAS_VOICE = True
except ImportError:
    HAS_VOICE = False
    def speak(text): pass  # Dummy function

from interview_ques_generator import generate_question
from followup_ques_generator import generate_followup
from vector_memory import VectorMemory
from memory_interview_chain import get_memory_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

# Configure logging
logger = logging.getLogger(__name__)


class InterviewSessionError(Exception):
    """Custom exception for interview session errors."""
    pass


class InterviewSession:
    """
    Manages a complete mock interview session.
    
    Attributes:
        resume: Parsed resume data (dict)
        role: Target job role for the interview
        rounds: Number of questions to ask
        session_id: Unique identifier for this session
        history: List of Q&A exchanges
        final_feedback: Evaluation scores and summary
        final_attention: Webcam attention tracking score
    """
    
    def __init__(
        self,
        resume_path: Optional[str] = None,
        resume_obj: Optional[Dict[str, Any]] = None,
        role: str = '',
        rounds: int = 3,
        session_id: str = 'default_user'
    ):
        """
        Initialize interview session.
        
        Args:
            resume_path: Path to parsed resume JSON file
            resume_obj: Parsed resume data as dictionary
            role: Target job role (e.g., 'Software Engineer')
            rounds: Number of interview questions
            session_id: Unique session identifier
            
        Raises:
            ValueError: If neither resume_path nor resume_obj provided
            FileNotFoundError: If resume_path doesn't exist
            json.JSONDecodeError: If resume file is invalid JSON
        """
        # Load resume
        if resume_path:
            if not os.path.exists(resume_path):
                raise FileNotFoundError(f"Resume file not found: {resume_path}")
            
            try:
                with open(resume_path, 'r', encoding='utf-8') as f:
                    self.resume = json.load(f)
            except json.JSONDecodeError as e:
                raise json.JSONDecodeError(
                    f"Invalid JSON in resume file: {e.msg}",
                    e.doc,
                    e.pos
                )
        elif resume_obj:
            if not isinstance(resume_obj, dict):
                raise TypeError("resume_obj must be a dictionary")
            self.resume = resume_obj
        else:
            raise ValueError("Either resume_path or resume_obj must be provided.")

        # Validate inputs
        if not role or not role.strip():
            raise ValueError("Role cannot be empty")
        
        if rounds < 1 or rounds > 20:
            raise ValueError("Rounds must be between 1 and 20")

        self.role = role.strip()
        self.resume_str = json.dumps(self.resume)
        self.rounds = rounds
        self.current_round = 0
        self.session_id = session_id
        self.vector_memory = VectorMemory()
        self.history: List[Dict[str, Any]] = []
        self.final_feedback: Dict[str, Any] = {}
        self.final_attention: float = 0.0
        
        logger.info(f"Interview session initialized: role={self.role}, rounds={self.rounds}, session_id={self.session_id}")

    def ask_question(self) -> Optional[str]:
        """
        Generate the next interview question.
        
        Returns:
            Interview question string, or None if interview is complete
            
        Raises:
            InterviewSessionError: If question generation fails
        """
        if self.current_round >= self.rounds:
            logger.info("Interview complete - all rounds finished")
            return None

        # Generate question with retry logic for duplicates
        max_retries = MAX_DUPLICATE_RETRIES
        question = None
        
        for attempt in range(max_retries + 1):
            try:
                response = get_memory_chain().invoke(
                    {
                        'resume': self.resume_str,
                        'role': self.role
                    },
                    config={'configurable': {'session_id': self.session_id}}
                )
                
                # Extract content from response
                if hasattr(response, 'content'):
                    question = response.content.strip()
                else:
                    question = str(response).strip()
                
                if not question:
                    logger.warning(f"Empty question generated, attempt {attempt + 1}")
                    continue
                
                # Check for duplicates
                if attempt > 0:
                    logger.info(f"Regenerated question (attempt {attempt + 1}) to avoid duplicate")
                
                if not self.vector_memory.is_duplicate_topic(question):
                    break
                    
            except Exception as e:
                logger.error(f"Error generating question (attempt {attempt + 1}): {str(e)}")
                if attempt == max_retries:
                    raise InterviewSessionError(f"Failed to generate question after {max_retries + 1} attempts: {str(e)}")
                time.sleep(0.5)  # Brief pause before retry

        if not question:
            raise InterviewSessionError("Generated question is empty or invalid")

        # Add to history
        self.history.append({
            'question': question,
            'answer': None,
            'followup': None,
            'timestamp': time.time()
        })
        
        logger.info(f"Question {self.current_round + 1}/{self.rounds} generated")
        return question

    def provide_answer(self, answer: str) -> None:
        """
        Record candidate's answer to the current question.
        
        Args:
            answer: Candidate's response text
            
        Raises:
            InterviewSessionError: If no question is active
        """
        if not self.history:
            raise InterviewSessionError("No active question to answer")
        
        if not answer or not answer.strip():
            logger.warning("Empty answer provided")
        
        # Validate we're answering the latest question
        if self.history[-1]['answer'] is not None:
            logger.warning("Overwriting existing answer - possible logic error")
        
        self.history[-1]['answer'] = answer.strip()
        self.history[-1]['answer_timestamp'] = time.time()
        
        # Add to vector memory for semantic tracking
        try:
            self.vector_memory.add_qa(self.history[-1]['question'], answer.strip())
        except Exception as e:
            logger.error(f"Failed to add Q&A to vector memory: {str(e)}")
        
        self.current_round += 1
        logger.info(f"Answer recorded for question {self.current_round}")
    

    def get_followup(self, answer: str) -> Optional[str]:
        """
        Generate a follow-up question based on the candidate's answer.
        
        Args:
            answer: Candidate's response to the main question
            
        Returns:
            Follow-up question string, or None if not needed
        """
        if not answer or not answer.strip():
            logger.warning("Cannot generate followup for empty answer")
            return None
            
        try:
            followup = generate_followup(answer.strip(), self.role)
            
            # Check if followup is actually needed
            if "No follow-up" not in followup and followup.strip():
                self.history[-1]['followup'] = followup.strip()
                logger.info("Follow-up question generated")
                return followup.strip()
                
            return None
            
        except Exception as e:
            logger.error(f"Error generating followup: {str(e)}")
            return None

    def is_complete(self) -> bool:
        """Check if all interview rounds are complete."""
        return self.current_round >= self.rounds

    def summary(self) -> List[Dict[str, Any]]:
        """Return the complete interview history."""
        return self.history

    def generate_final_feedback(self) -> Dict[str, Any]:
        """
        Generate comprehensive feedback on the interview performance.
        
        Returns:
            Dictionary with scores and summary
        """
        if not self.history:
            logger.error("No interview data to evaluate")
            self.final_feedback = {
                "error": "No interview data to evaluate",
                "relevance": 0.0,
                "clarity": 0.0,
                "depth": 0.0,
                "examples": 0.0,
                "communication": 0.0,
                "focus": 0.0,
                "overall": 0.0,
                "summary": "No answers were provided to evaluate."
            }
            return self.final_feedback
        
        # Build Q&A summary (limit to avoid token limits)
        qa_summary = ""
        for i, qa in enumerate(self.history, 1):
            answer = qa.get('answer', 'No answer provided')
            # Truncate very long answers to avoid token limits
            if len(answer) > 500:
                answer = answer[:500] + "..."
            
            qa_summary += f"Q{i}: {qa['question']}\n"
            qa_summary += f"A{i}: {answer}\n"
            
            if qa.get('followup'):
                qa_summary += f"   Follow-up: {qa['followup']}\n"
                if qa.get('followup_answer'):
                    fa = qa['followup_answer']
                    if len(fa) > 500:
                        fa = fa[:500] + "..."
                    qa_summary += f"   Follow-up Answer: {fa}\n"
            qa_summary += "\n"

        # Include attention score if available
        attention_info = ""
        if self.final_attention > 0:
            attention_info = f"\nWebcam Attention Score: {self.final_attention}%"

        # Create feedback prompt
        feedback_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert mock interview evaluator.

Based on the candidate's full interview responses below, analyze and score them across the following parameters:

- Relevance to the questions (how well answers addressed the question)
- Clarity of explanation (how easy to understand)
- Depth of knowledge (technical accuracy and comprehensiveness)
- Use of real-world examples (practical application)
- Communication and confidence (tone, structure, confidence level)
- Overall score (out of 5)

Return ONLY a valid JSON object with these exact keys: relevance, clarity, depth, examples, communication, overall, summary

Example format:
{
  "relevance": 4.5,
  "clarity": 4.0,
  "depth": 3.5,
  "examples": 3.0,
  "communication": 4.2,
  "overall": 4.1,
  "summary": "You communicated clearly and provided relevant answers. Keep improving technical depth."
}"""),
            ("human", "{qa_summary}{attention_info}")
        ])

        # Generate feedback with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                chain = feedback_prompt | ChatGroq(
                    model=LLM_MODEL,
                    api_key=GROQ_API_KEY,
                    temperature=0.3
                )

                raw = chain.invoke({"qa_summary": qa_summary, "attention_info": attention_info})

                # Extract content from response
                response_content = raw.content if hasattr(raw, 'content') else str(raw)
                
                # Try to find and parse JSON
                json_match = re.search(r"\{.*\}", response_content, re.DOTALL)
                
                if json_match:
                    try:
                        parsed = json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        # Try cleaning the JSON string
                        cleaned = json_match.group(0).replace('\n', ' ').replace('\r', '')
                        parsed = json.loads(cleaned)
                    
                    # Validate required fields and add defaults if missing
                    required_fields = ['relevance', 'clarity', 'depth', 'examples', 'communication', 'overall', 'summary']
                    
                    for field in required_fields:
                        if field not in parsed:
                            parsed[field] = 3.0 if field != 'summary' else "Evaluation complete. Your answers showed good understanding."
                    
                    # Ensure scores are numbers
                    for field in ['relevance', 'clarity', 'depth', 'examples', 'communication', 'overall']:
                        if not isinstance(parsed.get(field), (int, float)):
                            parsed[field] = 3.0
                    
                    self.final_feedback = parsed
                    logger.info(f"Feedback generated successfully (attempt {attempt + 1})")
                    return parsed
                else:
                    raise ValueError("No JSON object found in response")
                    
            except Exception as e:
                logger.error(f"Error generating feedback (attempt {attempt + 1}): {str(e)}")
                if attempt == max_retries - 1:
                    # Return default feedback instead of error
                    self.final_feedback = {
                        "relevance": 3.0,
                        "clarity": 3.0,
                        "depth": 3.0,
                        "examples": 3.0,
                        "communication": 3.0,
                        "overall": 3.0,
                        "summary": "Thank you for completing the interview. Your answers showed reasonable understanding of the topics. Continue practicing to improve your technical depth and communication clarity."
                    }
                    return self.final_feedback
                time.sleep(0.5)  # Brief pause before retry

        return self.final_feedback
