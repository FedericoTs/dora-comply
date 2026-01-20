"""
Parser Package for Modal Workers

Includes:
- SOC 2 document parsing with Gemini 2.5 Flash
- Questionnaire answer extraction from security documents
"""

from .soc2_parser_optimized import OptimizedSOC2Parser
from .types import ParseResult, ExtractionProgress, ExtractionStrategy
from .dora_mapping import calculate_dora_coverage, map_controls_to_dora
from .questionnaire_parser import QuestionnaireParser, ExtractionResult, ExtractedAnswer

__all__ = [
    # SOC 2 Parser
    "OptimizedSOC2Parser",
    "ParseResult",
    "ExtractionProgress",
    "ExtractionStrategy",
    "calculate_dora_coverage",
    "map_controls_to_dora",
    # Questionnaire Parser
    "QuestionnaireParser",
    "ExtractionResult",
    "ExtractedAnswer",
]
