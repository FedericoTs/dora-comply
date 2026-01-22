'use client';

/**
 * CreateTemplateDialog Component
 *
 * Dialog for creating a new questionnaire template
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2, FileText, Sparkles } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createTemplateSchema, type CreateTemplateInput } from '@/lib/nis2-questionnaire/schemas';
import { createTemplateWithDefaultQuestions } from '@/lib/nis2-questionnaire/actions';
import { NIS2_CATEGORIES, type NIS2Category } from '@/lib/nis2-questionnaire/types';

interface CreateTemplateDialogProps {
  children: React.ReactNode;
}

const categoryOptions = Object.entries(NIS2_CATEGORIES).map(([key, value]) => ({
  value: key as NIS2Category,
  label: value.label,
  article: value.article,
}));

export function CreateTemplateDialog({ children }: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      nis2_categories: ['policies', 'incident_handling', 'business_continuity', 'supply_chain', 'access_control', 'cryptography', 'vulnerability_management', 'security_awareness'],
      is_default: false,
      estimated_completion_minutes: 30,
    },
  });

  async function onSubmit(data: CreateTemplateInput) {
    setLoading(true);
    try {
      const result = await createTemplateWithDefaultQuestions(data);

      if (result.success && result.data) {
        toast.success(`Template created with ${result.data.questionCount} default questions`);
        setOpen(false);
        form.reset();
        router.push(`/questionnaires/templates/${result.data.template.id}`);
      } else {
        toast.error(result.error || 'Failed to create template');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Questionnaire Template
          </DialogTitle>
          <DialogDescription>
            Create a reusable template for vendor security questionnaires. Default NIS2 Article 21
            questions will be added automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Template Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="NIS2 Standard Security Assessment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Comprehensive security questionnaire covering NIS2 Article 21 requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NIS2 Categories */}
            <FormField
              control={form.control}
              name="nis2_categories"
              render={() => (
                <FormItem>
                  <FormLabel>NIS2 Article 21 Categories</FormLabel>
                  <FormDescription>
                    Select which security categories to include. Questions will be added for each.
                  </FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {categoryOptions.map((category) => (
                      <FormField
                        key={category.value}
                        control={form.control}
                        name="nis2_categories"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={category.value}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), category.value])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== category.value)
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-0.5 leading-none">
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {category.label}
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">{category.article}</p>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Time */}
            <FormField
              control={form.control}
              name="estimated_completion_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Completion Time (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={480}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How long vendors typically need to complete this questionnaire
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Set as Default */}
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default template</FormLabel>
                    <FormDescription>
                      Pre-select this template when sending new questionnaires
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* AI Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">AI-Ready Questions</p>
                <p className="text-muted-foreground">
                  Each question includes AI extraction configuration. When vendors upload documents,
                  AI will automatically search for relevant information.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
