"""
Database repository layer.
All database operations go through here — never use raw SQL in API endpoints.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User, Resume, Interview, InterviewQuestion, Feedback


class UserRepository:
    """Repository for user operations."""

    @staticmethod
    async def get_by_supabase_uid(db: AsyncSession, supabase_uid: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, supabase_uid: str, email: str, name: Optional[str] = None) -> User:
        user = User(supabase_uid=supabase_uid, email=email, name=name)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def get_or_create(db: AsyncSession, supabase_uid: str, email: str, name: Optional[str] = None) -> User:
        user = await UserRepository.get_by_supabase_uid(db, supabase_uid)
        if not user:
            user = await UserRepository.create(db, supabase_uid, email, name)
        return user

    @staticmethod
    async def update_name(db: AsyncSession, user_id: UUID, name: str) -> None:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.name = name
            await db.commit()


class ResumeRepository:
    """Repository for resume operations."""

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: UUID,
        storage_key: str,
        file_name: str,
        file_size: Optional[int] = None,
        parsed_data: Optional[Dict] = None,
        raw_text: Optional[str] = None
    ) -> Resume:
        resume = Resume(
            user_id=user_id,
            storage_key=storage_key,
            file_name=file_name,
            file_size=file_size,
            parsed_data=parsed_data,
            raw_text=raw_text
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
        return resume

    @staticmethod
    async def get_by_id(db: AsyncSession, resume_id: UUID) -> Optional[Resume]:
        result = await db.execute(select(Resume).where(Resume.id == resume_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_active_by_user(db: AsyncSession, user_id: UUID) -> Optional[Resume]:
        result = await db.execute(
            select(Resume)
            .where(and_(Resume.user_id == user_id, Resume.is_active == 1))
            .order_by(desc(Resume.created_at))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user(db: AsyncSession, user_id: UUID) -> List[Resume]:
        result = await db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(desc(Resume.created_at))
        )
        return result.scalars().all()

    @staticmethod
    async def deactivate_all_for_user(db: AsyncSession, user_id: UUID) -> None:
        await db.execute(
            Resume.__table__.update()
            .where(Resume.user_id == user_id)
            .values(is_active=0)
        )
        await db.commit()


class InterviewRepository:
    """Repository for interview operations."""

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: UUID,
        role: str,
        rounds_total: int = 5,
        resume_id: Optional[UUID] = None
    ) -> Interview:
        interview = Interview(
            user_id=user_id,
            role=role,
            rounds_total=rounds_total,
            resume_id=resume_id,
            status="in_progress"
        )
        db.add(interview)
        await db.commit()
        await db.refresh(interview)
        return interview

    @staticmethod
    async def get_by_id(db: AsyncSession, interview_id: UUID) -> Optional[Interview]:
        result = await db.execute(
            select(Interview)
            .where(Interview.id == interview_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_active_by_user(db: AsyncSession, user_id: UUID) -> Optional[Interview]:
        result = await db.execute(
            select(Interview)
            .where(and_(Interview.user_id == user_id, Interview.status == "in_progress"))
            .order_by(desc(Interview.created_at))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[Interview]:
        result = await db.execute(
            select(Interview)
            .where(Interview.user_id == user_id)
            .order_by(desc(Interview.created_at))
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    @staticmethod
    async def update_status(
        db: AsyncSession,
        interview_id: UUID,
        status: str,
        overall_score: Optional[float] = None,
        duration_seconds: Optional[int] = None
    ) -> None:
        result = await db.execute(select(Interview).where(Interview.id == interview_id))
        interview = result.scalar_one_or_none()
        if interview:
            interview.status = status
            if overall_score is not None:
                interview.overall_score = overall_score
            if duration_seconds is not None:
                interview.duration_seconds = duration_seconds
            if status == "completed":
                interview.completed_at = datetime.utcnow()
            await db.commit()

    @staticmethod
    async def increment_round(db: AsyncSession, interview_id: UUID) -> None:
        result = await db.execute(select(Interview).where(Interview.id == interview_id))
        interview = result.scalar_one_or_none()
        if interview:
            interview.rounds_completed += 1
            await db.commit()

    @staticmethod
    async def get_count_by_user(db: AsyncSession, user_id: UUID) -> int:
        result = await db.execute(
            select(func.count(Interview.id)).where(Interview.user_id == user_id)
        )
        return result.scalar() or 0

    @staticmethod
    async def get_average_score(db: AsyncSession, user_id: UUID) -> Optional[float]:
        result = await db.execute(
            select(func.avg(Interview.overall_score))
            .where(and_(Interview.user_id == user_id, Interview.status == "completed"))
        )
        return result.scalar()

    @staticmethod
    async def get_recent_stats(db: AsyncSession, user_id: UUID) -> Dict[str, Any]:
        """Get aggregated stats for dashboard."""
        total = await InterviewRepository.get_count_by_user(db, user_id)
        avg_score = await InterviewRepository.get_average_score(db, user_id)
        
        result = await db.execute(
            select(func.count(Interview.id))
            .where(and_(
                Interview.user_id == user_id,
                Interview.status == "in_progress"
            ))
        )
        in_progress = result.scalar() or 0

        result = await db.execute(
            select(func.sum(Interview.duration_seconds))
            .where(Interview.user_id == user_id)
        )
        total_seconds = result.scalar() or 0

        return {
            "total_interviews": total,
            "completed": total - in_progress,
            "in_progress": in_progress,
            "average_score": round(avg_score, 1) if avg_score else 0,
            "total_practice_time_hours": round(total_seconds / 3600, 1)
        }


class InterviewQuestionRepository:
    """Repository for interview question operations."""

    @staticmethod
    async def create(
        db: AsyncSession,
        interview_id: UUID,
        round_number: int,
        question: str
    ) -> InterviewQuestion:
        iq = InterviewQuestion(
            interview_id=interview_id,
            round_number=round_number,
            question=question
        )
        db.add(iq)
        await db.commit()
        await db.refresh(iq)
        return iq

    @staticmethod
    async def record_answer(
        db: AsyncSession,
        question_id: UUID,
        answer: str,
        followup_question: Optional[str] = None,
        followup_answer: Optional[str] = None
    ) -> None:
        result = await db.execute(select(InterviewQuestion).where(InterviewQuestion.id == question_id))
        iq = result.scalar_one_or_none()
        if iq:
            iq.answer = answer
            iq.answered_at = datetime.utcnow()
            if followup_question:
                iq.followup_question = followup_question
            if followup_answer:
                iq.followup_answer = followup_answer
            await db.commit()

    @staticmethod
    async def get_by_interview(db: AsyncSession, interview_id: UUID) -> List[InterviewQuestion]:
        result = await db.execute(
            select(InterviewQuestion)
            .where(InterviewQuestion.interview_id == interview_id)
            .order_by(InterviewQuestion.round_number)
        )
        return result.scalars().all()


class SubscriptionRepository:
    """Repository for subscription operations."""

    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: UUID) -> Optional[Any]:
        from db.models import Subscription
        result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_or_update(
        db: AsyncSession,
        user_id: UUID,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        stripe_price_id: Optional[str] = None,
        status: str = "inactive",
        plan: str = "free",
        current_period_start: Optional[datetime] = None,
        current_period_end: Optional[datetime] = None,
        cancel_at_period_end: bool = False
    ):
        from db.models import Subscription
        sub = await SubscriptionRepository.get_by_user_id(db, user_id)
        if sub:
            if stripe_customer_id: sub.stripe_customer_id = stripe_customer_id
            if stripe_subscription_id: sub.stripe_subscription_id = stripe_subscription_id
            if stripe_price_id: sub.stripe_price_id = stripe_price_id
            sub.status = status
            sub.plan = plan
            if current_period_start: sub.current_period_start = current_period_start
            if current_period_end: sub.current_period_end = current_period_end
            sub.cancel_at_period_end = 1 if cancel_at_period_end else 0
            sub.updated_at = datetime.utcnow()
        else:
            sub = Subscription(
                user_id=user_id,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
                stripe_price_id=stripe_price_id,
                status=status,
                plan=plan,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
                cancel_at_period_end=1 if cancel_at_period_end else 0
            )
            db.add(sub)
        await db.commit()
        await db.refresh(sub)
        return sub


class FeedbackRepository:
    """Repository for feedback operations."""

    @staticmethod
    async def create(
        db: AsyncSession,
        interview_id: UUID,
        relevance: float,
        clarity: float,
        depth: float,
        examples: float,
        communication: float,
        overall: float,
        summary: str,
        strengths: List[str],
        growth_areas: List[str],
        attention_score: Optional[float] = None
    ) -> Feedback:
        feedback = Feedback(
            interview_id=interview_id,
            relevance=relevance,
            clarity=clarity,
            depth=depth,
            examples=examples,
            communication=communication,
            overall=overall,
            summary=summary,
            strengths=strengths,
            growth_areas=growth_areas,
            attention_score=attention_score
        )
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)
        return feedback

    @staticmethod
    async def get_by_interview(db: AsyncSession, interview_id: UUID) -> Optional[Feedback]:
        result = await db.execute(
            select(Feedback).where(Feedback.interview_id == interview_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_category_averages(db: AsyncSession, user_id: UUID) -> Dict[str, float]:
        """Get average scores per category across all completed interviews."""
        from sqlalchemy.orm import joinedload
        result = await db.execute(
            select(Feedback)
            .join(Interview)
            .where(Interview.user_id == user_id)
        )
        feedbacks = result.scalars().all()
        
        if not feedbacks:
            return {}

        categories = ["relevance", "clarity", "depth", "examples", "communication", "overall"]
        averages = {}
        for cat in categories:
            scores = [getattr(f, cat) for f in feedbacks if getattr(f, cat) is not None]
            averages[cat] = round(sum(scores) / len(scores), 1) if scores else 0
        return averages
