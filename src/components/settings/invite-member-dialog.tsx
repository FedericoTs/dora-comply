'use client';

import { Mail, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, type InviteRole } from '@/lib/settings/team-constants';

interface InviteMemberDialogProps {
  open: boolean;
  email: string;
  emailError: string | null;
  role: InviteRole;
  isInviting: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: InviteRole) => void;
  onInvite: () => void;
  onClose: () => void;
}

export function InviteMemberDialog({
  open,
  email,
  emailError,
  role,
  isInviting,
  onOpenChange,
  onEmailChange,
  onRoleChange,
  onInvite,
  onClose,
}: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={cn(emailError && 'border-destructive')}
              aria-invalid={!!emailError}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => onRoleChange(v as InviteRole)}>
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onInvite} disabled={!email || isInviting}>
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
  );
}
