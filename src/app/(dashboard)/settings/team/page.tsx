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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('analyst');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load team members
  useEffect(() => {
    async function loadTeam() {
      try {
        const response = await fetch('/api/settings/team');
        if (response.ok) {
          const data = await response.json();
          setMembers(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load team:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    }

    loadTeam();
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

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('analyst');
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
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
