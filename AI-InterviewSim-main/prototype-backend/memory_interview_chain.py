"""
Memory Interview Chain v2.0 - Round-Specific Intelligent Question Generation

Uses interview blueprint to generate context-aware, role-calibrated questions.
Each round type has a specialized prompt template for maximum relevance.
"""

import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import LLM_MODEL, GROQ_API_KEY

# Lazy-load the LLM to avoid crashing on startup if GROQ_API_KEY is not set
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set.")
        from langchain_groq import ChatGroq
        _llm = ChatGroq(model=LLM_MODEL, api_key=GROQ_API_KEY, temperature=0.7)
    return _llm


# =============================================================================
# Round-Specific Prompt Templates
# =============================================================================

ROUND_PROMPTS = {
    "resume_deep_dive": """You are a senior technical interviewer conducting Round {round_num} of a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE RESUME CONTEXT: {resume_context}
CANDIDATE BACKGROUND: {resume_summary}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
This is the WARM-UP round. Your goal is to verify the candidate's resume claims and assess depth of experience.

Ask ONE specific, probing question about: {focus}

Requirements:
- Reference SPECIFIC technologies or projects from their resume
- Ask about TRADE-OFFS they made ("Why X instead of Y?")
- Probe for METRICS or IMPACT they achieved
- If they mention a technology, ask about a real-world challenge with it
- Do NOT ask generic "tell me about yourself"
- Do NOT ask multiple questions
- Keep it to 1-2 sentences maximum

Respond with ONLY the question.""",

    "system_design": """You are a senior engineer conducting Round {round_num}: System Design for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE CONTEXT: {resume_context}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE system design question that:
- Is appropriate for a {role} at difficulty level {difficulty}/5
- For Junior (1-2): Design a feature or component they'd build
- For Mid (3): Design a service with clear requirements
- For Senior (4-5): Design a scalable distributed system with trade-offs
- Relates to their past work when possible: {resume_context}
- Includes specific requirements (scale, constraints)

Format: "Design [system]. It needs to handle [scale]. [Additional constraints]."

Respond with ONLY the question.""",

    "ml_system_design": """You are an ML lead conducting Round {round_num}: ML System Design for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE CONTEXT: {resume_context}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE ML system design question about:
- Model training pipeline, feature engineering, or deployment architecture
- Includes data requirements, model selection, evaluation metrics
- References their ML experience: {resume_context}

Respond with ONLY the question.""",

    "coding": """You are a senior engineer conducting Round {round_num}: Coding for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE'S STRONGEST SKILLS: {skills}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE coding/algorithm question that:
- Can be solved in 15-20 minutes
- Uses their claimed strongest language when possible: {skills}
- Is at difficulty {difficulty}/5
- Is a real problem, NOT a trick question
- Has clear input/output examples

Respond with ONLY the question.""",

    "behavioral": """You are a hiring manager conducting Round {round_num}: Behavioral for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE CONTEXT: {resume_context}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE behavioral question that:
- References a SPECIFIC project or situation from their resume
- Probes for leadership, conflict resolution, or growth
- Uses the STAR method framework implicitly
- Asks for concrete metrics and outcomes

Examples of good framing:
- "In your work on [PROJECT], you mentioned [DETAIL]. Walk me through a time when..."
- "You led [INITIATIVE]. What was the biggest pushback you faced and how did you handle it?"
- "Your resume mentions scaling [SYSTEM] to [SCALE]. What would you do differently with hindsight?"

Respond with ONLY the question.""",

    "architecture": """You are a principal engineer conducting Round {round_num}: Architecture Review for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE CONTEXT: {resume_context}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE architecture question that:
- Probes their understanding of a system they've built
- Asks about evolution, migration, or technical debt
- Includes trade-offs and alternative approaches
- References their architecture experience: {resume_context}

Respond with ONLY the question.""",

    "debugging": """You are a senior engineer conducting Round {round_num}: Debugging for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE CONTEXT: {resume_context}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Describe a realistic production bug or performance issue and ask how they would debug it.
- Include symptoms and constraints
- Make it relevant to their tech stack when possible
- Ask for systematic debugging approach

Respond with ONLY the scenario and question.""",

    "domain_knowledge": """You are conducting Round {round_num}: Domain Knowledge for a {role} interview.

INTERVIEW PLAN: {focus}
CANDIDATE CONTEXT: {resume_context}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE deep domain question about:
- Core concepts in {role}
- A technology they claim expertise in
- Industry best practices or trade-offs
- The question should test understanding, NOT memorization

Respond with ONLY the question.""",

    "product_sense": """You are a product leader conducting Round {round_num}: Product Sense for a {role} interview.

INTERVIEW PLAN: {focus}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE product question about:
- Feature prioritization, metrics, or user research
- A real product they could improve
- Trade-offs between user needs and business goals

Respond with ONLY the question.""",

    "design_critique": """You are a design lead conducting Round {round_num}: Design Critique for a {role} interview.

INTERVIEW PLAN: {focus}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask the candidate to critique a design or walk through their design process for a specific scenario.

Respond with ONLY the question.""",

    "default": """You are a technical interviewer conducting Round {round_num} for a {role} position.

INTERVIEW PLAN: {focus}
CANDIDATE RESUME: {resume_summary}

PREVIOUS CONVERSATION:
{chat_history}

INSTRUCTIONS:
Ask ONE clear, relevant technical question for this round.
- Tailor it to the candidate's resume when possible
- Be specific and concise
- Ask only ONE question

Respond with ONLY the question."""
}


# =============================================================================
# Question Generation Functions
# =============================================================================

