"""
Interview Intelligence Extractor

Transforms parsed resume data into actionable interview insights.
This module analyzes resume content and generates a structured
'interview fingerprint' that guides question generation.
"""

import json
import re
from typing import Dict, List, Any, Optional


class InterviewIntelligence:
    """Structured intelligence extracted from a resume for interview generation."""
    
    def __init__(self, parsed_resume: dict):
        self.raw = parsed_resume
        self.standard_fields = self._extract_standard_fields()
        self.intelligence = self._generate_intelligence()
    
    def _extract_standard_fields(self) -> dict:
        """Extract standard resume fields."""
        return {
            "name": self.raw.get("name", "Candidate"),
            "email": self.raw.get("email", ""),
            "phone": self.raw.get("phone", ""),
            "skills": self.raw.get("skills", []),
            "education": self.raw.get("education", []),
            "experience": self.raw.get("experience", []),
            "projects": self.raw.get("projects", []),
        }
    
    def _generate_intelligence(self) -> dict:
        """Generate interview intelligence from resume data."""
        exp = self.standard_fields["experience"]
        projects = self.standard_fields["projects"]
        skills = self.standard_fields["skills"]
        
        # Extract deep dive topics
        deep_dive_topics = self._extract_deep_dive_topics(exp, projects)
        
        # Identify claimed expertise (skills mentioned prominently)
        claimed_expertise = self._identify_claimed_expertise(exp, projects, skills)
        
        # Find vague areas (descriptions lacking specifics)
        vague_areas = self._find_vague_areas(exp, projects)
        
        # Detect architecture signals
        architecture_signals = self._detect_architecture_signals(exp, projects)
        
        # Leadership indicators
        leadership_indicators = self._detect_leadership(exp, projects)
        
        # Metric gaps
        metric_gaps = self._find_metric_gaps(exp, projects)
        
        # Technology stack depth analysis
        tech_depth = self._analyze_tech_depth(skills, exp, projects)
        
        return {
            "deep_dive_topics": deep_dive_topics,
            "claimed_expertise": claimed_expertise,
            "vague_areas": vague_areas,
            "architecture_signals": architecture_signals,
            "leadership_indicators": leadership_indicators,
            "metric_gaps": metric_gaps,
            "tech_depth": tech_depth,
            "years_experience": self._estimate_years_experience(exp),
            "strongest_project": self._find_strongest_project(projects, exp),
        }
    
    def _extract_deep_dive_topics(self, experience: list, projects: list) -> List[dict]:
        """Extract 3-5 specific technical areas worth probing deeply."""
        topics = []
        
        # From experience
        for job in experience[:2]:  # Top 2 jobs
            title = job.get("title", "")
            company = job.get("company", "")
            desc = job.get("description", "")
            tech = job.get("technologies", []) if isinstance(job.get("technologies"), list) else []
            
            if title and company:
                topics.append({
                    "area": f"{title} at {company}",
                    "context": desc[:200] if desc else "",
                    "technologies": tech[:5] if tech else [],
                    "type": "experience"
                })
        
        # From projects
        for proj in projects[:2]:  # Top 2 projects
            title = proj.get("title", "")
            tech = proj.get("tech", []) if isinstance(proj.get("tech"), list) else []
            desc = proj.get("description", "")
            
            if title:
                topics.append({
                    "area": f"Project: {title}",
                    "context": desc[:200] if desc else "",
                    "technologies": tech[:5] if tech else [],
                    "type": "project"
                })
        
        # Add skill-based topics for variety
        skills = self.standard_fields["skills"]
        if skills:
            topics.append({
                "area": f"Core skills: {', '.join(skills[:3])}",
                "context": "Proficiency and practical application",
                "technologies": skills[:5],
                "type": "skills"
            })
        
        return topics[:5]
    
    def _identify_claimed_expertise(self, experience: list, projects: list, skills: list) -> List[dict]:
        """Identify skills/expertise the candidate claims to be strong in."""
        expertise = []
        
        # Skills with strong language
        strong_keywords = ["expert", "advanced", "proficient", "deep", "extensive", "strong"]
        
        all_text = json.dumps(experience) + json.dumps(projects)
        all_text_lower = all_text.lower()
        
        for skill in skills:
            skill_lower = skill.lower()
            # Check if skill is mentioned with strong language nearby
            pattern = rf"(?:{'|'.join(strong_keywords)})\s+(?:in|with|at)?\s*{re.escape(skill_lower)}"
            if re.search(pattern, all_text_lower):
                expertise.append({
                    "skill": skill,
                    "confidence": "high",
                    "source": "explicit claim"
                })
            else:
                expertise.append({
                    "skill": skill,
                    "confidence": "medium",
                    "source": "listed"
                })
        
        return expertise[:8]
    
    def _find_vague_areas(self, experience: list, projects: list) -> List[dict]:
        """Find descriptions that lack specifics and should be probed."""
        vague = []
        vague_phrases = ["worked on", "helped with", "involved in", "assisted", "part of", "various"]
        
        for job in experience:
            desc = job.get("description", "")
            for phrase in vague_phrases:
                if phrase.lower() in desc.lower():
                    vague.append({
                        "location": f"Experience: {job.get('title', 'Unknown')}",
                        "phrase": phrase,
                        "context": desc[:150],
                        "probe": f"What specifically was your contribution to {job.get('title', 'this')}?"
                    })
                    break
        
        for proj in projects:
            desc = proj.get("description", "")
            for phrase in vague_phrases:
                if phrase.lower() in desc.lower():
                    vague.append({
                        "location": f"Project: {proj.get('title', 'Unknown')}",
                        "phrase": phrase,
                        "context": desc[:150],
                        "probe": f"What was your specific role in {proj.get('title', 'this project')}?"
                    })
                    break
        
        return vague[:4]
    
    def _detect_architecture_signals(self, experience: list, projects: list) -> List[dict]:
        """Detect mentions of systems, scaling, architecture decisions."""
        signals = []
        arch_keywords = ["architecture", "scale", "scalability", "microservices", "distributed", 
                         "database", "optimization", "performance", "latency", "throughput",
                         "load balancing", "caching", "queue", "pipeline", "infrastructure"]
        
        for job in experience:
            desc = job.get("description", "")
            for keyword in arch_keywords:
                if keyword.lower() in desc.lower():
                    signals.append({
                        "signal": keyword,
                        "context": f"{job.get('title', '')} at {job.get('company', '')}",
                        "type": "architecture"
                    })
        
        for proj in projects:
            desc = proj.get("description", "")
            for keyword in arch_keywords:
                if keyword.lower() in desc.lower():
                    signals.append({
                        "signal": keyword,
                        "context": f"Project: {proj.get('title', '')}",
                        "type": "architecture"
                    })
        
        # Deduplicate
        seen = set()
        unique_signals = []
        for s in signals:
            key = s["signal"].lower()
            if key not in seen:
                seen.add(key)
                unique_signals.append(s)
        
        return unique_signals[:6]
    
    def _detect_leadership(self, experience: list, projects: list) -> List[dict]:
        """Detect leadership and ownership indicators."""
        indicators = []
        lead_keywords = ["led", "managed", "mentored", "owned", "spearheaded", "architected",
                         "head of", "principal", "senior", "lead", "team lead", "tech lead"]
        
        all_items = experience + projects
        for item in all_items:
            desc = item.get("description", "")
            title = item.get("title", item.get("role", ""))
            
            text = f"{title} {desc}".lower()
            for keyword in lead_keywords:
                if keyword in text:
                    indicators.append({
                        "indicator": keyword,
                        "context": title or item.get("title", ""),
                        "type": "leadership"
                    })
        
        # Deduplicate
        seen = set()
        unique = []
        for i in indicators:
            key = i["indicator"].lower()
            if key not in seen:
                seen.add(key)
                unique.append(i)
        
        return unique[:5]
    
    def _find_metric_gaps(self, experience: list, projects: list) -> List[dict]:
        """Find places where metrics/results are missing."""
        gaps = []
        metric_patterns = r'\d+%|\d+x|\d+\s*(users?|requests?|seconds?|ms|million|billion|K|M|B)'
        
        for job in experience:
            desc = job.get("description", "")
            has_metrics = bool(re.search(metric_patterns, desc))
            if not has_metrics and len(desc) > 50:
                gaps.append({
                    "location": f"Experience: {job.get('title', '')}",
                    "issue": "No quantified impact or metrics",
                    "probe": "What was the measurable impact of your work?"
                })
        
        for proj in projects:
            desc = proj.get("description", "")
            has_metrics = bool(re.search(metric_patterns, desc))
            if not has_metrics and len(desc) > 50:
                gaps.append({
                    "location": f"Project: {proj.get('title', '')}",
                    "issue": "No quantified impact or metrics",
                    "probe": "What metrics did you use to measure success?"
                })
        
        return gaps[:4]
    
    def _analyze_tech_depth(self, skills: list, experience: list, projects: list) -> dict:
        """Analyze depth of technology experience."""
        all_text = json.dumps(experience) + json.dumps(projects)
        
        skill_mentions = {}
        for skill in skills:
            count = all_text.lower().count(skill.lower())
            skill_mentions[skill] = count
        
        # Sort by mention frequency
        sorted_skills = sorted(skill_mentions.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "primary_stack": [s[0] for s in sorted_skills[:3] if s[1] > 0],
            "secondary_stack": [s[0] for s in sorted_skills[3:6] if s[1] > 0],
            "mentioned_once": [s[0] for s in sorted_skills if s[1] == 1],
        }
    
    def _estimate_years_experience(self, experience: list) -> int:
        """Estimate years of experience from job entries."""
        if not experience:
            return 0
        
        total_years = 0
        for job in experience:
            duration = job.get("duration", "")
            # Try to extract years from duration string
            years_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:years?|yrs?)', duration.lower())
            if years_match:
                total_years += float(years_match.group(1))
            else:
                # Assume 1 year if no duration specified but entry exists
                total_years += 1
        
        return int(total_years)
    
    def _find_strongest_project(self, projects: list, experience: list) -> Optional[dict]:
        """Find the most substantial project/experience entry."""
        all_items = projects + experience
        if not all_items:
            return None
        
        # Score by description length + tech stack size
        def score_item(item):
            desc_len = len(item.get("description", ""))
            tech = item.get("tech", item.get("technologies", []))
            tech_count = len(tech) if isinstance(tech, list) else 0
            return desc_len + (tech_count * 50)
        
        strongest = max(all_items, key=score_item)
        return {
            "name": strongest.get("title", strongest.get("role", "Unknown")),
            "description": strongest.get("description", "")[:200],
            "technologies": strongest.get("tech", strongest.get("technologies", []))[:5],
        }
    
    def to_dict(self) -> dict:
        """Return full intelligence as dictionary."""
        return {
            **self.standard_fields,
            "interview_intelligence": self.intelligence,
        }
    
    def to_json(self) -> str:
        """Return as JSON string."""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)


def extract_interview_intelligence(parsed_resume: dict) -> InterviewIntelligence:
    """Convenience function to extract intelligence from parsed resume."""
    return InterviewIntelligence(parsed_resume)
