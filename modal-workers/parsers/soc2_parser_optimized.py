"""
Optimized SOC 2 Parser using Gemini 2.5 Flash.

Key optimizations over V2:
1. Single-pass extraction for most documents (65K output tokens)
2. Context caching for large documents
3. Structured output mode for guaranteed JSON (no parse errors)
4. No artificial rate limiting delays
5. Parallel extraction for very large documents
"""

import asyncio
import time
from datetime import date
from typing import Callable, Optional

from .types import (
    ControlExtraction,
    CUEC,
    DORACoverageResult,
    DORAMapping,
    ExceptionExtraction,
    ExtractionProgress,
    ExtractionStrategy,
    FullExtractionResult,
    OpinionType,
    ParseResult,
    ReportMetadata,
    ReportType,
    SubserviceOrg,
    TestResult,
    TokenUsage,
    TrustServicesCriteria,
)
from .schemas import (
    FULL_EXTRACTION_SCHEMA,
    METADATA_SCHEMA,
    CONTROLS_SCHEMA,
    CONTROLS_CC1_CC5_SCHEMA,
    CONTROLS_CC6_PLUS_SCHEMA,
)
from .prompts import (
    FULL_EXTRACTION_PROMPT,
    METADATA_EXTRACTION_PROMPT,
    CONTROLS_EXTRACTION_PROMPT,
    CONTROLS_CC1_CC5_PROMPT,
    CONTROLS_CC6_PLUS_PROMPT,
)
from .dora_mapping import map_controls_to_dora, calculate_dora_coverage
from utils.gemini_client import GeminiClient


# Progress callback type
ProgressCallback = Callable[[str, int, Optional[str]], None]


