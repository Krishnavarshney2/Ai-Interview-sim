import sys
import os

# Add project root to path so config can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import LLM_MODEL, GROQ_API_KEY

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

llm = ChatGroq(model=LLM_MODEL, api_key=GROQ_API_KEY)

template = """
You are a professional interview assistant. A candidate has just answered a question in an interview.

Analyze the answer and determine:
- Is it incomplete, unclear, or worth digging deeper into?
- If yes, generate a follow-up question.
- If no, simply reply with: "No follow-up needed. Proceed to next question."

Candidate's Answer:
"{answer}"

Role: {role}

Respond with only the follow-up question or "No follow-up needed. Proceed to next question."
"""

prompt = PromptTemplate(
  input_variables=['answer','role'],
  template=template
)

followup_chain = prompt | llm

def generate_followup(answer, role='Software Developer'):
    response = followup_chain.invoke({'answer': answer, 'role': role})
    # ChatGroq returns AIMessage object, extract content
    return response.content.strip()

if __name__=='__main__':
  user_answer = """
    I used XGBoost for building the air quality prediction model because it handles missing values well.
    The biggest challenge was cleaning inconsistent data formats, and I used pandas and NumPy to preprocess it.
    """
  role = "Machine Learning Engineer"

  print('Evaluating the answer')
  followup=generate_followup(user_answer,role)
  print(f"\n🧠 Follow-Up:\n{followup}")
  