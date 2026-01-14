'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText } from 'lucide-react';

interface NotAvailableCardProps {
  isPdf: boolean;
}

export function NotAvailableCard({ isPdf }: NotAvailableCardProps) {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          SOC 2 Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <div>
            <p className="font-medium">
              {!isPdf ? 'PDF Required' : 'SOC 2 Document Required'}
            </p>
            <p className="text-sm">
              {!isPdf
                ? 'Upload a PDF version of your SOC 2 report to enable AI parsing.'
                : 'Mark this document as a SOC 2 report to enable AI parsing.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
