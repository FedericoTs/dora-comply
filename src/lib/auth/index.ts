/**
 * Auth Module
 * Centralized exports for authentication functionality
 */

// Types
export type {
  User,
  AuthUser,
  UserRole,
  Organization,
  EntityType,
  OrganizationSettings,
  AuthState,
  AuthError,
  AuthErrorCode,
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  NewPasswordFormData,
  OnboardingFormData,
  ActionResult,
  LoginResult,
  RegisterResult,
  Session,
  SessionInfo,
} from './types';

// Schemas
export {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  newPasswordSchema,
  onboardingSchema,
  mfaCodeSchema,
  profileUpdateSchema,
  passwordSchema,
  emailSchema,
  entityTypes,
  teamSizes,
  primaryUseCases,
} from './schemas';

export type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  NewPasswordInput,
  OnboardingInput,
  MfaCodeInput,
  ProfileUpdateInput,
} from './schemas';

// Password utilities
export {
  analyzePassword,
  validatePassword,
  getStrengthColor,
  getStrengthTextColor,
} from './password';

export type { PasswordStrength, PasswordRequirement } from './password';

// Server actions
export {
  login,
  register,
  logout,
  resetPassword,
  updatePassword,
  resendVerificationEmail,
  completeOnboarding,
  getCurrentUser,
  checkAuthStatus,
} from './actions';
