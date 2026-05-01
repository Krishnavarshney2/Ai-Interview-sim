"""
Interview Session Manager v2.0

Uses Interview Blueprint for strategic, round-specific question generation.
Falls back to intelligent mock mode when AI is unavailable.
"""

import json
import re
import os
import sys
import time
import logging
from typing import Optional, Dict, List, Any

# Add paths for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import LLM_MODEL, GROQ_API_KEY, MAX_DUPLICATE_RETRIES

# Configure logging
logger = logging.getLogger(__name__)


class InterviewSessionError(Exception):
    """Custom exception for interview session errors."""
    pass


class InterviewSession:
    """
    Manages a complete mock interview session with blueprint-guided questions.
    """
    
    def __init__(
        self,
        resume_path: Optional[str] = None,
        resume_obj: Optional[Dict[str, Any]] = None,
        role: str = '',
        rounds: int = 3,
        session_id: str = 'default_user',
        resume_intelligence: Optional[Dict[str, Any]] = None,
        blueprint: Optional[Any] = None,
    ):
        # Load resume
        if resume_path:
            if not os.path.exists(resume_path):
                raise FileNotFoundError(f"Resume file not found: {resume_path}")
            try:
                with open(resume_path, 'r', encoding='utf-8') as f:
                    self.resume = json.load(f)
            except json.JSONDecodeError as e:
                raise json.JSONDecodeError(f"Invalid JSON in resume file: {e.msg}", e.doc, e.pos)
        elif resume_obj:
            if not isinstance(resume_obj, dict):
                raise TypeError("resume_obj must be a dictionary")
            self.resume = resume_obj
        else:
            raise ValueError("Either resume_path or resume_obj must be provided.")

        if not role or not role.strip():
            raise ValueError("Role cannot be empty")
        if rounds < 1 or rounds > 20:
            raise ValueError("Rounds must be between 1 and 20")

        self.role = role.strip()
        self.resume_str = json.dumps(self.resume)
        self.rounds = rounds
        self.current_round = 0
        self.session_id = session_id
        self.history: List[Dict[str, Any]] = []
        self.final_feedback: Dict[str, Any] = {}
        self.final_attention: float = 0.0
        
        # Interview intelligence
        self.resume_intelligence = resume_intelligence or self._build_basic_intelligence()
        
        # Blueprint for interview strategy
        self.blueprint = blueprint
        self.current_round_plan = None
        
        # Lazy-loaded components
        self._vector_memory = None
        self._llm_chain = None
        
        logger.info(f"Interview session initialized: role={self.role}, rounds={self.rounds}")

    def _build_basic_intelligence(self) -> dict:
        """Build basic intelligence from raw resume if none provided."""
        return {
            "name": self.resume.get("name", "Candidate"),
            "skills": self.resume.get("skills", []),
            "experience": self.resume.get("experience", []),
            "projects": self.resume.get("projects", []),
            "interview_intelligence": {
                "deep_dive_topics": [],
                "claimed_expertise": [{"skill": s, "confidence": "medium"} for s in self.resume.get("skills", [])[:5]],
                "vague_areas": [],
                "architecture_signals": [],
                "tech_depth": {"primary_stack": self.resume.get("skills", [])[:5]},
                "strongest_project": None,
                "years_experience": 0,
            }
        }

    def _get_vector_memory(self):
        """Lazy-load vector memory."""
        if self._vector_memory is None:
            try:
                from vector_memory import VectorMemory
                self._vector_memory = VectorMemory()
            except Exception as e:
                logger.warning(f"Vector memory unavailable: {e}")
                self._vector_memory = None
        return self._vector_memory

    def _ai_available(self) -> bool:
        """Check if AI modules can be used."""
        return bool(GROQ_API_KEY and GROQ_API_KEY.strip())

    def ask_question(self) -> Optional[str]:
        """Generate the next interview question."""
        if self.current_round >= self.rounds:
            logger.info("Interview complete")
            return None

        self.current_round += 1
        
        # Get round plan from blueprint
        if self.blueprint:
            round_plan = self.blueprint.get_current_round(self.current_round)
            if round_plan:
                self.current_round_plan = round_plan
                logger.info(f"Round {self.current_round}: {round_plan.area} - {round_plan.focus}")
        
        # Try AI generation first
        question = None
        if self._ai_available():
            try:
                question = self._generate_ai_question()
            except Exception as e:
                logger.error(f"AI question generation failed: {e}")
                question = None
        
        # Fallback to mock mode
        if not question:
            question = self._generate_mock_question()
        
        # Add to history
        self.history.append({
            'question': question,
            'answer': None,
            'followup': None,
            'timestamp': time.time(),
            'round_plan': self.current_round_plan.to_dict() if self.current_round_plan else None,
        })
        
        logger.info(f"Question {self.current_round}/{self.rounds} generated")
        return question

    def _generate_ai_question(self) -> Optional[str]:
        """Generate question using AI with blueprint guidance."""
        try:
            from memory_interview_chain import generate_round_question
            
            # Build chat history
            chat_history = []
            for qa in self.history:
                chat_history.append({
                    "question": qa.get("question", ""),
                    "answer": qa.get("answer", ""),
                })
            
            # Get round plan
            round_plan = self.current_round_plan
            if round_plan:
                round_dict = {
                    "round_number": round_plan.round_number,
                    "area": round_plan.area,
                    "focus": round_plan.focus,
                    "target_depth": round_plan.target_depth,
                    "context_from_resume": round_plan.context_from_resume,
                    "role_context": self.role,
                }
            else:
                round_dict = {
                    "round_number": self.current_round,
                    "area": "default",
                    "focus": f"Technical assessment for {self.role}",
                    "target_depth": 3,
                    "context_from_resume": self.resume_str[:500],
                    "role_context": self.role,
                }
            
            question = generate_round_question(
                round_plan=round_dict,
                resume_intelligence=self.resume_intelligence,
                chat_history=chat_history,
            )
            
            return question if question else None
            
        except Exception as e:
            logger.error(f"AI question generation error: {e}", exc_info=True)
            return None

    def _generate_mock_question(self) -> str:
        """Generate a mock question using templates + resume data."""
        intel = self.resume_intelligence.get("interview_intelligence", {})
        
        # Try to use blueprint focus
        if self.current_round_plan:
            area = self.current_round_plan.area
            focus = self.current_round_plan.focus
        else:
            area = "default"
            focus = self.role
        
        # Get relevant resume data
        deep_topics = intel.get("deep_dive_topics", [])
        skills = intel.get("tech_depth", {}).get("primary_stack", [])
        strongest = intel.get("strongest_project", {})
        
        # Template-based generation
        templates = self._get_mock_templates(area)
        
        # Fill template with resume data
        template = templates[(self.current_round - 1) % len(templates)]
        
        # Extract project/company names
        project_name = strongest.get("name", "your project") if strongest else "your project"
        skill = skills[0] if skills else "this technology"
        
        # Get experience context
        exp = self.resume_intelligence.get("experience", [])
        company = exp[0].get("company", "your company") if exp else "your company"
        title = exp[0].get("title", "your role") if exp else "your role"
        
        try:
            question = template.format(
                role=self.role,
                project=project_name,
                skill=skill,
                company=company,
                title=title,
                focus=focus,
                round_num=self.current_round,
            )
        except KeyError:
            # Fallback if template formatting fails
            question = f"Tell me about your experience with {skill} in the context of {focus}."
        
        return question

    def _get_mock_templates(self, area: str) -> List[str]:
        """Get mock question templates for a round type."""
        templates = {
            "resume_deep_dive": [
                "Walk me through {project}. Specifically, what was your role, what technologies did you use, and what was the biggest technical challenge you faced?",
                "In your work at {company} as {title}, you mentioned working with {skill}. Can you describe a specific situation where you used it to solve a complex problem?",
                "Your resume highlights {project}. Tell me about the architecture - how did you design it, and what trade-offs did you make?",
                "You listed {skill} as a core skill. What's the most interesting or challenging thing you've built with it?",
                "Looking at your experience at {company}, what are you most proud of building there?",
            ],
            "system_design": [
                "Design a system that handles the core functionality of {project} but scaled to 10x users. Walk me through your approach.",
                "You have experience with {skill}. How would you design a distributed system using {skill} to handle 100,000 requests per second?",
                "Design a URL shortener. How would you handle high availability, and what database would you choose?",
                "How would you design the notification system for a platform like {project}? Consider delivery guarantees and latency.",
                "Design a real-time chat system. What technologies would you use and why?",
            ],
            "coding": [
                "Given an array of integers, find the two numbers that add up to a specific target. What's your approach and what's the time complexity?",
                "Implement a function to check if a string is a valid palindrome, ignoring spaces and punctuation.",
                "Design a class to implement a stack that supports push, pop, and retrieving the minimum element in O(1) time.",
                "Write a function to merge two sorted arrays into one sorted array without using extra space.",
                "Given a binary tree, write a function to check if it's balanced.",
            ],
            "behavioral": [
                "Tell me about a time when you had a major disagreement with a teammate about a technical approach. How did you resolve it?",
                "Describe a project that failed or didn't meet expectations. What did you learn from it?",
                "You mentioned {project}. What would you do differently if you were to rebuild it from scratch today?",
                "Tell me about a time you had to learn a new technology quickly to deliver on a deadline.",
                "Describe a situation where you had to optimize performance. What was the bottleneck and how did you fix it?",
            ],
            "architecture": [
                "You worked on {project}. How did the architecture evolve over time? What technical debt did you accumulate?",
                "If you were to migrate {project} from a monolith to microservices, how would you approach it?",
                "What monitoring and observability would you set up for {project}?",
                "How would you ensure data consistency in a distributed system like {project}?",
                "You mentioned {skill}. What are its limitations and when would you NOT use it?",
            ],
            "domain_knowledge": [
                "What are the key differences between REST and GraphQL? When would you choose one over the other?",
                "Explain how database indexing works. When would adding an index hurt performance?",
                "What is the CAP theorem and how does it affect system design?",
                "Explain the difference between processes and threads. When would you use one over the other?",
                "What are the key considerations when designing an API for third-party developers?",
            ],
            "default": [
                "Tell me about your experience with {skill} in the context of {focus}.",
                "Walk me through a recent technical challenge you faced and how you solved it.",
                "What excites you most about working as a {role}?",
                "Describe your ideal development workflow. What tools and practices do you find most valuable?",
                "How do you approach learning a new codebase or technology?",
            ],
        }
        
        return templates.get(area, templates["default"])

    def provide_answer(self, answer: str) -> None:
        """Record candidate's answer."""
        if not self.history:
            raise InterviewSessionError("No active question to answer")
        
        if not answer or not answer.strip():
            logger.warning("Empty answer provided")
        
        self.history[-1]['answer'] = answer.strip()
        self.history[-1]['answer_timestamp'] = time.time()
        
        # Add to vector memory if available
        vm = self._get_vector_memory()
        if vm:
            try:
                vm.add_qa(self.history[-1]['question'], answer.strip())
            except Exception as e:
                logger.error(f"Vector memory error: {e}")
        
        logger.info(f"Answer recorded for question {self.current_round}")

    def get_followup(self, answer: str) -> Optional[str]:
        """Generate a follow-up question based on the answer."""
        if not answer or not answer.strip():
            return None
        
        if self._ai_available():
            try:
                from memory_interview_chain import generate_followup_question
                
                round_plan = None
                if self.current_round_plan:
                    round_plan = {
                        "area": self.current_round_plan.area,
                        "focus": self.current_round_plan.focus,
                    }
                
                followup = generate_followup_question(
                    last_answer=answer.strip(),
                    round_plan=round_plan or {"area": "default", "focus": self.role},
                    resume_intelligence=self.resume_intelligence,
                    quality_hint="medium",
                )
                
                if followup:
                    self.history[-1]['followup'] = followup
                    logger.info("Follow-up generated")
                    return followup
                    
            except Exception as e:
                logger.error(f"AI follow-up failed: {e}")
        
        return None

    def is_complete(self) -> bool:
        """Check if all interview rounds are complete."""
        return self.current_round >= self.rounds

    def summary(self) -> List[Dict[str, Any]]:
        """Return the complete interview history."""
        return self.history

    def generate_final_feedback(self) -> Dict[str, Any]:
        """Generate feedback on interview performance."""
        if not self.history:
            return self._default_feedback("No answers were provided to evaluate.")
        
        if self._ai_available():
            try:
                return self._generate_ai_feedback()
            except Exception as e:
                logger.error(f"AI feedback failed: {e}")
        
        return self._generate_mock_feedback()

    def _generate_ai_feedback(self) -> Dict[str, Any]:
        """Generate feedback using AI."""
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_groq import ChatGroq
            
            # Build Q&A summary
            qa_summary = ""
            for i, qa in enumerate(self.history, 1):
                answer = qa.get('answer', 'No answer provided')
                if len(answer) > 500:
                    answer = answer[:500] + "..."
                qa_summary += f"Q{i}: {qa['question']}\nA{i}: {answer}\n\n"
            
            feedback_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an expert interview evaluator. 
                Score the candidate 0-5 on: relevance, clarity, depth, examples, communication.
                Provide a brief, encouraging summary.
                Return ONLY valid JSON with keys: relevance, clarity, depth, examples, communication, overall, summary, strengths, growth_areas"""),
                ("human", qa_summary)
            ])
            
            chain = feedback_prompt | ChatGroq(model=LLM_MODEL, api_key=GROQ_API_KEY, temperature=0.3)
            raw = chain.invoke({})
            response_content = raw.content if hasattr(raw, 'content') else str(raw)
            
            json_match = re.search(r"\{.*\}", response_content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return self._normalize_feedback(parsed)
                
        except Exception as e:
            logger.error(f"AI feedback error: {e}")
        
        return self._generate_mock_feedback()

    def _generate_mock_feedback(self) -> Dict[str, Any]:
        """Generate basic feedback based on answer lengths and completeness."""
        total_questions = len(self.history)
        answered = sum(1 for qa in self.history if qa.get('answer'))
        avg_length = sum(len(qa.get('answer', '')) for qa in self.history) / max(answered, 1)
        
        # Score based on engagement
        if answered == total_questions and avg_length > 200:
            scores = {"relevance": 3.8, "clarity": 3.7, "depth": 3.5, "examples": 3.4, "communication": 3.8, "overall": 3.6}
            summary = "Great engagement! You answered all questions thoroughly. To improve, provide more specific metrics and technical details in your examples."
        elif answered >= total_questions * 0.8:
            scores = {"relevance": 3.2, "clarity": 3.4, "depth": 3.0, "examples": 2.8, "communication": 3.3, "overall": 3.1}
            summary = "Good effort! You engaged well with most questions. Work on providing more detailed, structured responses with concrete examples."
        else:
            scores = {"relevance": 2.5, "clarity": 2.8, "depth": 2.3, "examples": 2.0, "communication": 2.7, "overall": 2.5}
            summary = "You showed some understanding of the topics. Try to provide more complete answers with specific details, metrics, and real-world examples."
        
        feedback = {
            **scores,
            "summary": summary,
            "strengths": ["Willingness to engage", "Basic technical understanding"],
            "growth_areas": ["Provide more specific examples", "Include metrics and quantified impact", "Structure answers using STAR method"],
        }
        
        self.final_feedback = feedback
        return feedback

    def _default_feedback(self, summary: str) -> Dict[str, Any]:
        """Return default feedback."""
        feedback = {
            "relevance": 0.0, "clarity": 0.0, "depth": 0.0,
            "examples": 0.0, "communication": 0.0, "overall": 0.0,
            "summary": summary,
            "strengths": [], "growth_areas": [],
        }
        self.final_feedback = feedback
        return feedback

    def _normalize_feedback(self, parsed: dict) -> Dict[str, Any]:
        """Normalize and validate feedback fields."""
        required = ['relevance', 'clarity', 'depth', 'examples', 'communication', 'overall', 'summary']
        for field in required:
            if field not in parsed:
                parsed[field] = 3.0 if field != 'summary' else "Evaluation complete."
        
        for field in ['relevance', 'clarity', 'depth', 'examples', 'communication', 'overall']:
            if not isinstance(parsed.get(field), (int, float)):
                parsed[field] = 3.0
        
        if 'strengths' not in parsed or not isinstance(parsed['strengths'], list):
            parsed['strengths'] = ["Technical engagement"]
        if 'growth_areas' not in parsed or not isinstance(parsed['growth_areas'], list):
            parsed['growth_areas'] = ["Provide more specific examples"]
        
        self.final_feedback = parsed
        return parsed
