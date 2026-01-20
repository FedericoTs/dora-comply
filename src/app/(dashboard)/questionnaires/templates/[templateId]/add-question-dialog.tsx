'use client';

/**
 * Enhanced Add Question Dialog Component
 *
 * Full-featured dialog for creating customized questions with:
 * - Multiple question types with options editor
 * - AI extraction configuration
 * - Validation rules
 * - NIS2 category mapping
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  Sparkles,
  Settings2,
  Trash2,
  GripVertical,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { addQuestion } from '@/lib/nis2-questionnaire/actions';
import { NIS2_CATEGORIES, type NIS2Category, type QuestionType } from '@/lib/nis2-questionnaire/types';
import { cn } from '@/lib/utils';

// Question type configuration with descriptions
const questionTypes: { value: QuestionType; label: string; description: string; hasOptions: boolean }[] = [
  { value: 'boolean', label: 'Yes/No', description: 'Simple yes or no question', hasOptions: false },
  { value: 'text', label: 'Short Text', description: 'Single-line text input', hasOptions: false },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text for detailed answers', hasOptions: false },
  { value: 'select', label: 'Single Choice', description: 'Select one option from a list', hasOptions: true },
  { value: 'multiselect', label: 'Multiple Choice', description: 'Select multiple options', hasOptions: true },
  { value: 'number', label: 'Number', description: 'Numeric value input', hasOptions: false },
  { value: 'date', label: 'Date', description: 'Date picker input', hasOptions: false },
  { value: 'file', label: 'File Upload', description: 'Allow document upload', hasOptions: false },
];

// Form validation schema
const formSchema = z.object({
  question_text: z.string().min(10, 'Question must be at least 10 characters'),
  help_text: z.string().optional(),
  question_type: z.enum(['text', 'textarea', 'select', 'multiselect', 'boolean', 'date', 'number', 'file']),
  category: z.enum([
    'policies',
    'incident_handling',
    'business_continuity',
    'supply_chain',
    'vulnerability_management',
    'effectiveness_assessment',
    'security_awareness',
    'cryptography',
    'access_control',
    'mfa_secure_comms',
    'asset_management',
    'hr_security',
  ]),
  subcategory: z.string().optional(),
  is_required: z.boolean(),
  // Options for select/multiselect
  options: z.array(z.object({
    value: z.string().min(1, 'Value is required'),
    label: z.string().min(1, 'Label is required'),
    description: z.string().optional(),
  })).optional(),
  // Validation rules
  validation_min_length: z.number().int().min(0).optional(),
  validation_max_length: z.number().int().min(1).optional(),
  validation_min: z.number().optional(),
  validation_max: z.number().optional(),
  // AI extraction settings
  ai_extraction_enabled: z.boolean(),
  ai_extraction_keywords: z.string().optional(), // Comma-separated
  ai_confidence_threshold: z.number().min(0).max(1),
  ai_extraction_prompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddQuestionDialogProps {
  templateId: string;
  category?: NIS2Category;
  trigger?: React.ReactNode;
}

export function AddQuestionDialog({ templateId, category, trigger }: AddQuestionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: '',
      help_text: '',
      question_type: 'boolean',
      category: category || 'policies',
      subcategory: '',
      is_required: true,
      options: [],
      validation_min_length: undefined,
      validation_max_length: undefined,
      validation_min: undefined,
      validation_max: undefined,
      ai_extraction_enabled: true,
      ai_extraction_keywords: '',
      ai_confidence_threshold: 0.6,
      ai_extraction_prompt: '',
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const questionType = form.watch('question_type');
  const aiEnabled = form.watch('ai_extraction_enabled');
  const confidenceThreshold = form.watch('ai_confidence_threshold');

  // Check if current question type supports options
  const selectedTypeConfig = questionTypes.find(t => t.value === questionType);
  const hasOptions = selectedTypeConfig?.hasOptions || false;

  // Add default options when switching to select/multiselect
  useEffect(() => {
    if (hasOptions && optionFields.length === 0) {
      appendOption({ value: 'option_1', label: 'Option 1', description: '' });
      appendOption({ value: 'option_2', label: 'Option 2', description: '' });
    }
  }, [hasOptions, optionFields.length, appendOption]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Build validation rules object
      const validation_rules: Record<string, unknown> = {};
      if (values.validation_min_length) validation_rules.minLength = values.validation_min_length;
      if (values.validation_max_length) validation_rules.maxLength = values.validation_max_length;
      if (values.validation_min !== undefined) validation_rules.min = values.validation_min;
      if (values.validation_max !== undefined) validation_rules.max = values.validation_max;

      // Parse keywords
      const keywords = values.ai_extraction_keywords
        ? values.ai_extraction_keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];

      const result = await addQuestion({
        template_id: templateId,
        question_text: values.question_text,
        help_text: values.help_text || undefined,
        question_type: values.question_type,
        category: values.category,
        subcategory: values.subcategory || undefined,
        is_required: values.is_required,
        options: hasOptions ? values.options : [],
        validation_rules: Object.keys(validation_rules).length > 0 ? validation_rules : undefined,
        ai_extraction_enabled: values.ai_extraction_enabled,
        ai_extraction_keywords: keywords,
        ai_confidence_threshold: values.ai_confidence_threshold,
        ai_extraction_prompt: values.ai_extraction_prompt || undefined,
        display_order: 999, // Will be adjusted by the backend
      });

      if (result.success) {
        toast.success('Question added successfully');
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add question');
      }
    } catch (error) {
      toast.error('Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  }

  const defaultTrigger = category ? (
    <Button variant="outline" size="sm" className="w-full border-dashed">
      <Plus className="mr-2 h-3.5 w-3.5" />
      Add Question
    </Button>
  ) : (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Question
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Add Question</DialogTitle>
          <DialogDescription>
            Create a customized question for your NIS2 vendor assessment
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
            {/* Row 1: Question Text and Help Text side by side */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="question_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Does your organization have a documented incident response plan?"
                        className="resize-none h-[72px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="help_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Help Text <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Guidance for vendors answering this question"
                        className="resize-none h-[72px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Answer Type, Category, and Toggles in one row */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {questionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIS2 Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.entries(NIS2_CATEGORIES) as [NIS2Category, { label: string; article: string }][]).map(
                          ([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 h-10 pt-1">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Required</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ai_extraction_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 h-10 pt-1">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      AI Auto-fill
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Options Editor (for select/multiselect) - compact inline version */}
            {hasOptions && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Answer Options</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => appendOption({ value: `option_${optionFields.length + 1}`, label: '', description: '' })}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {optionFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab flex-shrink-0" />
                      <FormField
                        control={form.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="value" {...field} className="h-8 font-mono text-xs" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`options.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-[2]">
                            <FormControl>
                              <Input placeholder="Display Label" {...field} className="h-8" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => removeOption(index)}
                        disabled={optionFields.length <= 2}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible sections in a single row */}
            <div className="flex gap-2">
              {/* AI Extraction Settings */}
              {aiEnabled && (
                <Collapsible open={showAISettings} onOpenChange={setShowAISettings} className="flex-1">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        AI Settings
                      </span>
                      {showAISettings ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="ai_extraction_keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs flex items-center gap-1">
                              Keywords
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>Keywords help AI find relevant content in documents</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="incident response, IRP..."
                                {...field}
                                className="h-8"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ai_confidence_threshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs flex items-center justify-between">
                              <span>Confidence</span>
                              <Badge variant="outline" className="text-[10px] h-5">{Math.round(confidenceThreshold * 100)}%</Badge>
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={5}
                                value={[confidenceThreshold * 100]}
                                onValueChange={([val]) => field.onChange(val / 100)}
                                className="py-2"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ai_extraction_prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Custom Prompt</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Specific instructions for AI extraction..."
                              {...field}
                              className="h-8"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Advanced Settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="flex-1">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      Advanced
                    </span>
                    {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Subcategory</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Governance, Technical Controls" {...field} className="h-8" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Validation rules for text types */}
                  {(questionType === 'text' || questionType === 'textarea') && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="validation_min_length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Min Length</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                className="h-8"
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validation_max_length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Max Length</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="∞"
                                {...field}
                                className="h-8"
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Validation rules for number type */}
                  {questionType === 'number' && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="validation_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Min Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="-∞"
                                {...field}
                                className="h-8"
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validation_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Max Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="∞"
                                {...field}
                                className="h-8"
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Question
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
