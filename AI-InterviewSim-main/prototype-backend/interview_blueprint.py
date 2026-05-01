"""
Interview Blueprint Generator

Creates a strategic, multi-round interview plan based on:
- Resume intelligence (deep dive topics, expertise, gaps)
- Target role ( Senior SDE, Data Scientist, etc.)
- Difficulty level (1-5)
- Total rounds

The blueprint guides the entire interview flow, ensuring each round
has purpose and builds on previous responses.
"""

import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class RoundPlan:
    """Plan for a single interview round."""
    round_number: int
    area: str  # resume_deep_dive | system_design | coding | behavioral | architecture | debugging | domain_knowledge
    focus: str  # Specific topic or question theme
    target_depth: int  # 1-5
    success_criteria: str
    context_from_resume: str  # What resume detail this round probes
    estimated_time_minutes: int = 10
    follow_up_enabled: bool = True


@dataclass
class InterviewBlueprint:
    """Complete interview strategy."""
    role: str
    difficulty: int
    total_rounds: int
    rounds: List[RoundPlan] = field(default_factory=list)
    candidate_profile: dict = field(default_factory=dict)
    adaptive_notes: dict = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "difficulty": self.difficulty,
            "total_rounds": self.total_rounds,
            "rounds": [asdict(r) for r in self.rounds],
            "candidate_profile": self.candidate_profile,
            "adaptive_notes": self.adaptive_notes,
        }
    
    def get_current_round(self, current_round_num: int) -> Optional[RoundPlan]:
        """Get plan for current round."""
        for r in self.rounds:
            if r.round_number == current_round_num:
                return r
        return None


# Role-based interview taxonomies
ROLE_TAXONOMIES = {
    "Senior Software Engineer": {
        "round_distribution": ["resume_deep_dive", "system_design", "coding", "architecture", "behavioral"],
        "focus_areas": ["scalability", "API design", "database optimization", "testing", "code quality"],
        "difficulty_curve": [2, 3, 4, 4, 5],
    },
    "Software Engineer": {
        "round_distribution": ["resume_deep_dive", "coding", "system_design", "domain_knowledge", "behavioral"],
        "focus_areas": ["algorithms", "data structures", "debugging", "API design", "testing"],
        "difficulty_curve": [2, 3, 3, 4, 4],
    },
    "Data Scientist": {
        "round_distribution": ["resume_deep_dive", "ml_system_design", "statistics", "coding", "behavioral"],
        "focus_areas": ["experiment design", "feature engineering", "model evaluation", "A/B testing", "data pipelines"],
        "difficulty_curve": [2, 3, 4, 4, 5],
    },
    "Machine Learning Engineer": {
        "round_distribution": ["resume_deep_dive", "ml_system_design", "coding", "model_optimization", "behavioral"],
        "focus_areas": ["model deployment", "feature stores", "distributed training", "inference optimization", "ML pipelines"],
        "difficulty_curve": [2, 3, 4, 4, 5],
    },
    "Product Manager": {
        "round_distribution": ["resume_deep_dive", "product_sense", "strategy", "behavioral", "analytics"],
        "focus_areas": ["metrics", "user research", "roadmap prioritization", "stakeholder management", "GTM strategy"],
        "difficulty_curve": [2, 3, 3, 4, 4],
    },
    "DevOps Engineer": {
        "round_distribution": ["resume_deep_dive", "infrastructure_design", "ci_cd", "monitoring", "behavioral"],
        "focus_areas": ["Kubernetes", "CI/CD pipelines", "monitoring", "security", "cost optimization"],
        "difficulty_curve": [2, 3, 4, 4, 5],
    },
    "UX Designer": {
        "round_distribution": ["resume_deep_dive", "design_critique", "behavioral", "process", "portfolio"],
        "focus_areas": ["user research", "design systems", "accessibility", "prototyping", "metrics"],
        "difficulty_curve": [2, 3, 3, 4, 4],
    },
}

# Default taxonomy for unknown roles
DEFAULT_TAXONOMY = {
    "round_distribution": ["resume_deep_dive", "domain_knowledge", "coding", "behavioral", "system_design"],
    "focus_areas": ["problem solving", "technical depth", "communication", "collaboration", "learning ability"],
    "difficulty_curve": [2, 3, 3, 4, 4],
}


def _match_role_taxonomy(role: str) -> dict:
    """Find the best matching taxonomy for a role."""
    role_lower = role.lower()
    
    for known_role, taxonomy in ROLE_TAXONOMIES.items():
        if known_role.lower() in role_lower:
            return taxonomy
    
    # Try partial matches
    if "senior" in role_lower and "engineer" in role_lower:
        return ROLE_TAXONOMIES["Senior Software Engineer"]
    if "engineer" in role_lower or "developer" in role_lower:
        return ROLE_TAXONOMIES["Software Engineer"]
    if "data" in role_lower and "science" in role_lower:
        return ROLE_TAXONOMIES["Data Scientist"]
    if "machine learning" in role_lower or "ml" in role_lower:
        return ROLE_TAXONOMIES["Machine Learning Engineer"]
    if "product" in role_lower and "manager" in role_lower:
        return ROLE_TAXONOMIES["Product Manager"]
    if "devops" in role_lower or "sre" in role_lower or "platform" in role_lower:
        return ROLE_TAXONOMIES["DevOps Engineer"]
    if "ux" in role_lower or "design" in role_lower:
        return ROLE_TAXONOMIES["UX Designer"]
    
    return DEFAULT_TAXONOMY


