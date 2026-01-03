"""
DORA (Digital Operational Resilience Act) mapping for SOC 2 controls.

Maps SOC 2 Trust Services Criteria (TSC) controls to DORA articles
to calculate compliance coverage.
"""

from typing import Any
from .types import ControlExtraction, DORAMapping, DORACoverageResult


# ============================================================================
# DORA Article to SOC 2 TSC Mapping Matrix
# ============================================================================

DORA_TO_TSC_MAPPING = {
    # Chapter II - ICT Risk Management
    "Article 5": {
        "title": "ICT risk management framework",
        "tsc_categories": ["CC1", "CC3", "CC4", "CC9"],
        "weight": 1.0,
        "description": "Governance and accountability for ICT risk management",
    },
    "Article 6": {
        "title": "ICT systems, protocols and tools",
        "tsc_categories": ["CC6", "CC7", "CC8", "A"],
        "weight": 1.0,
        "description": "ICT systems resilience and protection",
    },
    "Article 7": {
        "title": "Identification",
        "tsc_categories": ["CC3", "CC6"],
        "weight": 0.8,
        "description": "Identification of ICT risks and business functions",
    },
    "Article 8": {
        "title": "Protection and prevention",
        "tsc_categories": ["CC5", "CC6", "CC7", "C"],
        "weight": 1.0,
        "description": "ICT security policies and access controls",
    },
    "Article 9": {
        "title": "Detection",
        "tsc_categories": ["CC7", "CC4"],
        "weight": 0.8,
        "description": "Detection of anomalous activities and incidents",
    },
    "Article 10": {
        "title": "Response and recovery",
        "tsc_categories": ["CC7", "CC9", "A"],
        "weight": 1.0,
        "description": "Incident response and recovery procedures",
    },
    "Article 11": {
        "title": "Backup policies and procedures",
        "tsc_categories": ["A", "CC7", "CC9"],
        "weight": 0.9,
        "description": "Data backup and restoration",
    },
    "Article 12": {
        "title": "Learning and evolving",
        "tsc_categories": ["CC4", "CC3"],
        "weight": 0.6,
        "description": "Lessons learned and continuous improvement",
    },
    "Article 13": {
        "title": "Communication",
        "tsc_categories": ["CC2", "CC7"],
        "weight": 0.7,
        "description": "Crisis communication procedures",
    },

    # Chapter III - ICT Incident Reporting
    "Article 17": {
        "title": "ICT-related incident management process",
        "tsc_categories": ["CC7", "CC2"],
        "weight": 1.0,
        "description": "Incident classification and management",
    },
    "Article 18": {
        "title": "Classification of ICT-related incidents",
        "tsc_categories": ["CC7"],
        "weight": 0.8,
        "description": "Incident classification criteria",
    },
    "Article 19": {
        "title": "Reporting of major ICT-related incidents",
        "tsc_categories": ["CC7", "CC2"],
        "weight": 1.0,
        "description": "Regulatory incident reporting",
    },

    # Chapter IV - Digital Operational Resilience Testing
    "Article 24": {
        "title": "General requirements for testing",
        "tsc_categories": ["CC4", "CC7", "A"],
        "weight": 0.9,
        "description": "Testing program requirements",
    },
    "Article 25": {
        "title": "Testing of ICT tools and systems",
        "tsc_categories": ["CC7", "CC8", "A"],
        "weight": 0.8,
        "description": "Vulnerability assessments and testing",
    },

    # Chapter V - Third-Party Risk Management
    "Article 28": {
        "title": "General principles for third-party risk",
        "tsc_categories": ["CC9"],
        "weight": 1.0,
        "description": "Third-party ICT risk management strategy",
    },
    "Article 29": {
        "title": "Preliminary assessment of ICT concentration risk",
        "tsc_categories": ["CC3", "CC9"],
        "weight": 0.8,
        "description": "Concentration risk assessment",
    },
    "Article 30": {
        "title": "Key contractual provisions",
        "tsc_categories": ["CC9"],
        "weight": 0.9,
        "description": "Contract requirements for ICT services",
    },

    # Chapter VI - Information Sharing
    "Article 45": {
        "title": "Information sharing arrangements",
        "tsc_categories": ["CC2", "CC7"],
        "weight": 0.5,
        "description": "Threat intelligence sharing",
    },
}


# ============================================================================
# TSC Category Keywords for Fuzzy Matching
# ============================================================================

