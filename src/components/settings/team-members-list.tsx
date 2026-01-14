'use client';

import { Users, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, getInitials, type TeamMember } from '@/lib/settings/team-constants';

interface TeamMembersListProps {
  members: TeamMember[];
  filteredMembers: TeamMember[];
  searchQuery: string;
  onRequestRoleChange: (memberId: string, memberName: string, newRole: string) => void;
  onRequestRemove: (memberId: string, memberName: string) => void;
}

export function TeamMembersList({
  members,
  filteredMembers,
  searchQuery,
  onRequestRoleChange,
  onRequestRemove,
}: TeamMembersListProps) {
  return (
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
                          onClick={() => onRequestRoleChange(member.id, member.fullName || member.email, 'admin')}
                          disabled={member.role === 'admin'}
                        >
                          Make Administrator
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRequestRoleChange(member.id, member.fullName || member.email, 'analyst')}
                          disabled={member.role === 'analyst'}
                        >
                          Make Analyst
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRequestRoleChange(member.id, member.fullName || member.email, 'viewer')}
                          disabled={member.role === 'viewer'}
                        >
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onRequestRemove(member.id, member.fullName || member.email)}
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
  );
}
