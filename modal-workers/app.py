"""
Modal Application for SOC 2 Document Parsing.

Exposes a FastAPI endpoint that receives parsing requests from Vercel
and processes them asynchronously using Gemini 2.5 Flash.

Architecture:
    Vercel (fast) → Modal (long-running) → Supabase (data)

Usage:
    # Deploy to Modal
    modal deploy app.py

    # Run locally for development
    modal serve app.py
"""

import asyncio
import os
from datetime import datetime
from typing import Optional

import modal
from pydantic import BaseModel


# ============================================================================
# Modal App Configuration
# ============================================================================

# Create Modal app
app = modal.App(
    name="dora-comply-soc2-parser",
    secrets=[
        modal.Secret.from_name("supabase-credentials"),
        modal.Secret.from_name("gemini-credentials"),
    ],
)

# Create container image with dependencies and local packages
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi>=0.109.0",
        "google-generativeai>=0.8.0",
        "supabase>=2.0.0",
        "httpx>=0.27.0",
        "pydantic>=2.5.0",
        "tenacity>=8.2.0",
    )
    .add_local_python_source("parsers")
    .add_local_python_source("utils")
)


# ============================================================================
# Request/Response Models
# ============================================================================

class ParseRequest(BaseModel):
    """Request body for parse-soc2 endpoint."""
    document_id: str
    job_id: str
    organization_id: str


class ParseResponse(BaseModel):
    """Response body for parse-soc2 endpoint."""
    success: bool
    message: str
    job_id: str
    parsed_id: Optional[str] = None
    error: Optional[str] = None
    processing_time_ms: Optional[int] = None


class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str
    version: str
    timestamp: str


# ============================================================================
# Modal Functions
# ============================================================================

@app.function(
    image=image,
    timeout=3600,  # 1 hour timeout (most docs finish in <2 minutes)
    memory=2048,   # 2GB memory
    cpu=1.0,       # 1 CPU core
)
async def parse_soc2_document(
    document_id: str,
    job_id: str,
    organization_id: str,
) -> dict:
    """
    Parse a SOC 2 document using Gemini 2.5 Flash.

    This function:
    1. Downloads the PDF from Supabase Storage
    2. Updates job progress via Supabase Realtime
    3. Extracts data using optimized Gemini prompts
    4. Stores results in parsed_soc2 table
    5. Creates vendor assessments if applicable

    Args:
        document_id: UUID of the document to parse
        job_id: UUID of the extraction job for progress tracking
        organization_id: UUID of the organization

    Returns:
        Dict with success status, parsed_id, and statistics
    """
    import time
    start_time = time.time()

    # Import modules (done inside function for Modal compatibility)
    from parsers import OptimizedSOC2Parser
    from utils import SupabaseClient

    # Get credentials from Modal secrets
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_KEY"]
    gemini_api_key = os.environ["GEMINI_API_KEY"]

    # Initialize clients
    supabase = SupabaseClient(supabase_url, supabase_key)
    parser = OptimizedSOC2Parser(gemini_api_key)

    try:
        # Update job status: starting
        supabase.update_job_progress(
            job_id=job_id,
            status="analyzing",
            progress=5,
            phase="starting",
            message="Initializing parser",
        )

        # Get document metadata
        document = supabase.get_document(document_id)
        if not document:
            raise ValueError(f"Document not found: {document_id}")

        # Check if already parsed
        existing = supabase.check_existing_parse(document_id)
        if existing:
            supabase.complete_job(
                job_id=job_id,
                parsed_soc2_id=existing["id"],
                extracted_controls=0,
                token_usage={"input": 0, "output": 0, "cached": 0},
            )
            return {
                "success": True,
                "message": "Document already parsed",
                "parsed_id": existing["id"],
                "already_parsed": True,
            }

        # Download PDF
        supabase.update_job_progress(
            job_id=job_id,
            status="analyzing",
            progress=10,
            phase="downloading",
            message="Downloading document",
        )

        pdf_bytes = supabase.download_document(document["storage_path"])

        # Progress callback for real-time updates
        def on_progress(phase: str, percentage: int, message: str = None):
            status_map = {
                "analyzing": "analyzing",
                "extracting": "extracting",
                "processing": "verifying",
                "complete": "mapping",
                "failed": "failed",
            }
            supabase.update_job_progress(
                job_id=job_id,
                status=status_map.get(phase, "extracting"),
                progress=percentage,
                phase=phase,
                message=message,
            )

        # Parse document
        result = await parser.parse(
            pdf_bytes=pdf_bytes,
            document_id=document_id,
            on_progress=on_progress,
        )

        if not result.success:
            raise ValueError(result.error or "Parsing failed")

        # Store parsed data
        supabase.update_job_progress(
            job_id=job_id,
            status="mapping",
            progress=85,
            phase="storing",
            message="Storing parsed data",
            extracted_controls=result.extracted_controls,
            extraction_strategy=result.extraction_strategy.value,
            api_calls_count=result.api_calls_count,
        )

        db_record = result.to_database_record()
        parsed_id = supabase.insert_parsed_soc2(document_id, db_record)

        # Update document metadata
        supabase.update_document_ai_analysis(
            document_id=document_id,
            parsed_id=parsed_id,
            parser_version=result.parser_version,
            processing_time_ms=result.processing_time_ms,
        )

        # Create evidence locations for traceability
        if result.data and result.data.controls:
            evidence_locations = []
            for control in result.data.controls:
                evidence_locations.append({
                    "evidence_type": "control",
                    "evidence_id": control.control_id,
                    "page_number": control.page_ref,
                    "section_reference": control.tsc_category,
                    "extracted_text": control.description[:2000],
                    "confidence": control.confidence,
                    "extraction_method": "ai",
                })

            supabase.insert_evidence_locations(
                organization_id=organization_id,
                document_id=document_id,
                locations=evidence_locations,
            )

        # Create vendor assessments if vendor_id exists
        if document.get("vendor_id") and result.dora_mappings:
            await _create_vendor_assessments(
                supabase=supabase,
                vendor_id=document["vendor_id"],
                organization_id=organization_id,
                document_id=document_id,
                dora_mappings=result.dora_mappings,
            )

        # Complete job
        supabase.complete_job(
            job_id=job_id,
            parsed_soc2_id=parsed_id,
            extracted_controls=result.extracted_controls,
            token_usage=result.token_usage.to_dict(),
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "success": True,
            "message": "Parsing complete",
            "parsed_id": parsed_id,
            "controls_extracted": result.extracted_controls,
            "extraction_strategy": result.extraction_strategy.value,
            "api_calls": result.api_calls_count,
            "processing_time_ms": processing_time_ms,
            "dora_coverage": result.dora_coverage.overall_score if result.dora_coverage else None,
        }

    except Exception as e:
        # Mark job as failed
        supabase.fail_job(job_id=job_id, error_message=str(e))

        return {
            "success": False,
            "message": "Parsing failed",
            "error": str(e),
            "processing_time_ms": int((time.time() - start_time) * 1000),
        }


