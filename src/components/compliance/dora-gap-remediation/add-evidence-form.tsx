'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { RequirementWithEvidence, DORAEvidence } from './types';

interface AddEvidenceFormProps {
  requirement: RequirementWithEvidence;
  vendorId: string;
  onSuccess: (evidence: DORAEvidence) => void;
}

export function AddEvidenceForm({
  requirement,
}: AddEvidenceFormProps) {
  // Note: dora_evidence table was removed - manual evidence feature not yet implemented
  // This form is preserved for future implementation with a new evidence system

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Add Evidence for {requirement.article_number}</DialogTitle>
        <DialogDescription>{requirement.article_title}</DialogDescription>
      </DialogHeader>

      <div className="py-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3 p-6 rounded-lg bg-muted/50">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Manual Evidence Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              The ability to add manual evidence for DORA requirements is currently being developed.
              In the meantime, evidence is automatically extracted from uploaded SOC 2 and ISO 27001 reports.
            </p>
          </div>
        </div>

        {/* Evidence needed hint */}
        {requirement.evidence_needed && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm">
            <p className="font-medium mb-1">Suggested evidence for this requirement:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              {requirement.evidence_needed.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
}
