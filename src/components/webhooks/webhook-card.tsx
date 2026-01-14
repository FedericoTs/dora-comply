'use client';

/**
 * Webhook Card Component
 *
 * Displays a single webhook with actions.
 */

import {
  MoreHorizontal,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  Send,
  History,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WebhookConfig } from '@/lib/webhooks/types';

interface WebhookCardProps {
  webhook: WebhookConfig;
  isTesting: boolean;
  onToggleActive: () => void;
  onTest: () => void;
  onOpenDetail: () => void;
  onRegenerateSecret: () => void;
  onDelete: () => void;
}

export function WebhookCard({
  webhook,
  isTesting,
  onToggleActive,
  onTest,
  onOpenDetail,
  onRegenerateSecret,
  onDelete,
}: WebhookCardProps) {
  return (
    <Card className={!webhook.is_active ? 'opacity-60' : ''}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Switch
              checked={webhook.is_active}
              onCheckedChange={onToggleActive}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{webhook.name}</span>
                {!webhook.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Paused
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[300px]">
                  {webhook.url}
                </code>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {webhook.events.slice(0, 3).map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
                {webhook.events.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{webhook.events.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTesting || !webhook.is_active}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Test</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenDetail}
            >
              <History className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">History</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenDetail}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleActive}>
                  {webhook.is_active ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRegenerateSecret}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Secret
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
