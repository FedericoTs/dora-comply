'use client';

/**
 * Team Management Page
 *
 * Manage team members, roles, and invitations.
 * Roles are aligned with DORA compliance responsibilities.
 */

import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTeamSettings } from '@/hooks/use-team-settings';
import {
  InviteMemberDialog,
  RoleLegendCard,
  PendingInvitationsCard,
  TeamMembersList,
  ConfirmActionDialog,
} from '@/components/settings';

export default function TeamSettingsPage() {
  const {
    isLoading,
    members,
    invitations,
    filteredMembers,
    searchQuery,
    processingInviteId,
    confirmAction,
    inviteOpen,
    inviteEmail,
    inviteEmailError,
    inviteRole,
    isInviting,
    setSearchQuery,
    setInviteRole,
    openInviteDialog,
    closeInviteDialog,
    handleInviteEmailChange,
    handleInvite,
    handleResendInvite,
    handleRevokeInvite,
    requestRoleChange,
    requestRemove,
    cancelConfirmAction,
    executeConfirmedAction,
  } = useTeamSettings();

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

        <InviteMemberDialog
          open={inviteOpen}
          email={inviteEmail}
          emailError={inviteEmailError}
          role={inviteRole}
          isInviting={isInviting}
          onOpenChange={(open) => open ? openInviteDialog() : closeInviteDialog()}
          onEmailChange={handleInviteEmailChange}
          onRoleChange={setInviteRole}
          onInvite={handleInvite}
          onClose={closeInviteDialog}
        />
      </div>

      {/* Role Legend */}
      <RoleLegendCard />

      {/* Pending Invitations */}
      <PendingInvitationsCard
        invitations={invitations}
        processingInviteId={processingInviteId}
        onResend={handleResendInvite}
        onRevoke={handleRevokeInvite}
      />

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
      <TeamMembersList
        members={members}
        filteredMembers={filteredMembers}
        searchQuery={searchQuery}
        onRequestRoleChange={requestRoleChange}
        onRequestRemove={requestRemove}
      />

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        action={confirmAction}
        onCancel={cancelConfirmAction}
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
}
