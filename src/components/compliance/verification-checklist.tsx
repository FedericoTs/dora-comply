'use client';

/**
 * Verification Checklist Component
 *
 * Allows users to manually verify AI-extracted SOC 2 data
 * Addresses the concern: "How can I be sure 100% coverage is actually 100%?"
 *
 * Features:
 * - Control count validation
 * - Exception verification
 * - Opinion confirmation
 * - Spot-check random controls
 * - Subservice organization verification
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  ExternalLink,
  RefreshCw,
  Flag,
  Eye,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationResult } from '@/lib/compliance/dora-types';

interface VerificationChecklistProps {
  documentId: string;
  documentName: string;
  extractionConfidence: number;
  extractedData: {
    controlCount: number;
    exceptionCount: number;
    opinion: string;
    auditFirm: string;
    reportType: string;
    periodStart: string;
    periodEnd: string;
    subserviceOrgs: Array<{ name: string; services: string }>;
    sampleControls: Array<{
      id: string;
      category: string;
      description: string;
      pageRef?: number;
    }>;
  };
  onVerify?: (result: VerificationResult) => void;
  onRequestReparse?: () => void;
  onReportIssue?: (issue: string) => void;
  onViewInPdf?: (pageNumber: number) => void;
  className?: string;
}

export function VerificationChecklist({
  documentId,
  documentName,
  extractionConfidence,
  extractedData,
  onVerify,
  onRequestReparse,
  onReportIssue,
  onViewInPdf,
  className,
}: VerificationChecklistProps) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    controlCount: false,
    exceptions: false,
    opinion: false,
    spotCheck1: false,
    spotCheck2: false,
    spotCheck3: false,
    spotCheck4: false,
    spotCheck5: false,
    subservices: false,
  });

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reportedControlCount, setReportedControlCount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;

  // Get random sample controls for spot-checking
  const sampleControls = extractedData.sampleControls.slice(0, 5);

  const handleCheckChange = useCallback((key: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [key]: checked }));
  }, []);

  const handleNoteChange = useCallback((key: string, note: string) => {
    setNotes((prev) => ({ ...prev, [key]: note }));
  }, []);

  const handleVerifyAll = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const result: VerificationResult = {
        documentId,
        documentName,
        extractionConfidence,
        checklistItems: Object.entries(checklist).map(([id, isVerified]) => ({
          id,
          category: id.startsWith('spotCheck') ? 'spot_check' : id as 'control_count' | 'exceptions' | 'opinion' | 'subservices',
          label: id,
          description: '',
          extractedValue: '',
          isVerified,
          notes: notes[id],
        })),
        overallVerified: allChecked,
        verifiedAt: allChecked ? new Date().toISOString() : undefined,
      };
      onVerify?.(result);
    } finally {
      setIsSubmitting(false);
    }
  }, [documentId, documentName, extractionConfidence, checklist, notes, allChecked, onVerify]);

  const confidenceColor = extractionConfidence >= 90 ? 'text-emerald-500' :
    extractionConfidence >= 70 ? 'text-amber-500' : 'text-red-500';

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Extraction Verification
            </CardTitle>
            <CardDescription>
              Verify that the AI extraction matches the source document
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={cn('text-2xl font-bold', confidenceColor)}>
              {Math.round(extractionConfidence)}%
            </div>
            <Badge
              variant={extractionConfidence >= 90 ? 'default' : 'outline'}
              className={cn(extractionConfidence < 90 && 'border-amber-500 text-amber-500')}
            >
              AI Confidence
            </Badge>
          </div>
        </div>

        {extractionConfidence < 90 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              Confidence below 90%. Manual verification strongly recommended.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Document Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
          <div>
            <span className="text-muted-foreground">Document:</span>
            <p className="font-medium truncate">{documentName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Report Type:</span>
            <p className="font-medium">{extractedData.reportType}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Audit Firm:</span>
            <p className="font-medium">{extractedData.auditFirm}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Period:</span>
            <p className="font-medium">
              {extractedData.periodStart} to {extractedData.periodEnd}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Verification Progress
          </span>
          <span className="text-sm font-medium">
            {checkedCount} of {totalItems} items verified
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', {
              'bg-emerald-500': checkedCount === totalItems,
              'bg-amber-500': checkedCount > 0 && checkedCount < totalItems,
              'bg-muted-foreground/30': checkedCount === 0,
            })}
            style={{ width: `${(checkedCount / totalItems) * 100}%` }}
          />
        </div>

        <Separator />

        {/* Verification Items */}
        <div className="space-y-4">
          {/* 1. Control Count */}
          <VerificationItem
            id="controlCount"
            label="Total Control Count"
            description="Verify the extracted count matches the report's stated count"
            checked={checklist.controlCount}
            onCheckedChange={(checked) => handleCheckChange('controlCount', checked)}
          >
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Extracted</Label>
                  <p className="font-bold text-lg">{extractedData.controlCount}</p>
                </div>
                <div className="flex-1">
                  <Label htmlFor="reportedCount" className="text-xs text-muted-foreground">
                    Report States (optional)
                  </Label>
                  <Input
                    id="reportedCount"
                    type="number"
                    placeholder="Enter count from report"
                    value={reportedControlCount}
                    onChange={(e) => setReportedControlCount(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {reportedControlCount && parseInt(reportedControlCount) !== extractedData.controlCount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Counts do not match! Extracted: {extractedData.controlCount}, Reported: {reportedControlCount}
                </p>
              )}
            </div>
          </VerificationItem>

          {/* 2. Exceptions */}
          <VerificationItem
            id="exceptions"
            label="Exceptions Section"
            description="Verify exception count is accurate"
            checked={checklist.exceptions}
            onCheckedChange={(checked) => handleCheckChange('exceptions', checked)}
          >
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={extractedData.exceptionCount === 0 ? 'default' : 'destructive'}
                className={cn(extractedData.exceptionCount === 0 && 'bg-emerald-500')}
              >
                {extractedData.exceptionCount} exception{extractedData.exceptionCount !== 1 ? 's' : ''} found
              </Badge>
              {extractedData.exceptionCount === 0 && (
                <span className="text-xs text-muted-foreground">
                  Verify no exceptions exist in Section 5 of the report
                </span>
              )}
            </div>
          </VerificationItem>

          {/* 3. Opinion */}
          <VerificationItem
            id="opinion"
            label="Auditor's Opinion"
            description="Verify the opinion matches the report"
            checked={checklist.opinion}
            onCheckedChange={(checked) => handleCheckChange('opinion', checked)}
          >
            <div className="mt-2">
              <Badge
                variant={extractedData.opinion === 'unqualified' ? 'default' : 'destructive'}
                className={cn('text-sm', extractedData.opinion === 'unqualified' && 'bg-emerald-500')}
              >
                {extractedData.opinion.charAt(0).toUpperCase() + extractedData.opinion.slice(1)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Check Opinion Letter (typically pages 2-3)
              </p>
            </div>
          </VerificationItem>

          <Separator />

          {/* 4. Spot-Check Controls */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Spot-Check Random Controls
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Verify these randomly selected controls appear correctly in the PDF
            </p>
            <div className="space-y-2">
              {sampleControls.map((control, index) => (
                <VerificationItem
                  key={control.id}
                  id={`spotCheck${index + 1}`}
                  label={control.id}
                  description={control.description.slice(0, 100) + (control.description.length > 100 ? '...' : '')}
                  checked={checklist[`spotCheck${index + 1}` as keyof typeof checklist] || false}
                  onCheckedChange={(checked) => handleCheckChange(`spotCheck${index + 1}`, checked)}
                  compact
                >
                  {control.pageRef && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => onViewInPdf?.(control.pageRef!)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Page {control.pageRef}
                    </Button>
                  )}
                </VerificationItem>
              ))}
            </div>
          </div>

          <Separator />

          {/* 5. Subservice Organizations */}
          <VerificationItem
            id="subservices"
            label="Subservice Organizations"
            description="Verify all subservice organizations are correctly identified"
            checked={checklist.subservices}
            onCheckedChange={(checked) => handleCheckChange('subservices', checked)}
          >
            <div className="mt-2">
              {extractedData.subserviceOrgs.length > 0 ? (
                <div className="space-y-1">
                  {extractedData.subserviceOrgs.map((org, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {i + 1}
                      </Badge>
                      <span className="font-medium">{org.name}</span>
                      <span className="text-muted-foreground text-xs">({org.services})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No subservice organizations extracted. Verify Section 4 of the report.
                </p>
              )}
            </div>
          </VerificationItem>
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <Label htmlFor="generalNotes" className="text-sm font-medium">
            General Notes (Optional)
          </Label>
          <Textarea
            id="generalNotes"
            placeholder="Add any notes about the verification process..."
            value={notes.general || ''}
            onChange={(e) => handleNoteChange('general', e.target.value)}
            className="mt-2 text-sm"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestReparse}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Re-parse
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReportIssue?.('Extraction issue reported')}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <Flag className="h-4 w-4" />
              Report Issue
            </Button>
          </div>
          <Button
            onClick={handleVerifyAll}
            disabled={isSubmitting}
            className={cn('gap-1', allChecked && 'bg-emerald-500 hover:bg-emerald-600')}
          >
            {allChecked ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Mark All Verified
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Save Progress ({checkedCount}/{totalItems})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Individual verification item
function VerificationItem({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  children,
  compact = false,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        checked ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/30 border-transparent',
        compact && 'p-2'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(c === true)}
          className={cn('mt-0.5', checked && 'bg-emerald-500 border-emerald-500')}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={id}
            className={cn(
              'font-medium cursor-pointer',
              compact ? 'text-sm' : 'text-base',
              checked && 'line-through text-muted-foreground'
            )}
          >
            {label}
          </Label>
          <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {description}
          </p>
          {children}
        </div>
        {checked && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
