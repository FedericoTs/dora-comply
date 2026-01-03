"""
SOC 2 Parser Package

Optimized SOC 2 document parsing using Gemini 2.5 Flash with:
- Single-pass extraction for most documents
- Context caching for large documents
- Structured output mode for guaranteed JSON
"""

from .soc2_parser_optimized import OptimizedSOC2Parser
from .types import ParseResult, ExtractionProgress, ExtractionStrategy
from .dora_mapping import calculate_dora_coverage, map_controls_to_dora

__all__ = [
    "OptimizedSOC2Parser",
    "ParseResult",
    "ExtractionProgress",
    "ExtractionStrategy",
    "calculate_dora_coverage",
    "map_controls_to_dora",
]
