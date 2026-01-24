'use client';

/**
 * Domain Assessment Sheet
 *
 * A side sheet for viewing and completing domain assessments
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Lock,
  Scale,
  Settings,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  RiskDomainWithCriteria,
  VendorDomainAssessmentWithDetails,
  DomainAssessmentCriterion,
} from '@/lib/domain-assessments/types';

interface DomainAssessmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: RiskDomainWithCriteria | null;
  assessment: VendorDomainAssessmentWithDetails | null;
  vendorId: string;
  vendorName: string;
  onComplete?: () => void;
}

interface CriterionScore {
  criterion_id: string;
  score: number;
  notes: string;
}

// Map domain names to icons
const domainIcons: Record<string, React.ElementType> = {
  Security: Shield,
  Privacy: Lock,
  Compliance: Scale,
  Operational: Settings,
  Financial: DollarSign,
};

// Score labels
function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-success' };
  if (score >= 70) return { label: 'Good', color: 'text-primary' };
  if (score >= 50) return { label: 'Adequate', color: 'text-warning' };
  if (score >= 30) return { label: 'Needs Improvement', color: 'text-orange-500' };
  return { label: 'Critical', color: 'text-error' };
}

export function DomainAssessmentSheet({
  open,
  onOpenChange,
  domain,
  assessment,
  vendorId,
  vendorName,
  onComplete,
}: DomainAssessmentSheetProps) {
  const [scores, setScores] = useState<CriterionScore[]>([]);
  const [notes, setNotes] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, []);

  // Initialize scores from assessment or defaults
  useEffect(() => {
    if (!domain) return;

    if (assessment?.scores && assessment.scores.length > 0) {
      // Load existing scores
      setScores(
        assessment.scores.map((s) => ({
          criterion_id: s.criterion_id,
          score: s.score,
          notes: s.notes || '',
        }))
      );
      setNotes(assessment.notes || '');
      setKeyFindings(assessment.key_findings?.join('\n') || '');
      setRecommendations(assessment.recommendations?.join('\n') || '');
    } else {
      // Initialize with defaults
      setScores(
        domain.criteria.map((c) => ({
          criterion_id: c.id,
          score: 50,
          notes: '',
        }))
      );
      setNotes('');
      setKeyFindings('');
      setRecommendations('');
    }
  }, [domain, assessment]);

  // Calculate overall score
  const overallScore = (() => {
    if (!domain || scores.length === 0) return 0;

    const totalWeight = domain.criteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = scores.reduce((sum, s) => {
      const criterion = domain.criteria.find((c) => c.id === s.criterion_id);
      if (!criterion) return sum;
      const normalizedScore = (s.score / criterion.max_score) * 100;
      return sum + normalizedScore * criterion.weight;
    }, 0);

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  })();

  const scoreInfo = getScoreLabel(overallScore);

  // Handle score change
  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((prev) =>
      prev.map((s) =>
        s.criterion_id === criterionId ? { ...s, score: value } : s
      )
    );
  };

  // Handle notes change
  const handleNotesChange = (criterionId: string, value: string) => {
    setScores((prev) =>
      prev.map((s) =>
        s.criterion_id === criterionId ? { ...s, notes: value } : s
      )
    );
  };

  // Submit assessment
  const handleSubmit = async () => {
    if (!domain || !userId) return;

    setSubmitting(true);
    const supabase = createClient();

    try {
      let assessmentId = assessment?.id;

      // Create assessment if it doesn't exist
      if (!assessmentId) {
        const { data: newAssessment, error: createError } = await supabase
          .from('vendor_domain_assessments')
          .insert({
            vendor_id: vendorId,
            domain_id: domain.id,
            status: 'in_progress',
            assessed_by: userId,
          })
          .select()
          .single();

        if (createError) throw createError;
        assessmentId = newAssessment.id;
      }

      // Delete existing scores
      await supabase
        .from('vendor_domain_scores')
        .delete()
        .eq('assessment_id', assessmentId);

      // Insert new scores
      const { error: scoresError } = await supabase
        .from('vendor_domain_scores')
        .insert(
          scores.map((s) => ({
            assessment_id: assessmentId,
            criterion_id: s.criterion_id,
            score: s.score,
            notes: s.notes || null,
            evidence_document_ids: [],
          }))
        );

      if (scoresError) throw scoresError;

      // Calculate risk level and maturity
      const riskLevel =
        overallScore >= 80 ? 'low' :
        overallScore >= 60 ? 'medium' :
        overallScore >= 40 ? 'high' : 'critical';

      const maturityLevel =
        overallScore >= 90 ? 'L4' :
        overallScore >= 70 ? 'L3' :
        overallScore >= 50 ? 'L2' :
        overallScore >= 30 ? 'L1' : 'L0';

      // Update assessment
      const { error: updateError } = await supabase
        .from('vendor_domain_assessments')
        .update({
          score: overallScore,
          risk_level: riskLevel,
          maturity_level: maturityLevel,
          status: 'completed',
          assessed_by: userId,
          assessed_at: new Date().toISOString(),
          notes: notes || null,
          key_findings: keyFindings.split('\n').filter(Boolean),
          recommendations: recommendations.split('\n').filter(Boolean),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      // Create history entry
      const scoresSnapshot: Record<string, number> = {};
      scores.forEach((s) => {
        scoresSnapshot[s.criterion_id] = s.score;
      });

      await supabase.from('vendor_domain_assessment_history').insert({
        vendor_id: vendorId,
        domain_id: domain.id,
        score: overallScore,
        maturity_level: maturityLevel,
        risk_level: riskLevel,
        assessed_by: userId,
        assessed_at: new Date().toISOString(),
        scores_snapshot: scoresSnapshot,
      });

      toast.success('Assessment submitted successfully');
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!domain) return null;

  const Icon = domainIcons[domain.name] || Shield;
  const isCompleted = assessment?.status === 'completed';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${domain.color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: domain.color }} />
            </div>
            <div>
              <SheetTitle className="text-xl">{domain.name} Assessment</SheetTitle>
              <SheetDescription>{vendorName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Overall Score Display */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Overall Score
                  </p>
                  <p className={cn('text-3xl font-bold', scoreInfo.color)}>
                    {overallScore}
                  </p>
                </div>
                <Badge
                  variant={
                    overallScore >= 80 ? 'default' :
                    overallScore >= 60 ? 'secondary' :
                    overallScore >= 40 ? 'outline' : 'destructive'
                  }
                  className="text-sm"
                >
                  {scoreInfo.label}
                </Badge>
              </div>
            </div>

            {/* Domain Description */}
            {domain.description && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{domain.description}</AlertDescription>
              </Alert>
            )}

            {/* Criteria Scoring */}
            <div className="space-y-4">
              <h3 className="font-semibold">Assessment Criteria</h3>
              <Accordion type="multiple" className="space-y-2">
                {domain.criteria.map((criterion, index) => {
                  const score = scores.find((s) => s.criterion_id === criterion.id);
                  const scoreValue = score?.score || 0;
                  const scoreLabel = getScoreLabel(scoreValue);

                  return (
                    <AccordionItem
                      key={criterion.id}
                      value={criterion.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-4 w-full pr-4">
                          <span className="flex-1 text-left">{criterion.name}</span>
                          <Badge variant="outline" className={scoreLabel.color}>
                            {scoreValue}/{criterion.max_score}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {criterion.description && (
                          <p className="text-sm text-muted-foreground">
                            {criterion.description}
                          </p>
                        )}

                        {criterion.guidance && (
                          <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-sm">
                              <span className="font-medium">Guidance: </span>
                              {criterion.guidance}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Score: {scoreValue}</Label>
                            <span className={cn('text-sm', scoreLabel.color)}>
                              {scoreLabel.label}
                            </span>
                          </div>
                          <Slider
                            value={[scoreValue]}
                            onValueChange={(v) => handleScoreChange(criterion.id, v[0])}
                            max={criterion.max_score}
                            step={1}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0</span>
                            <span>{criterion.max_score}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes (optional)</Label>
                          <Textarea
                            placeholder="Add notes about this criterion..."
                            value={score?.notes || ''}
                            onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                            rows={2}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>

            <Separator />

            {/* Summary Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold">Assessment Summary</h3>

              <div className="space-y-2">
                <Label>Overall Notes</Label>
                <Textarea
                  placeholder="General observations and notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Key Findings (one per line)</Label>
                <Textarea
                  placeholder="List key findings..."
                  value={keyFindings}
                  onChange={(e) => setKeyFindings(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Recommendations (one per line)</Label>
                <Textarea
                  placeholder="List recommendations..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="pt-4 border-t flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCompleted ? 'Update Assessment' : 'Submit Assessment'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
