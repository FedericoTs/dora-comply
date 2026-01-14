/**
 * DORA Requirements Card Component
 *
 * Quick reference card for DORA testing requirements
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DORARequirementsCardProps {
  tlptRequired: boolean;
}

export function DORARequirementsCard({ tlptRequired }: DORARequirementsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">DORA Testing Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Article 24</span>
          <Badge variant="outline">Annual Programme</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Article 25</span>
          <Badge variant="outline">10 Test Types</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Article 26</span>
          <Badge variant={tlptRequired ? 'default' : 'secondary'}>
            TLPT{tlptRequired ? ' Required' : ' (Significant only)'}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Article 27</span>
          <Badge variant="outline">Tester Requirements</Badge>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t">
          {tlptRequired
            ? 'As a significant entity, you must conduct TLPT every 3 years.'
            : 'Financial entities must establish testing programmes based on risk.'}
        </p>
      </CardContent>
    </Card>
  );
}
