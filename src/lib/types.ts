/**
 * Shared Types
 *
 * Common types used across multiple lib modules.
 */

/**
 * Standard result type for server actions
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
