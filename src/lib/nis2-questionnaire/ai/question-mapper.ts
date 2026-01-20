/**
 * NIS2 Questionnaire Question Mapper
 *
 * Maps AI extractions to questionnaire questions with confidence scoring
 */

import type { TemplateQuestion, ExtractedAnswer, QuestionOption } from '../types';

interface MappingResult {
  question_id: string;
  mapped_answer: string | boolean | string[];
  confidence_adjustment: number;
  mapping_notes?: string;
}

/**
 * Map extracted text to a boolean question
 */
export function mapToBoolean(
  extractedText: string,
  confidence: number
): { value: boolean; adjustedConfidence: number } {
  const normalizedText = extractedText.toLowerCase().trim();

  // Positive indicators
  const positivePatterns = [
    /^yes$/,
    /^true$/,
    /implemented/,
    /in place/,
    /enabled/,
    /deployed/,
    /configured/,
    /active/,
    /operational/,
    /available/,
    /supported/,
    /provided/,
    /maintained/,
    /established/,
    /documented/,
  ];

  // Negative indicators
  const negativePatterns = [
    /^no$/,
    /^false$/,
    /not implemented/,
    /not in place/,
    /not enabled/,
    /not deployed/,
    /disabled/,
    /unavailable/,
    /not supported/,
    /not provided/,
    /not maintained/,
    /not established/,
    /not documented/,
  ];

  const isPositive = positivePatterns.some((p) => p.test(normalizedText));
  const isNegative = negativePatterns.some((p) => p.test(normalizedText));

  if (isPositive && !isNegative) {
    return { value: true, adjustedConfidence: confidence };
  }
  if (isNegative && !isPositive) {
    return { value: false, adjustedConfidence: confidence };
  }

  // Ambiguous - reduce confidence
  return {
    value: normalizedText.length > 0,
    adjustedConfidence: confidence * 0.7,
  };
}

/**
 * Map extracted text to a select option
 */
export function mapToSelect(
  extractedText: string,
  options: QuestionOption[],
  confidence: number
): { value: string | null; adjustedConfidence: number } {
  const normalizedText = extractedText.toLowerCase().trim();

  // Try exact match first
  for (const option of options) {
    if (
      option.value.toLowerCase() === normalizedText ||
      option.label.toLowerCase() === normalizedText
    ) {
      return { value: option.value, adjustedConfidence: confidence };
    }
  }

  // Try partial match
  for (const option of options) {
    const optionWords = option.label.toLowerCase().split(/\s+/);
    const textWords = normalizedText.split(/\s+/);

    // Check if most option words appear in the text
    const matchingWords = optionWords.filter((word) =>
      textWords.some((tw) => tw.includes(word) || word.includes(tw))
    );

    if (matchingWords.length >= optionWords.length * 0.6) {
      return { value: option.value, adjustedConfidence: confidence * 0.85 };
    }
  }

  // Try keyword matching based on option descriptions
  for (const option of options) {
    if (option.description) {
      const descWords = option.description.toLowerCase().split(/\s+/);
      const textWords = normalizedText.split(/\s+/);

      const matchingWords = descWords.filter(
        (word) =>
          word.length > 3 && textWords.some((tw) => tw.includes(word) || word.includes(tw))
      );

      if (matchingWords.length >= 2) {
        return { value: option.value, adjustedConfidence: confidence * 0.75 };
      }
    }
  }

  return { value: null, adjustedConfidence: 0 };
}

/**
 * Map extracted text to multiselect options
 */
export function mapToMultiselect(
  extractedText: string,
  options: QuestionOption[],
  confidence: number
): { values: string[]; adjustedConfidence: number } {
  const normalizedText = extractedText.toLowerCase();
  const matchedValues: string[] = [];
  let totalConfidence = 0;

  for (const option of options) {
    // Check if option value or label appears in text
    if (
      normalizedText.includes(option.value.toLowerCase()) ||
      normalizedText.includes(option.label.toLowerCase())
    ) {
      matchedValues.push(option.value);
      totalConfidence += confidence;
      continue;
    }

    // Check keywords in option label
    const labelWords = option.label.toLowerCase().split(/\s+/);
    const significantMatches = labelWords.filter(
      (word) => word.length > 3 && normalizedText.includes(word)
    );

    if (significantMatches.length >= labelWords.length * 0.5) {
      matchedValues.push(option.value);
      totalConfidence += confidence * 0.8;
    }
  }

  const avgConfidence =
    matchedValues.length > 0 ? totalConfidence / matchedValues.length : 0;

  return {
    values: matchedValues,
    adjustedConfidence: Math.min(avgConfidence, confidence),
  };
}

