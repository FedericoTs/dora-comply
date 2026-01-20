"""
Questionnaire Document Parser for Modal.

Extracts answers from security documents (SOC 2, ISO 27001, policies)
to auto-fill NIS2 vendor questionnaire answers using Gemini AI.
"""

import json
import io
import asyncio
from datetime import datetime
from dataclasses import dataclass, field
from typing import Any, Optional, Callable

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential


@dataclass
class ExtractedAnswer:
    """Single extracted answer."""
    question_id: str
    answer: str
    confidence: float
    citation: str
    extraction_notes: Optional[str] = None


@dataclass
class ExtractionResult:
    """Result of document extraction."""
    success: bool
    extracted_answers: list[ExtractedAnswer] = field(default_factory=list)
    total_questions: int = 0
    high_confidence_count: int = 0
    medium_confidence_count: int = 0
    low_confidence_count: int = 0
    avg_confidence: float = 0.0
    error: Optional[str] = None
    processing_time_ms: int = 0
    token_usage: dict[str, int] = field(default_factory=dict)


class QuestionnaireParser:
    """
    Parser for extracting questionnaire answers from security documents.
    Optimized for SOC 2 reports, ISO 27001 certificates, and security policies.
    """

    MODEL_NAME = "gemini-2.0-flash"
    MAX_OUTPUT_TOKENS = 8192
    CONFIDENCE_THRESHOLD = 0.6

    def __init__(self, api_key: str):
        """Initialize parser with Gemini API key."""
        genai.configure(api_key=api_key)
        self.api_key = api_key

    def _create_model(self, schema: Optional[dict] = None) -> genai.GenerativeModel:
        """Create Gemini model with optional structured output."""
        generation_config = {
            "temperature": 0,  # Deterministic for compliance
            "max_output_tokens": self.MAX_OUTPUT_TOKENS,
        }

        if schema:
            generation_config["response_mime_type"] = "application/json"
            generation_config["response_schema"] = schema

        return genai.GenerativeModel(
            model_name=self.MODEL_NAME,
            generation_config=generation_config,
        )

    def _build_extraction_prompt(
        self,
        questions: list[dict],
        document_type: str
    ) -> str:
        """Build the extraction prompt for Gemini."""

        # Format questions for the prompt
        question_list = []
        for q in questions:
            q_text = f"- ID: {q['id']}"
            q_text += f"\n  Question: {q['question_text']}"
            q_text += f"\n  Type: {q['question_type']}"
            if q.get('help_text'):
                q_text += f"\n  Context: {q['help_text']}"
            if q.get('options'):
                opts = ", ".join([o['value'] for o in q['options']])
                q_text += f"\n  Valid options: {opts}"
            question_list.append(q_text)

        questions_formatted = "\n\n".join(question_list)

        document_context = {
            "soc2": "This is a SOC 2 Type I or Type II audit report. Look for Trust Services Criteria, control descriptions, and auditor testing results.",
            "iso27001": "This is an ISO 27001 certificate or ISMS documentation. Look for certification scope, controls implemented, and policy statements.",
            "policy": "This is a security policy document. Look for policy statements, procedures, and compliance commitments.",
            "certificate": "This is a certification or compliance document. Look for scope, validity, and compliance claims.",
            "other": "This is a general security document. Extract any relevant compliance information.",
        }.get(document_type, "Extract any relevant compliance information.")

        return f"""You are an expert compliance analyst extracting answers from security documentation.

DOCUMENT TYPE: {document_type}
CONTEXT: {document_context}

TASK: Extract answers to the following questionnaire questions based on the document content.

QUESTIONS TO ANSWER:
{questions_formatted}

EXTRACTION RULES:
1. Only extract answers when there is clear evidence in the document
2. For boolean questions, answer with "true" or "false"
3. For select/multiselect questions, use EXACTLY the valid option values provided
4. For text questions, provide concise but complete answers
5. Include page numbers or section references in citations
6. Set confidence based on how directly the document addresses the question:
   - 0.9-1.0: Explicit statement directly answers the question
   - 0.7-0.89: Strong implication or related control exists
   - 0.5-0.69: Indirect evidence or partial coverage
   - Below 0.5: Skip - insufficient evidence
7. If a question cannot be answered from the document, do not include it

OUTPUT FORMAT:
Return a JSON object with this structure:
{{
  "extractions": [
    {{
      "question_id": "uuid-of-question",
      "answer": "the extracted answer (string, boolean as string, or array for multiselect)",
      "confidence": 0.85,
      "citation": "Page 12, Section 3.2 - Control CC6.1",
      "extraction_notes": "Optional notes about the extraction"
    }}
  ],
  "summary": {{
    "total_questions": {len(questions)},
    "extracted_count": 5,
    "high_confidence_count": 3,
    "pages_analyzed": 45
  }}
}}
"""

    def _get_extraction_schema(self) -> dict:
        """Get JSON schema for structured output."""
        return {
            "type": "object",
            "properties": {
                "extractions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question_id": {"type": "string"},
                            "answer": {"type": "string"},
                            "confidence": {"type": "number"},
                            "citation": {"type": "string"},
                            "extraction_notes": {"type": "string"},
                        },
                        "required": ["question_id", "answer", "confidence", "citation"],
                    },
                },
                "summary": {
                    "type": "object",
                    "properties": {
                        "total_questions": {"type": "integer"},
                        "extracted_count": {"type": "integer"},
                        "high_confidence_count": {"type": "integer"},
                        "pages_analyzed": {"type": "integer"},
                    },
                },
            },
            "required": ["extractions"],
        }

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=10, min=10, max=120),  # 10s, 20s, 40s, 80s, 120s
    )
    async def _call_gemini(
        self,
        pdf_bytes: bytes,
        prompt: str,
    ) -> tuple[dict[str, Any], dict[str, int]]:
        """
        Call Gemini API with retries and exponential backoff.

        Designed to handle rate limits gracefully.
        """
        # Upload PDF
        file = await asyncio.to_thread(
            genai.upload_file,
            io.BytesIO(pdf_bytes),
            mime_type="application/pdf",
        )

        try:
            # Create model with structured output
            model = self._create_model(self._get_extraction_schema())

            # Generate response
            response = await asyncio.to_thread(
                model.generate_content,
                [file, prompt],
            )

            # Parse response
            data = json.loads(response.text)

            # Get token usage
            usage = {
                "input": getattr(response.usage_metadata, "prompt_token_count", 0),
                "output": getattr(response.usage_metadata, "candidates_token_count", 0),
                "cached": getattr(response.usage_metadata, "cached_content_token_count", 0),
            }

            return data, usage

        finally:
            # Cleanup uploaded file
            try:
                await asyncio.to_thread(genai.delete_file, file.name)
            except Exception:
                pass  # Ignore cleanup errors

    async def parse(
        self,
        pdf_bytes: bytes,
        questions: list[dict],
        document_type: str,
        on_progress: Optional[Callable[[str, int, str], None]] = None,
    ) -> ExtractionResult:
        """
        Parse a document and extract questionnaire answers.

        Args:
            pdf_bytes: PDF file content
            questions: List of question dicts with id, question_text, question_type, etc.
            document_type: Type of document (soc2, iso27001, policy, certificate, other)
            on_progress: Optional callback for progress updates

        Returns:
            ExtractionResult with extracted answers and metadata
        """
        import time
        start_time = time.time()

        try:
            if on_progress:
                on_progress("analyzing", 10, "Preparing extraction prompt")

            # Build prompt
            prompt = self._build_extraction_prompt(questions, document_type)

            if on_progress:
                on_progress("extracting", 30, "Sending document to AI for analysis")

            # Call Gemini
            data, token_usage = await self._call_gemini(pdf_bytes, prompt)

            if on_progress:
                on_progress("processing", 70, "Processing extracted answers")

            # Process results
            extracted_answers = []
            for ext in data.get("extractions", []):
                if ext.get("confidence", 0) >= 0:  # Include all, filter later
                    extracted_answers.append(ExtractedAnswer(
                        question_id=ext["question_id"],
                        answer=str(ext["answer"]),
                        confidence=ext["confidence"],
                        citation=ext["citation"],
                        extraction_notes=ext.get("extraction_notes"),
                    ))

            # Calculate stats
            high_conf = len([a for a in extracted_answers if a.confidence >= 0.8])
            med_conf = len([a for a in extracted_answers if 0.6 <= a.confidence < 0.8])
            low_conf = len([a for a in extracted_answers if a.confidence < 0.6])
            avg_conf = (
                sum(a.confidence for a in extracted_answers) / len(extracted_answers)
                if extracted_answers else 0
            )

            if on_progress:
                on_progress("complete", 100, f"Extracted {len(extracted_answers)} answers")

            processing_time_ms = int((time.time() - start_time) * 1000)

            return ExtractionResult(
                success=True,
                extracted_answers=extracted_answers,
                total_questions=len(questions),
                high_confidence_count=high_conf,
                medium_confidence_count=med_conf,
                low_confidence_count=low_conf,
                avg_confidence=avg_conf,
                processing_time_ms=processing_time_ms,
                token_usage=token_usage,
            )

        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)

            # Provide helpful error messages
            if "Resource exhausted" in error_msg or "429" in error_msg:
                error_msg = f"Rate limit exceeded after retries. Please try again in a few minutes. Original: {error_msg}"

            return ExtractionResult(
                success=False,
                error=error_msg,
                total_questions=len(questions),
                processing_time_ms=processing_time_ms,
            )