def generate_blueprint(
    role: str,
    total_rounds: int,
    difficulty: int,
    resume_intelligence: dict,
) -> InterviewBlueprint:
    """
    Generate a strategic interview blueprint.
    
    Args:
        role: Target job role
        total_rounds: Number of interview rounds
        difficulty: Overall difficulty (1-5)
        resume_intelligence: Output from InterviewIntelligence.to_dict()
    
    Returns:
        InterviewBlueprint with round-by-round plan
    """
    intel = resume_intelligence.get("interview_intelligence", {})
    taxonomy = _match_role_taxonomy(role)
    
    # Get topics to cover
    deep_dive_topics = intel.get("deep_dive_topics", [])
    architecture_signals = intel.get("architecture_signals", [])
    claimed_expertise = intel.get("claimed_expertise", [])
    vague_areas = intel.get("vague_areas", [])
    strongest_project = intel.get("strongest_project", {})
    tech_depth = intel.get("tech_depth", {})
    years_exp = intel.get("years_experience", 0)
    
    # Adjust difficulty based on experience
    if years_exp >= 5:
        base_difficulty = max(difficulty, 3)
    elif years_exp >= 2:
        base_difficulty = max(difficulty, 2)
    else:
        base_difficulty = difficulty
    
    # Get round type distribution
    round_types = taxonomy["round_distribution"]
    difficulty_curve = taxonomy["difficulty_curve"]
    
    # Ensure we have enough round types
    while len(round_types) < total_rounds:
        round_types.append("domain_knowledge")
        difficulty_curve.append(difficulty_curve[-1] if difficulty_curve else 3)
    
    rounds = []
    used_topics = set()
    
    for i in range(total_rounds):
        round_num = i + 1
        area = round_types[i] if i < len(round_types) else "domain_knowledge"
        target_depth = min(difficulty_curve[i] if i < len(difficulty_curve) else base_difficulty, 5)
        
        # Determine focus based on area and available resume data
        focus, context = _determine_round_focus(
            area=area,
            round_num=round_num,
            deep_dive_topics=deep_dive_topics,
            architecture_signals=architecture_signals,
            claimed_expertise=claimed_expertise,
            vague_areas=vague_areas,
            strongest_project=strongest_project,
            tech_depth=tech_depth,
            used_topics=used_topics,
            role=role,
            difficulty=target_depth,
        )
        
        # Success criteria
        success = _get_success_criteria(area, target_depth)
        
        rounds.append(RoundPlan(
            round_number=round_num,
            area=area,
            focus=focus,
            target_depth=target_depth,
            success_criteria=success,
            context_from_resume=context,
            estimated_time_minutes=_get_time_estimate(area),
        ))
    
    # Build candidate profile summary
    profile = {
        "estimated_years_experience": years_exp,
        "primary_tech_stack": tech_depth.get("primary_stack", []),
        "claimed_expertise_count": len(claimed_expertise),
        "architecture_experience": len(architecture_signals) > 0,
        "has_quantified_metrics": len(intel.get("metric_gaps", [])) == 0,
        "strongest_area": strongest_project.get("name", "Unknown") if strongest_project else "Unknown",
    }
    
    return InterviewBlueprint(
        role=role,
        difficulty=difficulty,
        total_rounds=total_rounds,
        rounds=rounds,
        candidate_profile=profile,
        adaptive_notes={
            "rounds_completed": 0,
            "candidate_strengths": [],
            "candidate_weaknesses": [],
            "topics_covered": [],
        }
    )


