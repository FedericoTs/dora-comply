"""
Type definitions for the SOC 2 parser.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Callable, Optional
from pydantic import BaseModel, Field


class ExtractionStrategy(str, Enum):
    """Extraction strategy based on document size."""
    SINGLE_PASS = "single_pass"      # <50 pages, 1 API call
    TWO_PASS = "two_pass"            # 50-100 pages, 2-3 calls with caching
    PARALLEL = "parallel"            # >100 pages, 3-4 parallel calls


class ReportType(str, Enum):
    TYPE1 = "type1"
    TYPE2 = "type2"


class OpinionType(str, Enum):
    UNQUALIFIED = "unqualified"
    QUALIFIED = "qualified"
    ADVERSE = "adverse"


class TestResult(str, Enum):
    OPERATING_EFFECTIVELY = "operating_effectively"
    EXCEPTION = "exception"
    NOT_TESTED = "not_tested"


class TrustServicesCriteria(str, Enum):
    SECURITY = "security"
    AVAILABILITY = "availability"
    PROCESSING_INTEGRITY = "processing_integrity"
    CONFIDENTIALITY = "confidentiality"
    PRIVACY = "privacy"


# ============================================================================
# Pydantic Models for Structured Output
# ============================================================================

class ControlExtraction(BaseModel):
    """Individual control extracted from SOC 2 report."""
    control_id: str = Field(..., description="Control identifier (e.g., CC1.1, A1.2)")
    tsc_category: str = Field(..., description="Trust Services Criteria category (CC1-CC9, A, PI, C, P)")
    description: str = Field(..., description="Full control description")
    test_result: TestResult = Field(..., description="Test result: operating_effectively, exception, not_tested")
    page_ref: Optional[int] = Field(None, description="Page number where control appears")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Extraction confidence score")


class ExceptionExtraction(BaseModel):
    """Exception/deviation extracted from SOC 2 report."""
    control_id: str = Field(..., description="Control ID with exception")
    control_area: Optional[str] = Field(None, description="Control area/category")
    description: str = Field(..., description="Exception description")
    management_response: Optional[str] = Field(None, description="Management's response")
    page_ref: Optional[int] = Field(None, description="Page number")


class SubserviceOrg(BaseModel):
    """Subservice organization referenced in SOC 2 report."""
    name: str = Field(..., description="Organization name")
    service_description: str = Field(..., description="Services provided")
    carve_out: bool = Field(False, description="Whether carved out of scope")
    page_ref: Optional[int] = Field(None, description="Page number")


class CUEC(BaseModel):
    """Complementary User Entity Control."""
    id: Optional[str] = Field(None, description="CUEC identifier if provided")
    description: str = Field(..., description="CUEC description")
    customer_responsibility: str = Field(..., description="Customer responsibility description")
    related_control: Optional[str] = Field(None, description="Related SOC 2 control ID")
    page_ref: Optional[int] = Field(None, description="Page number")


class ReportMetadata(BaseModel):
    """Metadata extracted from SOC 2 report."""
    report_type: ReportType = Field(..., description="Type 1 or Type 2 report")
    audit_firm: str = Field(..., description="CPA firm name")
    opinion: OpinionType = Field(..., description="Auditor's opinion")
    period_start: date = Field(..., description="Audit period start date")
    period_end: date = Field(..., description="Audit period end date")
    service_org_name: str = Field(..., description="Service organization name")
    trust_services_criteria: list[TrustServicesCriteria] = Field(
        default_factory=list,
        description="TSC categories covered"
    )
    system_description: Optional[str] = Field(None, description="Brief system description")


class FullExtractionResult(BaseModel):
    """Complete extraction result from SOC 2 report."""
    metadata: ReportMetadata
    controls: list[ControlExtraction] = Field(default_factory=list)
    exceptions: list[ExceptionExtraction] = Field(default_factory=list)
    subservice_orgs: list[SubserviceOrg] = Field(default_factory=list)
    cuecs: list[CUEC] = Field(default_factory=list)


# ============================================================================
# Result Types
# ============================================================================

@dataclass
class ExtractionProgress:
    """Progress update for extraction job."""
    phase: str
    percentage: int
    message: str
    controls_extracted: int = 0
    expected_controls: int = 0


@dataclass
class TokenUsage:
    """Token usage tracking for cost analysis."""
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0

    def to_dict(self) -> dict[str, int]:
        return {
            "input": self.input_tokens,
            "output": self.output_tokens,
            "cached": self.cached_tokens,
        }


@dataclass
class ConfidenceScores:
    """Confidence scores for extraction quality."""
    metadata: float = 0.9
    controls: float = 0.85
    exceptions: float = 0.9
    cuecs: float = 0.85
    overall: float = 0.87


@dataclass
class DORACoverageResult:
    """DORA compliance coverage analysis result."""
    overall_score: float
    articles_covered: int
    articles_total: int
    coverage_by_article: dict[str, dict[str, Any]]


@dataclass
class DORAMapping:
    """Mapping from SOC 2 control to DORA article."""
    dora_article: str
    dora_control_id: str
    coverage_level: str  # "full", "partial", "none"
    confidence: float
    soc2_control_id: str


@dataclass
class ParseResult:
    """Complete result from SOC 2 parsing."""
    success: bool
    document_id: str = ""

    # Extraction results
    data: Optional[FullExtractionResult] = None

    # Statistics
    extraction_strategy: ExtractionStrategy = ExtractionStrategy.SINGLE_PASS
    api_calls_count: int = 1
    processing_time_ms: int = 0
    token_usage: TokenUsage = field(default_factory=TokenUsage)

    # Quality metrics
    expected_controls: int = 0
    extracted_controls: int = 0
    completeness_rate: float = 0.0
    confidence_scores: ConfidenceScores = field(default_factory=ConfidenceScores)

    # DORA mapping
    dora_mappings: list[DORAMapping] = field(default_factory=list)
    dora_coverage: Optional[DORACoverageResult] = None

    # Error handling
    error: Optional[str] = None
    parser_version: str = "3.0.0-optimized"

    def to_database_record(self) -> dict[str, Any]:
        """Convert to database record format for parsed_soc2 table."""
        if not self.data:
            return {}

        return {
            "report_type": self.data.metadata.report_type.value,
            "audit_firm": self.data.metadata.audit_firm,
            "opinion": self.data.metadata.opinion.value,
            "period_start": self.data.metadata.period_start.isoformat(),
            "period_end": self.data.metadata.period_end.isoformat(),
            "criteria": [c.value for c in self.data.metadata.trust_services_criteria],
            "system_description": self.data.metadata.system_description,
            "controls": [
                {
                    "controlId": c.control_id,
                    "tscCategory": c.tsc_category,
                    "description": c.description,
                    "testResult": c.test_result.value,
                    "pageRef": c.page_ref,
                    "confidence": c.confidence,
                }
                for c in self.data.controls
            ],
            "exceptions": [
                {
                    "controlId": e.control_id,
                    "controlArea": e.control_area,
                    "exceptionDescription": e.description,
                    "managementResponse": e.management_response,
                    "pageRef": e.page_ref,
                }
                for e in self.data.exceptions
            ],
            "subservice_orgs": [
                {
                    "name": s.name,
                    "serviceDescription": s.service_description,
                    "carveOut": s.carve_out,
                    "pageRef": s.page_ref,
                }
                for s in self.data.subservice_orgs
            ],
            "cuecs": [
                {
                    "id": c.id,
                    "description": c.description,
                    "customerResponsibility": c.customer_responsibility,
                    "relatedControl": c.related_control,
                    "pageRef": c.page_ref,
                }
                for c in self.data.cuecs
            ],
            "raw_extraction": {
                "parserVersion": self.parser_version,
                "extractionStrategy": self.extraction_strategy.value,
                "apiCallsCount": self.api_calls_count,
                "processingTimeMs": self.processing_time_ms,
            },
            "confidence_scores": {
                "metadata": self.confidence_scores.metadata,
                "controls": self.confidence_scores.controls,
                "exceptions": self.confidence_scores.exceptions,
                "cuecs": self.confidence_scores.cuecs,
                "overall": self.confidence_scores.overall,
            },
        }


# Callback type for progress updates
ProgressCallback = Callable[[str, int, Optional[str]], None]
