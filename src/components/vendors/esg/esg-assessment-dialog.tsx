'use client';

/**
 * ESG Assessment Dialog Component
 *
 * Multi-step form for creating/completing ESG assessments
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight, Save, Leaf, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ESGCategoryWithMetrics, MetricType } from '@/lib/esg/types';

interface ESGAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  onSuccess?: () => void;
}

const assessmentSchema = z.object({
  assessment_year: z.number().min(2020).max(2030),
  assessment_period: z.enum(['annual', 'q1', 'q2', 'q3', 'q4']),
  notes: z.string().optional(),
  key_strengths: z.array(z.string()).optional(),
  improvement_areas: z.array(z.string()).optional(),
  external_rating_provider: z.string().optional(),
  external_rating: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export function ESGAssessmentDialog({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  onSuccess,
}: ESGAssessmentDialogProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ESGCategoryWithMetrics[]>([]);
  const [metricValues, setMetricValues] = useState<Record<string, { numeric?: number; boolean?: boolean; text?: string }>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      assessment_year: new Date().getFullYear(),
      assessment_period: 'annual',
      notes: '',
      key_strengths: [],
      improvement_areas: [],
      external_rating_provider: '',
      external_rating: '',
    },
  });

  // Fetch categories and metrics
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/esg/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch ESG categories:', error);
    }
  };

  const handleCreateAssessment = async (data: AssessmentFormData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors/${vendorId}/esg/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create assessment');

      const result = await response.json();
      setAssessmentId(result.assessmentId);
      setStep(1); // Move to metrics entry
    } catch (error) {
      toast.error('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!assessmentId) return;

    try {
      setLoading(true);
      const formData = form.getValues();

      const metricValuesArray = Object.entries(metricValues).map(([metricId, values]) => ({
        metric_id: metricId,
        numeric_value: values.numeric,
        boolean_value: values.boolean,
        text_value: values.text,
      }));

      const response = await fetch(`/api/vendors/${vendorId}/esg/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_values: metricValuesArray,
          notes: formData.notes,
          key_strengths: formData.key_strengths?.filter(Boolean) || [],
          improvement_areas: formData.improvement_areas?.filter(Boolean) || [],
          external_rating_provider: formData.external_rating_provider || null,
          external_rating: formData.external_rating || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit assessment');

      toast.success('ESG assessment has been saved successfully.');

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setAssessmentId(null);
    setMetricValues({});
    form.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const updateMetricValue = (metricId: string, type: 'numeric' | 'boolean' | 'text', value: number | boolean | string | undefined) => {
    setMetricValues((prev) => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [type]: value,
      },
    }));
  };

  const totalSteps = categories.length + 2; // Setup + each category + summary
  const currentCategory = step > 0 && step <= categories.length ? categories[step - 1] : null;

  const PILLAR_ICONS: Record<string, typeof Leaf> = {
    Environmental: Leaf,
    Social: Users,
    Governance: Building2,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ESG Assessment - {vendorName}</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {totalSteps}:{' '}
            {step === 0
              ? 'Assessment Setup'
              : step <= categories.length
              ? `${currentCategory?.name} Metrics`
              : 'Summary & Submit'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <Form {...form}>
          {/* Step 0: Setup */}
          {step === 0 && (
            <form onSubmit={form.handleSubmit(handleCreateAssessment)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="assessment_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Year</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(v) => field.onChange(parseInt(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2024, 2025, 2026].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assessment_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Period</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="q1">Q1</SelectItem>
                          <SelectItem value="q2">Q2</SelectItem>
                          <SelectItem value="q3">Q3</SelectItem>
                          <SelectItem value="q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="external_rating_provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Rating Provider (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EcoVadis, CDP, MSCI" {...field} />
                    </FormControl>
                    <FormDescription>
                      If the vendor has an external ESG rating
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="external_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Rating (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gold, A+, AAA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* Steps 1-N: Category Metrics */}
          {currentCategory && (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {PILLAR_ICONS[currentCategory.name] && (
                      (() => {
                        const Icon = PILLAR_ICONS[currentCategory.name];
                        return <Icon className="h-5 w-5 text-primary" />;
                      })()
                    )}
                    {currentCategory.name}
                  </CardTitle>
                  {currentCategory.description && (
                    <p className="text-sm text-muted-foreground">
                      {currentCategory.description}
                    </p>
                  )}
                </CardHeader>
              </Card>

              <div className="space-y-4">
                {currentCategory.metrics.map((metric) => (
                  <Card key={metric.id} className="card-elevated">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{metric.name}</h4>
                            {metric.is_required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {metric.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {metric.description}
                            </p>
                          )}
                          {metric.guidance && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Tip: {metric.guidance}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 w-48">
                          {metric.metric_type === 'boolean' ? (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={metricValues[metric.id]?.boolean ?? false}
                                onCheckedChange={(checked) =>
                                  updateMetricValue(metric.id, 'boolean', checked === true)
                                }
                              />
                              <span className="text-sm">
                                {metricValues[metric.id]?.boolean ? 'Yes' : 'No'}
                              </span>
                            </div>
                          ) : metric.metric_type === 'percentage' || metric.metric_type === 'rating' || metric.metric_type === 'numeric' ? (
                            <Input
                              type="number"
                              placeholder={metric.unit || 'Enter value'}
                              value={metricValues[metric.id]?.numeric ?? ''}
                              onChange={(e) =>
                                updateMetricValue(
                                  metric.id,
                                  'numeric',
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              className="text-right"
                            />
                          ) : (
                            <Input
                              type="text"
                              placeholder="Enter value"
                              value={metricValues[metric.id]?.text ?? ''}
                              onChange={(e) =>
                                updateMetricValue(metric.id, 'text', e.target.value)
                              }
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(step + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Final Step: Summary */}
          {step === totalSteps - 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assessment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {categories.map((cat) => {
                      const filledMetrics = cat.metrics.filter(
                        (m) => metricValues[m.id]?.numeric !== undefined ||
                               metricValues[m.id]?.boolean !== undefined ||
                               metricValues[m.id]?.text
                      ).length;
                      return (
                        <div key={cat.id} className="text-center p-4 rounded-lg bg-muted">
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {filledMetrics} / {cat.metrics.length} metrics
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional notes about this assessment..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="button" onClick={handleSubmitAssessment} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Complete Assessment
                </Button>
              </div>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