def _determine_round_focus(
    area: str,
    round_num: int,
    deep_dive_topics: list,
    architecture_signals: list,
    claimed_expertise: list,
    vague_areas: list,
    strongest_project: dict,
    tech_depth: dict,
    used_topics: set,
    role: str,
    difficulty: int,
) -> tuple:
    """Determine the specific focus and context for a round."""
    
    if area == "resume_deep_dive":
        # Use the strongest project or first experience
        if strongest_project:
            focus = f"Deep dive into {strongest_project.get('name', 'their work')}"
            context = strongest_project.get("description", "")[:200]
            used_topics.add(strongest_project.get("name", ""))
        elif deep_dive_topics:
            topic = deep_dive_topics[0]
            focus = f"Deep dive into {topic.get('area', 'their experience')}"
            context = topic.get("context", "")
            used_topics.add(topic.get("area", ""))
        else:
            focus = "Walk through their background and most significant project"
            context = "General experience overview"
    
    elif area == "system_design" or area == "ml_system_design" or area == "infrastructure_design":
        if architecture_signals:
            sig = architecture_signals[0]
            focus = f"Design a system involving {sig.get('signal', 'scalability')}"
            context = f"They mentioned {sig.get('signal', 'architecture')} in {sig.get('context', 'their work')}"
            used_topics.add(sig.get("signal", ""))
        elif strongest_project:
            focus = f"Design a system similar to {strongest_project.get('name', 'their project')}"
            context = f"Scale {strongest_project.get('name', 'their system')} to 10x users"
        else:
            focus = f"Design a {role.lower().replace('engineer', '').strip()} system"
            context = "Standard system design for their role"
    
    elif area == "coding" or area == "domain_knowledge":
        if claimed_expertise:
            # Pick a claimed expertise to test
            for exp in claimed_expertise:
                skill = exp.get("skill", "")
                if skill and skill not in used_topics:
                    focus = f"Coding problem using {skill}"
                    context = f"They claim expertise in {skill}"
                    used_topics.add(skill)
                    break
            else:
                focus = "Algorithmic problem solving"
                context = "General coding assessment"
        else:
            focus = "Algorithmic problem solving"
            context = "General coding assessment"
    
    elif area == "architecture":
        if architecture_signals:
            sig = architecture_signals[min(1, len(architecture_signals)-1)]
            focus = f"Architectural decisions around {sig.get('signal', 'system design')}"
            context = sig.get("context", "")
        else:
            focus = "Architecture of a system they've built"
            context = "General architectural thinking"
    
    elif area == "behavioral":
        if vague_areas:
            v = vague_areas[0]
            focus = f"Clarify their role in {v.get('location', 'a project')}"
            context = v.get("context", "")
        else:
            focus = "Leadership and collaboration experience"
            context = "General behavioral assessment"
    
    elif area == "debugging":
        if claimed_expertise:
            skill = claimed_expertise[0].get("skill", "")
            focus = f"Debug a {skill}-related issue"
            context = f"Practical debugging using {skill}"
        else:
            focus = "Debugging a production issue"
            context = "General debugging skills"
    
    elif area == "product_sense":
        focus = f"Product thinking for {role}"
        context = "Product strategy and user focus"
    
    elif area == "design_critique" or area == "portfolio":
        focus = "Walk through their design process"
        context = strongest_project.get("description", "")[:200] if strongest_project else "Portfolio review"
    
    else:
        focus = f"Assessment of {area.replace('_', ' ')}"
        context = "General assessment"
    
    return focus, context


def _get_success_criteria(area: str, depth: int) -> str:
    """Get success criteria for a round type and depth."""
    criteria = {
        "resume_deep_dive": [
            "Able to explain their role and contributions clearly",
            "Provides specific technical details, not just high-level summaries",
            "Can justify technology choices with trade-offs",
            "Demonstrates ownership and decision-making",
            "Shows deep understanding of the systems they built",
        ],
        "system_design": [
            "Identifies key components of the system",
            "Considers scalability and trade-offs",
            "Discusses data model and API design",
            "Addresses failure modes and monitoring",
            "Produces a production-ready architecture with justifications",
        ],
        "coding": [
            "Writes syntactically correct code",
            "Handles edge cases",
            "Uses appropriate data structures",
            "Considers time/space complexity",
            "Produces optimal solution with clean code",
        ],
        "behavioral": [
            "Provides specific examples, not generic answers",
            "Demonstrates self-awareness",
            "Shows growth from past experiences",
            "Communicates impact with metrics",
            "Displays senior-level leadership and influence",
        ],
        "architecture": [
            "Understands architectural patterns",
            "Makes informed technology choices",
            "Considers non-functional requirements",
            "Discusses migration and evolution",
            "Architects for long-term maintainability",
        ],
        "domain_knowledge": [
            "Understands core concepts in their field",
            "Applies knowledge to practical scenarios",
            "Stays current with industry trends",
            "Can teach concepts to others",
            "Deep expertise with real-world application",
        ],
    }
    
    area_criteria = criteria.get(area, criteria["domain_knowledge"])
    idx = min(depth - 1, len(area_criteria) - 1)
    return area_criteria[idx]


def _get_time_estimate(area: str) -> int:
    """Get estimated time in minutes for a round type."""
    times = {
        "resume_deep_dive": 10,
        "system_design": 25,
        "ml_system_design": 25,
        "infrastructure_design": 20,
        "coding": 20,
        "behavioral": 15,
        "architecture": 20,
        "debugging": 15,
        "domain_knowledge": 15,
        "product_sense": 20,
        "design_critique": 20,
        "portfolio": 15,
        "process": 15,
        "analytics": 15,
    }
    return times.get(area, 15)


# Backward compatibility
InterviewPlan = InterviewBlueprint  # Alias for old code
