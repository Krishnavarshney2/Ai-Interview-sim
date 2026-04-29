import json
import sys
import os

# Add project root to path so config can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import LLM_MODEL, GROQ_API_KEY

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# Lazy-load the LLM to avoid crashing on startup if GROQ_API_KEY is not set
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set. Please configure it in your environment variables.")
        _llm = ChatGroq(model=LLM_MODEL, api_key=GROQ_API_KEY)
    return _llm

prompt_template = """
You are a technical interviewer. Based on the candidate's resume and selected job role, generate the first interview question.

Candidate Resume (in JSON format):
{resume}

Target Role: {role}

Rules:
- Ask one clear and relevant interview question.
- Tailor it to the skills, experience, or projects in the resume.
- Do not provide explanations or answers.

Return only the question.
"""

prompt = PromptTemplate(
  input_variables=['resume','role'],
  template=prompt_template
)

def generate_question(resume_dict, role):
    resume_str = json.dumps(resume_dict)
    
    # Build chain lazily at call time
    interview_chain = prompt | get_llm()
    response = interview_chain.invoke({'resume': resume_str, 'role': role})
    
    # ChatGroq returns AIMessage object, extract content
    return response.content.strip()

if __name__=='__main__':
  resume_path = 'test-files/Rahul_Resume_provisional__parsed.json'
  role = 'Software Development Engineer'

  print("Generating Questions....")
  question = generate_question(resume_path,role)
  print(f'\n Interview Questiion :\n{question}')