/**
 * Map extracted answer to question type
 */
export function mapAnswerToQuestion(
  extraction: ExtractedAnswer,
  question: TemplateQuestion
): MappingResult {
  const { answer, confidence } = extraction;

  switch (question.question_type) {
    case 'boolean': {
      const { value, adjustedConfidence } = mapToBoolean(answer, confidence);
      return {
        question_id: question.id,
        mapped_answer: value,
        confidence_adjustment: adjustedConfidence - confidence,
        mapping_notes: `Mapped to boolean: ${value}`,
      };
    }

    case 'select': {
      const { value, adjustedConfidence } = mapToSelect(
        answer,
        question.options || [],
        confidence
      );
      if (value === null) {
        return {
          question_id: question.id,
          mapped_answer: answer,
          confidence_adjustment: -0.3,
          mapping_notes: 'Could not map to select option, using raw text',
        };
      }
      return {
        question_id: question.id,
        mapped_answer: value,
        confidence_adjustment: adjustedConfidence - confidence,
        mapping_notes: `Mapped to option: ${value}`,
      };
    }

    case 'multiselect': {
      const { values, adjustedConfidence } = mapToMultiselect(
        answer,
        question.options || [],
        confidence
      );
      return {
        question_id: question.id,
        mapped_answer: values,
        confidence_adjustment: adjustedConfidence - confidence,
        mapping_notes: `Mapped to ${values.length} options`,
      };
    }

    case 'text':
    case 'textarea':
    default: {
      // Validate text length constraints
      const rules = question.validation_rules || {};
      let adjustedConfidence = confidence;
      let notes = '';

      if (rules.minLength && answer.length < rules.minLength) {
        adjustedConfidence *= 0.7;
        notes = `Answer shorter than minimum (${answer.length}/${rules.minLength})`;
      }

      if (rules.maxLength && answer.length > rules.maxLength) {
        // Truncate and reduce confidence
        return {
          question_id: question.id,
          mapped_answer: answer.substring(0, rules.maxLength),
          confidence_adjustment: -0.2,
          mapping_notes: `Truncated from ${answer.length} to ${rules.maxLength} chars`,
        };
      }

      return {
        question_id: question.id,
        mapped_answer: answer,
        confidence_adjustment: adjustedConfidence - confidence,
        mapping_notes: notes || undefined,
      };
    }
  }
}

/**
 * Calculate effective confidence after mapping
 */
export function calculateEffectiveConfidence(
  baseConfidence: number,
  adjustment: number,
  questionRequired: boolean
): number {
  let effective = baseConfidence + adjustment;

  // Boost confidence slightly for required questions if high
  if (questionRequired && baseConfidence >= 0.8) {
    effective *= 1.05;
  }

  // Clamp to valid range
  return Math.max(0, Math.min(1, effective));
}

/**
 * Batch map all extractions to questions
 */
export function mapAllExtractions(
  extractions: ExtractedAnswer[],
  questions: TemplateQuestion[]
): Map<string, MappingResult> {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const results = new Map<string, MappingResult>();

  for (const extraction of extractions) {
    const question = questionMap.get(extraction.question_id);
    if (!question) continue;

    const mappingResult = mapAnswerToQuestion(extraction, question);
    results.set(extraction.question_id, mappingResult);
  }

  return results;
}

/**
 * Prioritize extractions when multiple documents provide answers
 */
export function prioritizeExtractions(
  extractionsByQuestion: Map<string, ExtractedAnswer[]>
): Map<string, ExtractedAnswer> {
  const bestExtractions = new Map<string, ExtractedAnswer>();

  for (const [questionId, extractions] of extractionsByQuestion) {
    if (extractions.length === 0) continue;

    // Sort by confidence (highest first)
    const sorted = [...extractions].sort((a, b) => b.confidence - a.confidence);

    // Take the highest confidence extraction
    bestExtractions.set(questionId, sorted[0]);
  }

  return bestExtractions;
}

/**
 * Merge extractions from multiple sources
 */
export function mergeExtractionSources(
  sources: Array<{ documentType: string; extractions: ExtractedAnswer[] }>
): ExtractedAnswer[] {
  const byQuestion = new Map<string, ExtractedAnswer[]>();

  // Group by question
  for (const source of sources) {
    for (const extraction of source.extractions) {
      const existing = byQuestion.get(extraction.question_id) || [];
      existing.push(extraction);
      byQuestion.set(extraction.question_id, existing);
    }
  }

  // Get best extraction for each question
  const prioritized = prioritizeExtractions(byQuestion);
  return Array.from(prioritized.values());
}
