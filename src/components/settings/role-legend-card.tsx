'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG } from '@/lib/settings/team-constants';

export function RoleLegendCard() {
  return (
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
  );
}
