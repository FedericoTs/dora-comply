"""
Gemini AI client with structured output and context caching.

Optimized for SOC 2 document parsing using Gemini 2.5 Flash:
- 1M input token context window
- 65K output tokens (enough for 500+ controls)
- Structured output mode for guaranteed JSON
- Context caching for multi-pass extraction
"""

import io
import json
import asyncio
from datetime import timedelta
from typing import Any, Optional

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential


class GeminiClient:
    """
    Gemini AI client optimized for SOC 2 extraction.
    """

    MODEL_NAME = "gemini-2.5-flash"  # Stable 2.5 Flash
    MAX_OUTPUT_TOKENS = 65536  # Full 65K output capacity

    def __init__(self, api_key: str):
        """
        Initialize Gemini client.

        Args:
            api_key: Google AI API key
        """
        genai.configure(api_key=api_key)
        self.api_key = api_key

    def _create_model(self, schema: Optional[dict] = None) -> genai.GenerativeModel:
        """Create model with optional structured output schema."""
        generation_config = {
            "temperature": 0,  # Deterministic output
            "max_output_tokens": self.MAX_OUTPUT_TOKENS,
        }

        if schema:
            generation_config["response_mime_type"] = "application/json"
            generation_config["response_schema"] = schema

        return genai.GenerativeModel(
            model_name=self.MODEL_NAME,
            generation_config=generation_config,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=5, min=5, max=60),
    )
    async def extract_with_schema(
        self,
        pdf_bytes: bytes,
        prompt: str,
        schema: dict,
    ) -> tuple[dict[str, Any], dict[str, int]]:
        """
        Extract data from PDF with guaranteed JSON output.

        Args:
            pdf_bytes: PDF file content
            prompt: Extraction prompt
            schema: JSON schema for structured output

        Returns:
            Tuple of (extracted_data, token_usage)
        """
        # Upload PDF
        file = await asyncio.to_thread(
            genai.upload_file,
            io.BytesIO(pdf_bytes),
            mime_type="application/pdf",
        )

        try:
            # Create model with schema
            model = self._create_model(schema)

            # Generate response
            response = await asyncio.to_thread(
                model.generate_content,
                [file, prompt],
            )

            # Parse response (guaranteed valid JSON due to structured output)
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
            await asyncio.to_thread(genai.delete_file, file.name)

    async def extract_with_caching(
        self,
        pdf_bytes: bytes,
        prompts: list[tuple[str, dict]],
    ) -> tuple[list[dict[str, Any]], dict[str, int]]:
        """
        Extract data using context caching for multiple queries.

        Args:
            pdf_bytes: PDF file content
            prompts: List of (prompt, schema) tuples to run

        Returns:
            Tuple of (list of extracted data, total token usage)
        """
        # Upload PDF
        file = await asyncio.to_thread(
            genai.upload_file,
            io.BytesIO(pdf_bytes),
            mime_type="application/pdf",
        )

        total_usage = {"input": 0, "output": 0, "cached": 0}
        results = []

        try:
            # Create cache
            cache = await asyncio.to_thread(
                genai.caching.CachedContent.create,
                model=self.MODEL_NAME,
                contents=[file],
                ttl=timedelta(hours=1),
            )

            try:
                # Create model from cache
                cached_model = genai.GenerativeModel.from_cached_content(cache)

                # Run each prompt
                for prompt, schema in prompts:
                    generation_config = {
                        "temperature": 0,
                        "max_output_tokens": self.MAX_OUTPUT_TOKENS,
                        "response_mime_type": "application/json",
                        "response_schema": schema,
                    }

                    response = await asyncio.to_thread(
                        cached_model.generate_content,
                        prompt,
                        generation_config=generation_config,
                    )

                    data = json.loads(response.text)
                    results.append(data)

                    # Accumulate token usage
                    total_usage["input"] += getattr(
                        response.usage_metadata, "prompt_token_count", 0
                    )
                    total_usage["output"] += getattr(
                        response.usage_metadata, "candidates_token_count", 0
                    )
                    total_usage["cached"] += getattr(
                        response.usage_metadata, "cached_content_token_count", 0
                    )

            finally:
                # Delete cache
                await asyncio.to_thread(cache.delete)

        finally:
            # Cleanup uploaded file
            await asyncio.to_thread(genai.delete_file, file.name)

        return results, total_usage

    async def run_parallel_extraction(
        self,
        pdf_bytes: bytes,
        prompts: list[tuple[str, dict]],
    ) -> tuple[list[dict[str, Any]], dict[str, int]]:
        """
        Run multiple extraction queries in parallel with caching.

        Args:
            pdf_bytes: PDF file content
            prompts: List of (prompt, schema) tuples to run in parallel

        Returns:
            Tuple of (list of extracted data, total token usage)
        """
        # Upload PDF
        file = await asyncio.to_thread(
            genai.upload_file,
            io.BytesIO(pdf_bytes),
            mime_type="application/pdf",
        )

        total_usage = {"input": 0, "output": 0, "cached": 0}

        try:
            # Create cache
            cache = await asyncio.to_thread(
                genai.caching.CachedContent.create,
                model=self.MODEL_NAME,
                contents=[file],
                ttl=timedelta(hours=1),
            )

            try:
                cached_model = genai.GenerativeModel.from_cached_content(cache)

                # Create async tasks for parallel execution
                async def run_single_prompt(prompt: str, schema: dict) -> dict:
                    generation_config = {
                        "temperature": 0,
                        "max_output_tokens": self.MAX_OUTPUT_TOKENS,
                        "response_mime_type": "application/json",
                        "response_schema": schema,
                    }

                    response = await asyncio.to_thread(
                        cached_model.generate_content,
                        prompt,
                        generation_config=generation_config,
                    )

                    return {
                        "data": json.loads(response.text),
                        "usage": {
                            "input": getattr(
                                response.usage_metadata, "prompt_token_count", 0
                            ),
                            "output": getattr(
                                response.usage_metadata, "candidates_token_count", 0
                            ),
                            "cached": getattr(
                                response.usage_metadata, "cached_content_token_count", 0
                            ),
                        },
                    }

                # Run all prompts in parallel
                tasks = [run_single_prompt(p, s) for p, s in prompts]
                results = await asyncio.gather(*tasks)

                # Aggregate results and usage
                extracted_data = []
                for result in results:
                    extracted_data.append(result["data"])
                    total_usage["input"] += result["usage"]["input"]
                    total_usage["output"] += result["usage"]["output"]
                    total_usage["cached"] += result["usage"]["cached"]

            finally:
                await asyncio.to_thread(cache.delete)

        finally:
            await asyncio.to_thread(genai.delete_file, file.name)

        return extracted_data, total_usage

    @staticmethod
    def estimate_pages(pdf_bytes: bytes) -> int:
        """
        Estimate page count from PDF file size.
        Average SOC 2 PDF is ~50KB per page.
        """
        return max(1, len(pdf_bytes) // 50000)

    @staticmethod
    def estimate_tokens(pdf_bytes: bytes) -> int:
        """
        Estimate token count from PDF file size.
        Gemini uses ~258 tokens per PDF page.
        """
        pages = GeminiClient.estimate_pages(pdf_bytes)
        return pages * 258
