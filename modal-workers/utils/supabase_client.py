"""
Supabase client for Modal workers.

Handles database operations for:
- Reading documents from storage
- Updating extraction job progress
- Storing parsed results
- Creating vendor assessments
"""

from datetime import datetime
from typing import Any, Optional
from supabase import create_client, Client
import httpx


class SupabaseClient:
    """
    Async Supabase client for Modal workers.
    Uses service role key for full database access.
    """

    def __init__(self, url: str, service_key: str):
        """
        Initialize Supabase client.

        Args:
            url: Supabase project URL
            service_key: Service role key (bypasses RLS)
        """
        self.url = url
        self.service_key = service_key
        self.client: Client = create_client(url, service_key)

    # ========================================================================
    # Document Operations
    # ========================================================================

    def get_document(self, document_id: str) -> Optional[dict[str, Any]]:
        """Get document metadata by ID."""
        try:
            response = self.client.table("documents").select(
                "id, filename, storage_path, mime_type, type, vendor_id, organization_id"
            ).eq("id", document_id).limit(1).execute()

            if response is None:
                raise ValueError(f"Supabase returned None response for document {document_id}")

            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            raise ValueError(f"Failed to get document {document_id}: {type(e).__name__}: {e}")

    def download_document(self, storage_path: str) -> bytes:
        """Download document from Supabase Storage."""
        response = self.client.storage.from_("documents").download(storage_path)
        return response

    # ========================================================================
    # Extraction Job Operations
    # ========================================================================

    def create_extraction_job(
        self,
        document_id: str,
        organization_id: str,
    ) -> str:
        """Create a new extraction job and return its ID."""
        response = self.client.table("extraction_jobs").insert({
            "document_id": document_id,
            "organization_id": organization_id,
            "status": "pending",
            "progress_percentage": 0,
            "current_phase": "initializing",
            "current_message": "Starting extraction",
        }).execute()

        return response.data[0]["id"]

    def update_job_progress(
        self,
        job_id: str,
        status: str,
        progress: int,
        phase: Optional[str] = None,
        message: Optional[str] = None,
        expected_controls: Optional[int] = None,
        extracted_controls: Optional[int] = None,
        api_calls_count: Optional[int] = None,
        extraction_strategy: Optional[str] = None,
    ) -> None:
        """Update extraction job progress."""
        update_data: dict[str, Any] = {
            "status": status,
            "progress_percentage": progress,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if phase:
            update_data["current_phase"] = phase
        if message:
            update_data["current_message"] = message
        if expected_controls is not None:
            update_data["expected_controls"] = expected_controls
        if extracted_controls is not None:
            update_data["extracted_controls"] = extracted_controls
        if api_calls_count is not None:
            update_data["api_calls_count"] = api_calls_count
        if extraction_strategy:
            update_data["extraction_strategy"] = extraction_strategy

        self.client.table("extraction_jobs").update(update_data).eq("id", job_id).execute()

    def complete_job(
        self,
        job_id: str,
        parsed_soc2_id: str,
        extracted_controls: int,
        token_usage: dict[str, int],
    ) -> None:
        """Mark job as complete with results."""
        self.client.table("extraction_jobs").update({
            "status": "complete",
            "progress_percentage": 100,
            "current_phase": "complete",
            "current_message": "Extraction complete",
            "parsed_soc2_id": parsed_soc2_id,
            "extracted_controls": extracted_controls,
            "token_usage": token_usage,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job_id).execute()

    def fail_job(self, job_id: str, error_message: str) -> None:
        """Mark job as failed with error message."""
        self.client.table("extraction_jobs").update({
            "status": "failed",
            "current_phase": "failed",
            "current_message": error_message[:500],  # Limit message length
            "error_message": error_message,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job_id).execute()

    # ========================================================================
    # Parsed SOC 2 Operations
    # ========================================================================

    def check_existing_parse(self, document_id: str) -> Optional[dict[str, Any]]:
        """Check if document has already been parsed."""
        try:
            response = self.client.table("parsed_soc2").select(
                "id, created_at"
            ).eq("document_id", document_id).limit(1).execute()

            if response is None:
                raise ValueError(f"Supabase returned None for existing parse check {document_id}")

            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            raise ValueError(f"Failed to check existing parse {document_id}: {type(e).__name__}: {e}")

    def insert_parsed_soc2(
        self,
        document_id: str,
        record: dict[str, Any],
    ) -> str:
        """Insert parsed SOC 2 data and return ID."""
        insert_data = {
            "document_id": document_id,
            **record,
        }

        response = self.client.table("parsed_soc2").insert(insert_data).execute()
        return response.data[0]["id"]

    def update_document_ai_analysis(
        self,
        document_id: str,
        parsed_id: str,
        parser_version: str,
        processing_time_ms: int,
    ) -> None:
        """Update document with AI analysis metadata."""
        self.client.table("documents").update({
            "ai_analysis": {
                "parsed": True,
                "parsedAt": datetime.utcnow().isoformat(),
                "parsedId": parsed_id,
                "parserVersion": parser_version,
                "processingTimeMs": processing_time_ms,
            },
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", document_id).execute()

    # ========================================================================
    # Evidence Locations
    # ========================================================================

    def insert_evidence_locations(
        self,
        organization_id: str,
        document_id: str,
        locations: list[dict[str, Any]],
    ) -> None:
        """Insert evidence location records for traceability."""
        if not locations:
            return

        records = [
            {
                "organization_id": organization_id,
                "source_document_id": document_id,
                **loc,
            }
            for loc in locations
        ]

        self.client.table("evidence_locations").insert(records).execute()

    # ========================================================================
    # Vendor Assessments
    # ========================================================================

    def get_dora_framework_id(self) -> Optional[str]:
        """Get DORA framework ID."""
        try:
            response = self.client.table("frameworks").select(
                "id"
            ).eq("code", "dora").limit(1).execute()

            if response and response.data and len(response.data) > 0:
                return response.data[0]["id"]
            return None
        except Exception as e:
            print(f"Warning: Failed to get DORA framework ID: {e}")
            return None

    def get_framework_controls(self, framework_id: str) -> list[dict[str, Any]]:
        """Get all controls for a framework."""
        response = self.client.table("framework_controls").select(
            "id, control_id"
        ).eq("framework_id", framework_id).execute()

        return response.data or []

    def upsert_vendor_assessments(
        self,
        assessments: list[dict[str, Any]],
    ) -> None:
        """Upsert vendor control assessments."""
        if not assessments:
            return

        self.client.table("vendor_control_assessments").upsert(
            assessments,
            on_conflict="vendor_id,control_id,organization_id,valid_from",
        ).execute()
