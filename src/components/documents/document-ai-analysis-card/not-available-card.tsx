'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, FileText } from 'lucide-react';

export function NotAvailableCard() {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-muted-foreground" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <div>
            <p className="font-medium">PDF Required</p>
            <p className="text-sm">
              AI analysis is available for PDF contract documents.
              Upload a PDF version to enable DORA clause extraction.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
