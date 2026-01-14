'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  type TeamMember,
  type PendingInvitation,
  type ConfirmAction,
  type InviteRole,
  validateEmail,
} from '@/lib/settings/team-constants';

export function useTeamSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<InviteRole>('analyst');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

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

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  // Invite dialog handlers
  const openInviteDialog = () => setInviteOpen(true);

  const closeInviteDialog = () => {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteEmailError(null);
    setInviteRole('analyst');
  };

  const handleInviteEmailChange = (value: string) => {
    setInviteEmail(value);
    if (inviteEmailError) setInviteEmailError(null);
  };

  // Invite team member
  async function handleInvite() {
    const error = validateEmail(inviteEmail, members, invitations);
    if (error) {
      setInviteEmailError(error);
      return;
    }
    setInviteEmailError(null);
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
      closeInviteDialog();

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

  // Request role change confirmation
  function requestRoleChange(memberId: string, memberName: string, newRole: string) {
    setConfirmAction({
      type: 'role_change',
      memberId,
      memberName,
      newRole,
    });
  }

  // Request member removal confirmation
  function requestRemove(memberId: string, memberName: string) {
    setConfirmAction({
      type: 'remove',
      memberId,
      memberName,
    });
  }

  // Cancel confirm action
  function cancelConfirmAction() {
    setConfirmAction(null);
  }

  // Execute confirmed action
  async function executeConfirmedAction() {
    if (!confirmAction) return;

    const { type, memberId, newRole } = confirmAction;
    setConfirmAction(null);

    if (type === 'role_change' && newRole) {
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
    } else if (type === 'remove') {
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
  }

  return {
    // State
    isLoading,
    members,
    invitations,
    filteredMembers,
    searchQuery,
    processingInviteId,
    confirmAction,

    // Invite dialog state
    inviteOpen,
    inviteEmail,
    inviteEmailError,
    inviteRole,
    isInviting,

    // Setters
    setSearchQuery,
    setInviteRole,

    // Invite dialog handlers
    openInviteDialog,
    closeInviteDialog,
    handleInviteEmailChange,
    handleInvite,

    // Invitation handlers
    handleResendInvite,
    handleRevokeInvite,

    // Member action handlers
    requestRoleChange,
    requestRemove,
    cancelConfirmAction,
    executeConfirmedAction,
  };
}
