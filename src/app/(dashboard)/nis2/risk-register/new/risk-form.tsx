'use client';

/**
 * NIS2 Risk Form Component
 *
 * Client-side form for creating a new NIS2 risk
 */

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Loader2, Shield, Target, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { NIS2CategoryLabels, NIS2_CATEGORIES } from '@/lib/compliance/nis2-types';
import {
  LIKELIHOOD_SCALE,
  IMPACT_SCALE,
  TREATMENT_STRATEGY_CONFIG,
  type LikelihoodScore,
  type ImpactScore,
  type TreatmentStrategy,
} from '@/lib/nis2/types';
import { createRiskAction, type ActionState } from './actions';

// Initial state for the form action
const initialState: ActionState = {
  success: false,
};

// Submit button with loading state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="min-w-[120px]">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        'Create Risk'
      )}
    </Button>
  );
}

// Risk score preview component
function RiskScorePreview({
  likelihood,
  impact,
}: {
  likelihood: number;
  impact: number;
}) {
  const score = likelihood * impact;
  const level =
    score <= 4
      ? 'low'
      : score <= 9
        ? 'medium'
        : score <= 15
          ? 'high'
          : 'critical';

  const levelColors = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };

  const levelLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <div className="text-sm text-muted-foreground mb-2">
        Inherent Risk Score
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{score}</span>
        <span
          className={cn(
            'px-2 py-1 rounded-md text-xs font-medium border',
            levelColors[level]
          )}
        >
          {levelLabels[level]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Score = Likelihood ({likelihood}) × Impact ({impact})
      </p>
    </div>
  );
}

export function RiskForm() {
  const [state, formAction] = useActionState(createRiskAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Risk Information
          </CardTitle>
          <CardDescription>
            Describe the risk and categorize it according to NIS2 domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Risk Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Ransomware attack on critical systems"
              required
              maxLength={255}
            />
            {state.fieldErrors?.title && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.title[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide a detailed description of the risk, its potential causes, and consequences..."
              rows={4}
              maxLength={2000}
            />
            {state.fieldErrors?.description && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              NIS2 Category <span className="text-destructive">*</span>
            </Label>
            <Select name="category" required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {NIS2_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {NIS2CategoryLabels[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.category && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.category[0]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
          <CardDescription>
            Assess the likelihood and impact of the risk using a 5-point scale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Likelihood */}
            <div className="space-y-2">
              <Label htmlFor="likelihood_score">
                Likelihood <span className="text-destructive">*</span>
              </Label>
              <Select name="likelihood_score" required defaultValue="3">
                <SelectTrigger id="likelihood_score">
                  <SelectValue placeholder="Select likelihood" />
                </SelectTrigger>
                <SelectContent>
                  {([1, 2, 3, 4, 5] as LikelihoodScore[]).map((score) => (
                    <SelectItem key={score} value={score.toString()}>
                      {score} - {LIKELIHOOD_SCALE[score].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.likelihood_score && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.likelihood_score[0]}
                </p>
              )}
            </div>

            {/* Impact */}
            <div className="space-y-2">
              <Label htmlFor="impact_score">
                Impact <span className="text-destructive">*</span>
              </Label>
              <Select name="impact_score" required defaultValue="3">
                <SelectTrigger id="impact_score">
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent>
                  {([1, 2, 3, 4, 5] as ImpactScore[]).map((score) => (
                    <SelectItem key={score} value={score.toString()}>
                      {score} - {IMPACT_SCALE[score].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.impact_score && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.impact_score[0]}
                </p>
              )}
            </div>
          </div>

          {/* Risk Score Preview - uses default 3x3 */}
          <RiskScorePreview likelihood={3} impact={3} />

          {/* Tolerance Threshold */}
          <div className="space-y-2">
            <Label htmlFor="tolerance_threshold">Risk Tolerance Threshold</Label>
            <Select name="tolerance_threshold" defaultValue="9">
              <SelectTrigger id="tolerance_threshold">
                <SelectValue placeholder="Select tolerance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 (Low - Conservative)</SelectItem>
                <SelectItem value="9">9 (Medium - Standard)</SelectItem>
                <SelectItem value="15">15 (High - Aggressive)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Risks scoring above this threshold are considered outside tolerance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plan (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Treatment Plan
            <span className="text-sm font-normal text-muted-foreground">
              (Optional)
            </span>
          </CardTitle>
          <CardDescription>
            Define how you plan to address this risk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Treatment Strategy */}
          <div className="space-y-2">
            <Label htmlFor="treatment_strategy">Treatment Strategy</Label>
            <Select name="treatment_strategy">
              <SelectTrigger id="treatment_strategy">
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(TREATMENT_STRATEGY_CONFIG) as TreatmentStrategy[]
                ).map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {TREATMENT_STRATEGY_CONFIG[strategy].label} -{' '}
                    {TREATMENT_STRATEGY_CONFIG[strategy].description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Plan */}
          <div className="space-y-2">
            <Label htmlFor="treatment_plan">Treatment Plan Details</Label>
            <Textarea
              id="treatment_plan"
              name="treatment_plan"
              placeholder="Describe the actions to be taken to treat this risk..."
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="treatment_due_date">Target Completion Date</Label>
            <Input
              id="treatment_due_date"
              name="treatment_due_date"
              type="date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <a href="/nis2/risk-register">Cancel</a>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
