'use client';

/**
 * Team Management Page
 *
 * Manage team members, roles, and invitations.
 * Roles are aligned with DORA compliance responsibilities.
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Shield,
  UserPlus,
  MoreHorizontal,
  Loader2,
  Crown,
  UserCog,
  Eye,
  Search,
  Trash2,
  Clock,
  RefreshCw,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Types
interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  joinedAt: string;
  lastActiveAt: string | null;
  isCurrent: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  status: string;
  created_at: string;
  expires_at: string;
  invitedBy: string;
  isExpired: boolean;
}

// Role configuration aligned with DORA responsibilities
const ROLE_CONFIG = {
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

export default function TeamSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('analyst');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  // Load team members and invitations
  useEffect(() => {
    async function loadTeamData() {
      try {
        const [teamResponse, invitesResponse] = await Promise.all([
          fetch('/api/settings/team'),
          fetch('/api/settings/team/invite'),
        ]);

        if (teamResponse.ok) {
          const data = await teamResponse.json();
          setMembers(data.data || []);
        }

        if (invitesResponse.ok) {
          const data = await invitesResponse.json();
          setInvitations(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load team data:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    }

    loadTeamData();
  }, []);

  // Invite team member
  async function handleInvite() {
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const response = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to send invitation');
      }

      const result = await response.json();
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('analyst');

      // Add new invitation to list
      if (result.data) {
        setInvitations((prev) => [
          {
            ...result.data,
            invitedBy: 'You',
            isExpired: false,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  }

  // Resend invitation
  async function handleResendInvite(inviteId: string) {
    setProcessingInviteId(inviteId);
    try {
      const response = await fetch(`/api/settings/team/invite/${inviteId}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to resend invitation');
      }

      const result = await response.json();
      toast.success('Invitation resent successfully');

      // Update invitation in list
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === inviteId
            ? { ...inv, expires_at: result.data.expires_at, isExpired: false }
            : inv
        )
      );
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setProcessingInviteId(null);
    }
  }

  // Revoke invitation
  async function handleRevokeInvite(inviteId: string) {
    setProcessingInviteId(inviteId);
    try {
      const response = await fetch(`/api/settings/team/invite/${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to revoke invitation');
      }

      toast.success('Invitation revoked');

      // Remove invitation from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== inviteId));
    } catch (error) {
      console.error('Revoke error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke invitation');
    } finally {
      setProcessingInviteId(null);
    }
  }

  // Update member role
  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      const response = await fetch(`/api/settings/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, role: newRole as TeamMember['role'] } : m
        )
      );
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  }

  // Remove member
  async function handleRemove(memberId: string) {
    try {
      const response = await fetch(`/api/settings/team/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      setMembers(members.filter((m) => m.id !== memberId));
      toast.success('Team member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  }

  // Filter members
  const filteredMembers = members.filter(
    (m) =>
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get initials for avatar
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  // Format date for sent
  const formatSentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your organization&apos;s compliance data
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG)
                      .filter(([key]) => key !== 'owner')
                      .map(([value, { label, description }]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">{description}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Permissions</CardTitle>
          <CardDescription>
            Roles are aligned with DORA compliance responsibilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={cn('p-2 rounded-md', config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{config.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Invitations ({invitations.length})
              </CardTitle>
            </div>
            <CardDescription>
              These invitations are waiting for recipients to accept
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {invitations.map((invitation) => {
                const roleConfig = ROLE_CONFIG[invitation.role as keyof typeof ROLE_CONFIG];
                const RoleIcon = roleConfig?.icon || Eye;
                const isProcessing = processingInviteId === invitation.id;

                return (
                  <div
                    key={invitation.id}
                    className={cn(
                      'flex items-center justify-between p-4 transition-colors',
                      invitation.isExpired && 'bg-amber-50 dark:bg-amber-950/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{invitation.email}</p>
                          {invitation.isExpired && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sent {formatSentDate(invitation.created_at)} by {invitation.invitedBy} · {formatRelativeTime(invitation.expires_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn('gap-1', roleConfig?.color)}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig?.label || invitation.role}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(invitation.id)}
                          disabled={isProcessing}
                          title="Resend invitation"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvite(invitation.id)}
                          disabled={isProcessing}
                          title="Revoke invitation"
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {members.length} Member{members.length !== 1 && 's'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredMembers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery ? 'No members found matching your search' : 'No team members yet'}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role];
                const RoleIcon = roleConfig.icon;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(member.fullName, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {member.fullName || member.email}
                          </p>
                          {member.isCurrent && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn('gap-1', roleConfig.color)}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={member.role === 'owner' || member.isCurrent}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'admin')}
                            disabled={member.role === 'admin'}
                          >
                            Make Administrator
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'analyst')}
                            disabled={member.role === 'analyst'}
                          >
                            Make Analyst
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'viewer')}
                            disabled={member.role === 'viewer'}
                          >
                            Make Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemove(member.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