TSC_CATEGORY_KEYWORDS = {
    "CC1": ["governance", "accountability", "oversight", "board", "ethics", "integrity", "values"],
    "CC2": ["communication", "information", "policies", "procedures", "internal control"],
    "CC3": ["risk assessment", "risk identification", "risk analysis", "risk mitigation"],
    "CC4": ["monitoring", "evaluation", "ongoing", "assessment", "review"],
    "CC5": ["access control", "segregation", "authorization", "approval", "control activities"],
    "CC6": ["logical access", "physical access", "authentication", "identity", "credentials", "badge"],
    "CC7": ["incident", "detection", "response", "recovery", "operations", "security events"],
    "CC8": ["change management", "deployment", "infrastructure", "software changes", "release"],
    "CC9": ["vendor", "third-party", "business continuity", "disaster recovery", "outsourcing"],
    "A": ["availability", "uptime", "redundancy", "failover", "disaster recovery", "backup"],
    "PI": ["processing integrity", "accuracy", "completeness", "validity", "timeliness"],
    "C": ["confidentiality", "classification", "encryption", "data protection", "sensitive"],
    "P": ["privacy", "personal information", "PII", "consent", "data subject", "GDPR"],
}


def map_controls_to_dora(controls: list[ControlExtraction]) -> list[DORAMapping]:
    """
    Map SOC 2 controls to DORA articles based on TSC categories.

    Returns a list of mappings with coverage levels:
    - full: Multiple controls fully address the DORA article
    - partial: Some controls partially address the DORA article
    - none: No controls address the DORA article
    """
    mappings = []

    # Group controls by TSC category
    controls_by_category: dict[str, list[ControlExtraction]] = {}
    for control in controls:
        category = control.tsc_category.upper()
        if category not in controls_by_category:
            controls_by_category[category] = []
        controls_by_category[category].append(control)

    # Map each DORA article
    for article, info in DORA_TO_TSC_MAPPING.items():
        article_controls = []
        for tsc_cat in info["tsc_categories"]:
            if tsc_cat in controls_by_category:
                article_controls.extend(controls_by_category[tsc_cat])

        if len(article_controls) == 0:
            coverage_level = "none"
            confidence = 0.0
            best_control = ""
        elif len(article_controls) >= len(info["tsc_categories"]) * 2:
            coverage_level = "full"
            confidence = 0.95
            best_control = article_controls[0].control_id
        elif len(article_controls) >= len(info["tsc_categories"]):
            coverage_level = "full"
            confidence = 0.85
            best_control = article_controls[0].control_id
        else:
            coverage_level = "partial"
            confidence = 0.6 + (len(article_controls) / len(info["tsc_categories"])) * 0.25
            best_control = article_controls[0].control_id if article_controls else ""

        mappings.append(DORAMapping(
            dora_article=article,
            dora_control_id=article,
            coverage_level=coverage_level,
            confidence=confidence,
            soc2_control_id=best_control,
        ))

    return mappings


def calculate_dora_coverage(mappings: list[DORAMapping]) -> DORACoverageResult:
    """
    Calculate overall DORA compliance coverage from mappings.

    Returns coverage scores by article and overall percentage.
    """
    if not mappings:
        return DORACoverageResult(
            overall_score=0.0,
            articles_covered=0,
            articles_total=len(DORA_TO_TSC_MAPPING),
            coverage_by_article={},
        )

    coverage_by_article = {}
    weighted_score = 0.0
    total_weight = 0.0
    articles_covered = 0

    for mapping in mappings:
        article_info = DORA_TO_TSC_MAPPING.get(mapping.dora_article, {})
        weight = article_info.get("weight", 1.0)

        coverage_score = {
            "full": 1.0,
            "partial": 0.5,
            "none": 0.0,
        }.get(mapping.coverage_level, 0.0)

        weighted_score += coverage_score * weight * mapping.confidence
        total_weight += weight

        if mapping.coverage_level in ("full", "partial"):
            articles_covered += 1

        coverage_by_article[mapping.dora_article] = {
            "title": article_info.get("title", ""),
            "coverage_level": mapping.coverage_level,
            "confidence": mapping.confidence,
            "soc2_control": mapping.soc2_control_id,
            "weight": weight,
        }

    overall_score = weighted_score / total_weight if total_weight > 0 else 0.0

    return DORACoverageResult(
        overall_score=round(overall_score, 3),
        articles_covered=articles_covered,
        articles_total=len(DORA_TO_TSC_MAPPING),
        coverage_by_article=coverage_by_article,
    )


def get_dora_gaps(coverage: DORACoverageResult) -> list[dict[str, Any]]:
    """
    Identify DORA articles with gaps (none or partial coverage).

    Returns list of gaps with remediation suggestions.
    """
    gaps = []

    for article, data in coverage.coverage_by_article.items():
        if data["coverage_level"] in ("none", "partial"):
            article_info = DORA_TO_TSC_MAPPING.get(article, {})
            gaps.append({
                "article": article,
                "title": article_info.get("title", ""),
                "description": article_info.get("description", ""),
                "coverage_level": data["coverage_level"],
                "required_tsc_categories": article_info.get("tsc_categories", []),
                "remediation": f"Implement controls addressing {', '.join(article_info.get('tsc_categories', []))} to meet {article} requirements.",
            })

    return sorted(gaps, key=lambda x: DORA_TO_TSC_MAPPING.get(x["article"], {}).get("weight", 0), reverse=True)