def generate_round_question(
    round_plan: dict,
    resume_intelligence: dict,
    chat_history: list,
) -> str:
    """
    Generate a question for a specific round using the blueprint.
    
    Args:
        round_plan: RoundPlan as dict (from blueprint)
        resume_intelligence: Interview intelligence dict
        chat_history: List of previous Q&A exchanges
    
    Returns:
        Generated question string
    """
    area = round_plan.get("area", "default")
    prompt_template = ROUND_PROMPTS.get(area, ROUND_PROMPTS["default"])
    
    # Format chat history
    history_text = ""
    for entry in chat_history[-6:]:  # Last 6 exchanges for context
        q = entry.get("question", "")
        a = entry.get("answer", "")
        if q:
            history_text += f"Q: {q}\n"
        if a:
            history_text += f"A: {a}\n"
    if not history_text:
        history_text = "(This is the first question)"
    
    # Extract resume summary
    intel = resume_intelligence.get("interview_intelligence", {})
    std = resume_intelligence
    resume_summary = json.dumps({
        "name": std.get("name", "Candidate"),
        "skills": std.get("skills", []),
        "experience": std.get("experience", [])[:2],
        "projects": std.get("projects", [])[:2],
    }, indent=2)
    
    # Fill prompt template
    prompt_text = prompt_template.format(
        round_num=round_plan.get("round_number", 1),
        role=round_plan.get("role_context", "the position"),
        focus=round_plan.get("focus", "technical assessment"),
        resume_context=round_plan.get("context_from_resume", ""),
        resume_summary=resume_summary,
        chat_history=history_text,
        difficulty=round_plan.get("target_depth", 3),
        skills=", ".join(intel.get("tech_depth", {}).get("primary_stack", [])[:5]),
    )
    
    # Call LLM
    from langchain_core.prompts import ChatPromptTemplate
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert technical interviewer. Generate ONE question only."),
        ("human", prompt_text)
    ])
    
    chain = prompt | get_llm()
    response = chain.invoke({})
    
    question = response.content.strip() if hasattr(response, 'content') else str(response).strip()
    
    # Clean up
    question = question.replace("\"", "").strip()
    if question.lower().startswith("question:"):
        question = question[9:].strip()
    
    return question


def generate_followup_question(
    last_answer: str,
    round_plan: dict,
    resume_intelligence: dict,
    quality_hint: str = "medium",
) -> str:
    """
    Generate a contextual follow-up based on answer quality.
    
    Args:
        last_answer: Candidate's last answer
        round_plan: Current round plan
        resume_intelligence: Resume intelligence
        quality_hint: "strong", "medium", or "weak"
    
    Returns:
        Follow-up question or empty string if no follow-up needed
    """
    area = round_plan.get("area", "default")
    focus = round_plan.get("focus", "")
    
    prompt = f"""You are analyzing a candidate's answer during a technical interview.

ROUND TYPE: {area}
TOPIC: {focus}

CANDIDATE'S ANSWER:
{last_answer}

ANSWER QUALITY ASSESSMENT: {quality_hint}

INSTRUCTIONS:
Based on the answer quality, decide whether to ask a follow-up:

If STRONG:
- Acknowledge briefly (1 sentence max)
- Ask a HARDER follow-up that goes deeper into the same topic
- OR transition to the next planned topic

If MEDIUM:
- Ask a CLARIFYING question about the weakest part of their answer
- Probe for specifics, metrics, or edge cases

If WEAK:
- Ask a SIMPLER rephrasing of the same question
- OR provide a hint and ask them to try again
- Be encouraging but direct

If the answer is complete and needs no follow-up, respond with exactly:
"No follow-up needed. Proceed to next question."

Otherwise, respond with ONLY the follow-up question (max 2 sentences).
"""
    
    from langchain_core.prompts import ChatPromptTemplate
    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert interviewer. Generate concise follow-ups."),
        ("human", prompt)
    ])
    
    chain = chat_prompt | get_llm()
    response = chain.invoke({})
    
    followup = response.content.strip() if hasattr(response, 'content') else str(response).strip()
    
    if "no follow-up" in followup.lower() or "proceed" in followup.lower():
        return ""
    
    return followup


# Real memory chain for backward compatibility
def get_memory_chain():
    """Returns a chain wrapper that uses the new round-specific prompts."""
    class RealChainWrapper:
        def __init__(self):
            self._llm = None
        
        def invoke(self, inputs, config=None):
            """Generate a question using the new system."""
            from langchain_core.messages import AIMessage
            
            # Extract inputs
            resume_str = inputs.get('resume', '{}')
            role = inputs.get('role', 'Software Engineer')
            
            try:
                resume_data = json.loads(resume_str) if isinstance(resume_str, str) else resume_str
            except:
                resume_data = {}
            
            # Build a simple round plan
            round_plan = {
                "round_number": 1,
                "area": "resume_deep_dive",
                "focus": f"Deep dive into {role} experience",
                "target_depth": 3,
                "context_from_resume": resume_str[:300],
                "role_context": role,
            }
            
            # Build intelligence
            intelligence = {
                "name": resume_data.get("name", "Candidate"),
                "skills": resume_data.get("skills", []),
                "experience": resume_data.get("experience", []),
                "projects": resume_data.get("projects", []),
                "interview_intelligence": {
                    "deep_dive_topics": [{"area": "Experience", "context": resume_str[:200]}],
                    "tech_depth": {"primary_stack": resume_data.get("skills", [])[:5]},
                }
            }
            
            try:
                question = generate_round_question(
                    round_plan=round_plan,
                    resume_intelligence=intelligence,
                    chat_history=[],
                )
            except Exception as e:
                logger = __import__('logging').getLogger(__name__)
                logger.error(f"Real chain question generation failed: {e}")
                question = None
            
            if not question:
                question = f"Tell me about your experience with {role} and walk me through your most significant project."
            
            return AIMessage(content=question)
    
    return RealChainWrapper()
