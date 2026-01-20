'use client';

/**
 * Add Question Button Component
 *
 * Button that opens a dialog to add a new question to a template
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { toast } from 'sonner';
import { addQuestion } from '@/lib/nis2-questionnaire/actions';
import { NIS2_CATEGORIES, type NIS2Category, type QuestionType } from '@/lib/nis2-questionnaire/types';

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'boolean', label: 'Yes/No' },
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Single Choice' },
  { value: 'multiselect', label: 'Multiple Choice' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' },
];

const formSchema = z.object({
  question_text: z.string().min(10, 'Question must be at least 10 characters'),
  help_text: z.string().optional(),
  question_type: z.enum(['text', 'textarea', 'select', 'multiselect', 'boolean', 'date', 'number', 'file']),
  category: z.enum([
    'policies',
    'incident_handling',
    'business_continuity',
    'supply_chain',
    'access_control',
    'cryptography',
    'vulnerability_management',
    'security_awareness',
    'asset_management',
    'hr_security',
  ]),
  is_required: z.boolean(),
  ai_extraction_enabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddQuestionButtonProps {
  templateId: string;
  category?: NIS2Category;
}

export function AddQuestionButton({ templateId, category }: AddQuestionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: '',
      help_text: '',
      question_type: 'boolean',
      category: category || 'policies',
      is_required: true,
      ai_extraction_enabled: true,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await addQuestion({
        template_id: templateId,
        question_text: values.question_text,
        help_text: values.help_text || undefined,
        question_type: values.question_type,
        category: values.category,
        is_required: values.is_required,
        ai_extraction_enabled: values.ai_extraction_enabled,
        ai_confidence_threshold: 0.6,
        display_order: 999, // Will be adjusted by the backend
      });

      if (result.success) {
        toast.success('Question added');
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {category ? (
          <Button variant="outline" size="sm" className="w-full border-dashed">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Question
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
          <DialogDescription>
            Add a new question to the questionnaire template
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question text..."
                      className="resize-none"
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
                  <FormLabel>Help Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional guidance for the respondent" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide context or examples to help vendors answer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.entries(NIS2_CATEGORIES) as [NIS2Category, { label: string }][]).map(
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
            </div>

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
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
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">AI Extraction</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
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
