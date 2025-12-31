/**
 * RoI Validation Module
 */

export {
  validateTemplate,
  validateRoi,
  quickValidate,
  enhanceErrorsWithSuggestions,
  type EnhancedError,
} from './validator';

export {
  TEMPLATE_RULES,
  CROSS_FIELD_RULES,
  B_01_01_RULES,
  B_01_02_RULES,
  B_02_01_RULES,
  B_02_02_RULES,
  B_05_01_RULES,
  B_06_01_RULES,
  B_07_01_RULES,
  type ValidationRule,
  type FieldRules,
  type TemplateRules,
  type CrossFieldRule,
  type RuleType,
} from './rules';
