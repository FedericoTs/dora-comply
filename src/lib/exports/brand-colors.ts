/**
 * Brand Colors for Exports
 *
 * Centralized color definitions for all export functionality (PDF, PPTX, Excel).
 * These colors match the application's Emerald theme defined in globals.css.
 *
 * IMPORTANT: When updating brand colors, update this file and globals.css together.
 */

// RGB format for jsPDF and similar libraries
export const BRAND_COLORS_RGB = {
  // Primary - Emerald (main brand color)
  primary: [5, 150, 105] as [number, number, number], // #059669
  primaryLight: [16, 185, 129] as [number, number, number], // #10B981
  primaryDark: [4, 120, 87] as [number, number, number], // #047857

  // Semantic colors
  success: [16, 185, 129] as [number, number, number], // #10B981
  warning: [245, 158, 11] as [number, number, number], // #F59E0B
  error: [239, 68, 68] as [number, number, number], // #EF4444
  info: [59, 130, 246] as [number, number, number], // #3B82F6

  // Neutral colors
  dark: [17, 24, 39] as [number, number, number], // #111827
  gray: [107, 114, 128] as [number, number, number], // #6B7280
  lightGray: [248, 250, 252] as [number, number, number], // #F8FAFC
  white: [255, 255, 255] as [number, number, number],

  // Text colors
  text: [51, 65, 85] as [number, number, number], // #334155
  textMuted: [100, 116, 139] as [number, number, number], // #64748B

  // Risk level colors
  riskCritical: [239, 68, 68] as [number, number, number], // #EF4444
  riskHigh: [249, 115, 22] as [number, number, number], // #F97316
  riskMedium: [245, 158, 11] as [number, number, number], // #F59E0B
  riskLow: [16, 185, 129] as [number, number, number], // #10B981
} as const;

// Hex format for CSS and libraries that require hex strings (with # prefix)
export const BRAND_COLORS_HEX = {
  // Primary - Emerald (main brand color)
  primary: '#059669',
  primaryLight: '#10B981',
  primaryDark: '#047857',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral colors
  dark: '#111827',
  gray: '#6B7280',
  lightGray: '#F8FAFC',
  white: '#FFFFFF',

  // Text colors
  text: '#334155',
  textMuted: '#64748B',

  // Risk level colors
  riskCritical: '#EF4444',
  riskHigh: '#F97316',
  riskMedium: '#F59E0B',
  riskLow: '#10B981',
} as const;

// Hex format without # prefix for pptxgenjs and similar libraries
export const BRAND_COLORS_PPTX = {
  // Primary - Emerald (main brand color)
  primary: '059669',
  primaryLight: '10B981',
  primaryDark: '047857',

  // Semantic colors
  success: '10B981',
  warning: 'F59E0B',
  error: 'EF4444',
  info: '3B82F6',

  // Neutral colors
  dark: '111827',
  gray: '6B7280',
  lightGray: 'F8FAFC',
  white: 'FFFFFF',

  // Text colors
  text: '334155',
  textMuted: '64748B',

  // Risk level colors
  riskCritical: 'EF4444',
  riskHigh: 'F97316',
  riskMedium: 'F59E0B',
  riskLow: '10B981',
} as const;

// Chart color palette (for data visualizations)
export const CHART_COLORS_HEX = [
  '#059669', // Emerald (primary)
  '#0EA5E9', // Sky
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
] as const;

export const CHART_COLORS_PPTX = [
  '059669', // Emerald (primary)
  '0EA5E9', // Sky
  '8B5CF6', // Violet
  'F59E0B', // Amber
  'EC4899', // Pink
  '14B8A6', // Teal
  'F97316', // Orange
  '6366F1', // Indigo
] as const;

// Maturity level colors
export const MATURITY_COLORS_HEX: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '#EF4444', // Red - L0 (Initial)
  1: '#F97316', // Orange - L1 (Developing)
  2: '#F59E0B', // Amber - L2 (Defined)
  3: '#3B82F6', // Blue - L3 (Managed)
  4: '#10B981', // Green - L4 (Optimized)
};

export const MATURITY_COLORS_RGB: Record<0 | 1 | 2 | 3 | 4, [number, number, number]> = {
  0: [239, 68, 68], // Red - L0
  1: [249, 115, 22], // Orange - L1
  2: [245, 158, 11], // Amber - L2
  3: [59, 130, 246], // Blue - L3
  4: [16, 185, 129], // Green - L4
};

// Helper function to get risk color by level
export function getRiskColor(
  level: 'critical' | 'high' | 'medium' | 'low',
  format: 'rgb' | 'hex' | 'pptx' = 'hex'
): string | [number, number, number] {
  const colorMap = {
    critical: { rgb: BRAND_COLORS_RGB.riskCritical, hex: BRAND_COLORS_HEX.riskCritical, pptx: BRAND_COLORS_PPTX.riskCritical },
    high: { rgb: BRAND_COLORS_RGB.riskHigh, hex: BRAND_COLORS_HEX.riskHigh, pptx: BRAND_COLORS_PPTX.riskHigh },
    medium: { rgb: BRAND_COLORS_RGB.riskMedium, hex: BRAND_COLORS_HEX.riskMedium, pptx: BRAND_COLORS_PPTX.riskMedium },
    low: { rgb: BRAND_COLORS_RGB.riskLow, hex: BRAND_COLORS_HEX.riskLow, pptx: BRAND_COLORS_PPTX.riskLow },
  };

  return colorMap[level][format];
}

// Helper function to get maturity level color
export function getMaturityColor(
  level: 0 | 1 | 2 | 3 | 4,
  format: 'rgb' | 'hex' = 'hex'
): string | [number, number, number] {
  return format === 'rgb' ? MATURITY_COLORS_RGB[level] : MATURITY_COLORS_HEX[level];
}

// Re-export the COLORS object from board-report-types for backward compatibility
export { COLORS } from './board-report-types';
