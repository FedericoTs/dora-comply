'use client';

/**
 * Security Log Card Component
 *
 * Placeholder for security log feature
 */

import { Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SecurityLogCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Log
        </CardTitle>
        <CardDescription>
          View recent security events and account activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
