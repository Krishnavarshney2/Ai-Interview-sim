"""
SQLAlchemy models for the Luminal AI database schema.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base


class User(Base):
    """User profiles synced from Supabase Auth."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_uid = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    """Parsed resume data and file metadata."""
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_key = Column(String(500), nullable=False)  # Supabase Storage path or file path
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    parsed_data = Column(JSON, nullable=True)  # Extracted skills, experience, etc.
    raw_text = Column(Text, nullable=True)  # Full extracted text
    is_active = Column(Integer, default=1)  # 1 = active, 0 = archived
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    interviews = relationship("Interview", back_populates="resume")


class Interview(Base):
    """Interview session records."""
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)
    role = Column(String(255), nullable=False)
    rounds_total = Column(Integer, default=5)
    rounds_completed = Column(Integer, default=0)
    status = Column(String(50), default="in_progress")  # in_progress, completed, abandoned
    overall_score = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan", order_by="InterviewQuestion.round_number")
    feedback = relationship("Feedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class InterviewQuestion(Base):
    """Individual questions and answers within an interview."""
    __tablename__ = "interview_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    followup_question = Column(Text, nullable=True)
    followup_answer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    answered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    interview = relationship("Interview", back_populates="questions")


class Feedback(Base):
    """Generated feedback for completed interviews."""
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    relevance = Column(Float, nullable=True)
    clarity = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    examples = Column(Float, nullable=True)
    communication = Column(Float, nullable=True)
    overall = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    growth_areas = Column(JSON, default=list)
    attention_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="feedback")


class Subscription(Base):
    """User subscriptions for premium features."""
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    stripe_customer_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_price_id = Column(String(255), nullable=True)
    status = Column(String(50), default="inactive")  # active, canceled, past_due, inactive
    plan = Column(String(50), default="free")  # free, pro, enterprise
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="subscription")


class RateLimitLog(Base):
    """Persistent rate limit tracking (fallback when Redis unavailable)."""
    __tablename__ = "rate_limit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_ip = Column(String(45), nullable=False, index=True)
    endpoint = Column(String(100), nullable=False, index=True)
    requested_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