async def _create_vendor_assessments(
    supabase,
    vendor_id: str,
    organization_id: str,
    document_id: str,
    dora_mappings: list,
):
    """Create vendor control assessments from DORA mappings."""
    from parsers.types import DORAMapping

    # Get DORA framework ID
    framework_id = supabase.get_dora_framework_id()
    if not framework_id:
        return

    # Get framework controls
    framework_controls = supabase.get_framework_controls(framework_id)
    if not framework_controls:
        return

    # Create control ID lookup
    control_lookup = {c["control_id"]: c["id"] for c in framework_controls}

    # Group mappings by article and get best coverage
    article_coverage = {}
    for mapping in dora_mappings:
        article = mapping.dora_article
        existing = article_coverage.get(article)
        coverage_rank = {"full": 3, "partial": 2, "none": 1}

        if not existing or coverage_rank.get(mapping.coverage_level, 0) > coverage_rank.get(existing["coverage"], 0):
            article_coverage[article] = {
                "coverage": mapping.coverage_level,
                "confidence": mapping.confidence,
                "evidence": mapping.soc2_control_id,
            }

    # Create assessments
    assessments = []
    today = datetime.utcnow().strftime("%Y-%m-%d")

    for article, data in article_coverage.items():
        control_id = control_lookup.get(article)
        if not control_id:
            continue

        status_map = {"full": "met", "partial": "partially_met", "none": "not_met"}

        assessments.append({
            "vendor_id": vendor_id,
            "control_id": control_id,
            "organization_id": organization_id,
            "status": status_map.get(data["coverage"], "not_met"),
            "evidence_document_id": document_id,
            "evidence_notes": f"SOC 2 control {data['evidence']} provides {data['coverage']} coverage",
            "confidence": data["confidence"],
            "assessment_source": "ai_parsed",
            "valid_from": today,
            "is_current": True,
        })

    if assessments:
        supabase.upsert_vendor_assessments(assessments)


# ============================================================================
# FastAPI Endpoints
# ============================================================================

@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="3.0.0-optimized",
        timestamp=datetime.utcnow().isoformat(),
    )


@app.function(image=image, timeout=10)
@modal.fastapi_endpoint(method="POST")
async def parse_soc2(request: ParseRequest) -> ParseResponse:
    """
    Trigger SOC 2 document parsing.

    This endpoint:
    1. Validates the request
    2. Spawns the parsing function asynchronously
    3. Returns immediately with job_id

    The actual parsing happens in the background and updates
    are sent via Supabase Realtime to the extraction_jobs table.
    """
    try:
        # Spawn the parsing function (fire-and-forget)
        # The .spawn() method returns immediately while the function runs in background
        parse_soc2_document.spawn(
            document_id=request.document_id,
            job_id=request.job_id,
            organization_id=request.organization_id,
        )

        return ParseResponse(
            success=True,
            message="Parsing started",
            job_id=request.job_id,
        )

    except Exception as e:
        return ParseResponse(
            success=False,
            message="Failed to start parsing",
            job_id=request.job_id,
            error=str(e),
        )


# ============================================================================
# Local Development Entry Point
# ============================================================================

@app.local_entrypoint()
def main():
    """Local development entry point."""
    print("SOC 2 Parser Modal App")
    print("=" * 40)
    print("Endpoints:")
    print("  GET  /health      - Health check")
    print("  POST /parse-soc2  - Start parsing")
    print()
    print("To deploy: modal deploy app.py")
    print("To serve:  modal serve app.py")
