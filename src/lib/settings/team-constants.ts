import { Crown, UserCog, Shield, Eye, type LucideIcon } from 'lucide-react';

/**
 * Team Settings Types and Constants
 */

// Types
export interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: TeamRole;
  joinedAt: string;
  lastActiveAt: string | null;
  isCurrent: boolean;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: InviteRole;
  status: string;
  created_at: string;
  expires_at: string;
  invitedBy: string;
  isExpired: boolean;
}

export interface ConfirmAction {
  type: 'role_change' | 'remove';
  memberId: string;
  memberName: string;
  newRole?: string;
}

export type TeamRole = 'owner' | 'admin' | 'analyst' | 'viewer';
export type InviteRole = 'admin' | 'analyst' | 'viewer';

export interface RoleConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  permissions: string[];
}

// Role configuration aligned with DORA responsibilities
export const ROLE_CONFIG: Record<TeamRole, RoleConfig> = {
  owner: {
    label: 'Owner',
    description: 'Full platform access, billing, and organization management',
    icon: Crown,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    permissions: ['All permissions', 'Billing management', 'Delete organization'],
  },
  admin: {
    label: 'Administrator',
    description: 'Manage users, settings, and compliance workflows',
    icon: UserCog,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    permissions: ['Manage team members', 'Configure settings', 'Submit reports'],
  },
  analyst: {
    label: 'Compliance Analyst',
    description: 'Create and edit vendors, documents, and RoI data',
    icon: Shield,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    permissions: ['Manage vendors', 'Upload documents', 'Edit RoI', 'Create incidents'],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to compliance data and dashboards',
    icon: Eye,
    color: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
    permissions: ['View dashboards', 'View reports', 'View vendors'],
  },
};

// Utility functions
export function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  return `Expires in ${diffDays} days`;
}

export function formatSentDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function validateEmail(
  email: string,
  members: TeamMember[],
  invitations: PendingInvitation[]
): string | null {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
    return 'This person is already a team member';
  }
  if (invitations.some(i => i.email.toLowerCase() === email.toLowerCase())) {
    return 'An invitation has already been sent to this email';
  }
  return null;
}