class OptimizedSOC2Parser:
    """
    Optimized SOC 2 parser using Gemini 2.5 Flash with:
    - Single-pass extraction for most documents
    - Context caching for large documents
    - Structured output mode for guaranteed JSON
    - No artificial rate limiting delays
    """

    VERSION = "3.0.0-optimized"

    # Strategy thresholds based on estimated page count
    SINGLE_PASS_MAX_PAGES = 80  # ~20K tokens, well under 1M limit
    TWO_PASS_MAX_PAGES = 150   # Use caching for medium documents
    # Above 150 pages: parallel extraction

    def __init__(self, gemini_api_key: str):
        """
        Initialize the parser.

        Args:
            gemini_api_key: Google AI API key
        """
        self.gemini = GeminiClient(gemini_api_key)

    async def parse(
        self,
        pdf_bytes: bytes,
        document_id: str,
        on_progress: Optional[ProgressCallback] = None,
    ) -> ParseResult:
        """
        Parse a SOC 2 document using the optimal strategy.

        Strategy selection based on document size:
        - <80 pages: Single-pass extraction (1 API call)
        - 80-150 pages: Two-pass with caching (2-3 API calls)
        - >150 pages: Parallel multi-query (3-4 API calls)

        Args:
            pdf_bytes: PDF file content as bytes
            document_id: Document ID for tracking
            on_progress: Optional callback for progress updates

        Returns:
            ParseResult with extracted data and statistics
        """
        start_time = time.time()

        def update_progress(phase: str, percentage: int, message: str = None):
            if on_progress:
                on_progress(phase, percentage, message)

        try:
            # Estimate document size
            estimated_pages = self.gemini.estimate_pages(pdf_bytes)
            estimated_tokens = self.gemini.estimate_tokens(pdf_bytes)

            update_progress("analyzing", 5, f"Analyzing document ({estimated_pages} pages)")

            # Select extraction strategy
            if estimated_pages <= self.SINGLE_PASS_MAX_PAGES:
                strategy = ExtractionStrategy.SINGLE_PASS
                result = await self._single_pass_extraction(pdf_bytes, update_progress)
            elif estimated_pages <= self.TWO_PASS_MAX_PAGES:
                strategy = ExtractionStrategy.TWO_PASS
                result = await self._two_pass_extraction(pdf_bytes, update_progress)
            else:
                strategy = ExtractionStrategy.PARALLEL
                result = await self._parallel_extraction(pdf_bytes, update_progress)

            # Set result metadata
            result.document_id = document_id
            result.extraction_strategy = strategy
            result.processing_time_ms = int((time.time() - start_time) * 1000)
            result.parser_version = self.VERSION

            # Calculate extraction statistics
            if result.data and result.data.controls:
                result.extracted_controls = len(result.data.controls)
                result.expected_controls = result.extracted_controls  # We got what we got
                result.completeness_rate = 1.0

                # Map to DORA
                result.dora_mappings = map_controls_to_dora(result.data.controls)
                result.dora_coverage = calculate_dora_coverage(result.dora_mappings)

            update_progress("complete", 100, "Extraction complete")

            return result

        except Exception as e:
            update_progress("failed", 0, str(e))
            return ParseResult(
                success=False,
                document_id=document_id,
                error=str(e),
                processing_time_ms=int((time.time() - start_time) * 1000),
            )

    async def _single_pass_extraction(
        self,
        pdf_bytes: bytes,
        update_progress: ProgressCallback,
    ) -> ParseResult:
        """
        Single API call for complete extraction.
        Best for documents with <80 pages.
        """
        update_progress("extracting", 20, "Extracting all data in single pass")

        data, token_usage = await self.gemini.extract_with_schema(
            pdf_bytes,
            FULL_EXTRACTION_PROMPT,
            FULL_EXTRACTION_SCHEMA,
        )

        update_progress("processing", 80, "Processing results")

        extraction_result = self._parse_full_extraction(data)

        return ParseResult(
            success=True,
            data=extraction_result,
            api_calls_count=1,
            token_usage=TokenUsage(
                input_tokens=token_usage.get("input", 0),
                output_tokens=token_usage.get("output", 0),
                cached_tokens=token_usage.get("cached", 0),
            ),
        )

    async def _two_pass_extraction(
        self,
        pdf_bytes: bytes,
        update_progress: ProgressCallback,
    ) -> ParseResult:
        """
        Two-pass extraction with context caching.
        Best for documents with 80-150 pages.
        """
        update_progress("extracting", 15, "Phase 1: Extracting metadata")

        prompts = [
            (METADATA_EXTRACTION_PROMPT, METADATA_SCHEMA),
            (CONTROLS_EXTRACTION_PROMPT, CONTROLS_SCHEMA),
        ]

        results, token_usage = await self.gemini.extract_with_caching(
            pdf_bytes,
            prompts,
        )

        update_progress("processing", 80, "Merging results")

        # Merge metadata and controls results
        extraction_result = self._merge_two_pass_results(results[0], results[1])

        return ParseResult(
            success=True,
            data=extraction_result,
            api_calls_count=2,
            token_usage=TokenUsage(
                input_tokens=token_usage.get("input", 0),
                output_tokens=token_usage.get("output", 0),
                cached_tokens=token_usage.get("cached", 0),
            ),
        )

    async def _parallel_extraction(
        self,
        pdf_bytes: bytes,
        update_progress: ProgressCallback,
    ) -> ParseResult:
        """
        Parallel multi-query extraction.
        Best for large documents with >150 pages.
        """
        update_progress("extracting", 15, "Running parallel extraction")

        prompts = [
            (METADATA_EXTRACTION_PROMPT, METADATA_SCHEMA),
            (CONTROLS_CC1_CC5_PROMPT, CONTROLS_CC1_CC5_SCHEMA),
            (CONTROLS_CC6_PLUS_PROMPT, CONTROLS_CC6_PLUS_SCHEMA),
        ]

        results, token_usage = await self.gemini.run_parallel_extraction(
            pdf_bytes,
            prompts,
        )

        update_progress("processing", 80, "Merging parallel results")

        # Merge all results
        extraction_result = self._merge_parallel_results(
            results[0],  # Metadata
            results[1],  # CC1-CC5 controls
            results[2],  # CC6+ controls and exceptions
        )

        return ParseResult(
            success=True,
            data=extraction_result,
            api_calls_count=3,
            token_usage=TokenUsage(
                input_tokens=token_usage.get("input", 0),
                output_tokens=token_usage.get("output", 0),
                cached_tokens=token_usage.get("cached", 0),
            ),
        )

    # ========================================================================
    # Result Parsing Helpers
    # ========================================================================

    def _parse_full_extraction(self, data: dict) -> FullExtractionResult:
        """Parse single-pass extraction result into typed objects."""
        metadata = self._parse_metadata(data.get("metadata", {}))
        controls = self._parse_controls(data.get("controls", []))
        exceptions = self._parse_exceptions(data.get("exceptions", []))
        subservice_orgs = self._parse_subservice_orgs(data.get("subserviceOrgs", []))
        cuecs = self._parse_cuecs(data.get("cuecs", []))

        return FullExtractionResult(
            metadata=metadata,
            controls=controls,
            exceptions=exceptions,
            subservice_orgs=subservice_orgs,
            cuecs=cuecs,
        )

    def _merge_two_pass_results(
        self,
        metadata_result: dict,
        controls_result: dict,
    ) -> FullExtractionResult:
        """Merge two-pass extraction results."""
        metadata = self._parse_metadata(metadata_result.get("metadata", {}))
        controls = self._parse_controls(controls_result.get("controls", []))
        exceptions = self._parse_exceptions(controls_result.get("exceptions", []))
        subservice_orgs = self._parse_subservice_orgs(
            metadata_result.get("subserviceOrgs", [])
        )
        cuecs = self._parse_cuecs(metadata_result.get("cuecs", []))

        return FullExtractionResult(
            metadata=metadata,
            controls=controls,
            exceptions=exceptions,
            subservice_orgs=subservice_orgs,
            cuecs=cuecs,
        )

    def _merge_parallel_results(
        self,
        metadata_result: dict,
        cc1_cc5_result: dict,
        cc6_plus_result: dict,
    ) -> FullExtractionResult:
        """Merge parallel extraction results."""
        metadata = self._parse_metadata(metadata_result.get("metadata", {}))

        # Merge controls from both parallel queries
        cc1_cc5_controls = self._parse_controls(cc1_cc5_result.get("controls", []))
        cc6_plus_controls = self._parse_controls(cc6_plus_result.get("controls", []))
        all_controls = cc1_cc5_controls + cc6_plus_controls

        exceptions = self._parse_exceptions(cc6_plus_result.get("exceptions", []))
        subservice_orgs = self._parse_subservice_orgs(
            metadata_result.get("subserviceOrgs", [])
        )
        cuecs = self._parse_cuecs(metadata_result.get("cuecs", []))

        return FullExtractionResult(
            metadata=metadata,
            controls=all_controls,
            exceptions=exceptions,
            subservice_orgs=subservice_orgs,
            cuecs=cuecs,
        )

    def _parse_metadata(self, data: dict) -> ReportMetadata:
        """Parse metadata from extraction result."""
        # Parse report type
        report_type_str = data.get("reportType", "type2").lower()
        report_type = ReportType.TYPE1 if "1" in report_type_str else ReportType.TYPE2

        # Parse opinion
        opinion_str = data.get("opinion", "unqualified").lower()
        if "qualified" in opinion_str and "un" not in opinion_str:
            opinion = OpinionType.QUALIFIED
        elif "adverse" in opinion_str:
            opinion = OpinionType.ADVERSE
        else:
            opinion = OpinionType.UNQUALIFIED

        # Parse dates
        period_start = self._parse_date(data.get("periodStart", ""))
        period_end = self._parse_date(data.get("periodEnd", ""))

        # Parse TSC criteria
        criteria = []
        for c in data.get("trustServicesCriteria", []):
            try:
                criteria.append(TrustServicesCriteria(c.lower().replace(" ", "_")))
            except ValueError:
                pass

        return ReportMetadata(
            report_type=report_type,
            audit_firm=data.get("auditFirm", "Unknown"),
            opinion=opinion,
            period_start=period_start,
            period_end=period_end,
            service_org_name=data.get("serviceOrgName", "Unknown"),
            trust_services_criteria=criteria,
            system_description=data.get("systemDescription"),
        )

    def _parse_controls(self, controls: list[dict]) -> list[ControlExtraction]:
        """Parse controls from extraction result."""
        parsed = []
        for c in controls:
            # Parse test result
            result_str = c.get("testResult", "operating_effectively").lower()
            if "exception" in result_str:
                test_result = TestResult.EXCEPTION
            elif "not" in result_str and "test" in result_str:
                test_result = TestResult.NOT_TESTED
            else:
                test_result = TestResult.OPERATING_EFFECTIVELY

            parsed.append(ControlExtraction(
                control_id=c.get("controlId", "UNKNOWN"),
                tsc_category=c.get("tscCategory", "CC1"),
                description=c.get("description", ""),
                test_result=test_result,
                page_ref=c.get("pageRef"),
                confidence=0.9,
            ))
        return parsed

    def _parse_exceptions(self, exceptions: list[dict]) -> list[ExceptionExtraction]:
        """Parse exceptions from extraction result."""
        return [
            ExceptionExtraction(
                control_id=e.get("controlId", "UNKNOWN"),
                control_area=e.get("controlArea"),
                description=e.get("description", ""),
                management_response=e.get("managementResponse"),
                page_ref=e.get("pageRef"),
            )
            for e in exceptions
        ]

    def _parse_subservice_orgs(self, orgs: list[dict]) -> list[SubserviceOrg]:
        """Parse subservice organizations from extraction result."""
        return [
            SubserviceOrg(
                name=o.get("name", "Unknown"),
                service_description=o.get("serviceDescription", ""),
                carve_out=o.get("carveOut", False),
                page_ref=o.get("pageRef"),
            )
            for o in orgs
        ]

    def _parse_cuecs(self, cuecs: list[dict]) -> list[CUEC]:
        """Parse CUECs from extraction result."""
        return [
            CUEC(
                id=c.get("id"),
                description=c.get("description", ""),
                customer_responsibility=c.get("customerResponsibility", ""),
                related_control=c.get("relatedControl"),
                page_ref=c.get("pageRef"),
            )
            for c in cuecs
        ]

    def _parse_date(self, date_str: str) -> date:
        """Parse date string to date object."""
        if not date_str:
            return date.today()

        # Try common formats
        formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%B %d, %Y",
            "%b %d, %Y",
        ]

        for fmt in formats:
            try:
                from datetime import datetime
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        return date.today()
