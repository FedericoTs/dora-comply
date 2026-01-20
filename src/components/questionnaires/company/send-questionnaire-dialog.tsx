'use client';

/**
 * SendQuestionnaireDialog Component
 *
 * Dialog for sending a questionnaire to a vendor
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Send, Loader2, Building2, Mail, User, Calendar, FileText, Sparkles } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendQuestionnaireSchema, type SendQuestionnaireInput } from '@/lib/nis2-questionnaire/schemas';
import { sendQuestionnaire } from '@/lib/nis2-questionnaire/actions';

interface SendQuestionnaireDialogProps {
  children: React.ReactNode;
  vendorId?: string;
  vendorEmail?: string;
  vendorName?: string;
}

interface Vendor {
  id: string;
  name: string;
  primary_contact_email?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  estimated_completion_minutes: number;
}

export function SendQuestionnaireDialog({
  children,
  vendorId,
  vendorEmail,
  vendorName,
}: SendQuestionnaireDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const router = useRouter();

  const form = useForm<SendQuestionnaireInput>({
    resolver: zodResolver(sendQuestionnaireSchema),
    defaultValues: {
      vendor_id: vendorId || '',
      template_id: '',
      vendor_email: vendorEmail || '',
      vendor_name: vendorName || '',
      vendor_contact_name: '',
      due_date: undefined,
      send_email: true,
    },
  });

  // Fetch vendors and templates when dialog opens
  useEffect(() => {
    if (open && vendors.length === 0) {
      setLoadingData(true);
      Promise.all([
        fetch('/api/vendors?limit=100').then((r) => r.json()),
        fetch('/api/questionnaires/templates').then((r) => r.json()),
      ])
        .then(([vendorsRes, templatesRes]) => {
          setVendors(vendorsRes.data || []);
          setTemplates(templatesRes.data || []);
        })
        .catch((err) => {
          console.error('Failed to load data:', err);
          toast.error('Failed to load vendors and templates');
        })
        .finally(() => setLoadingData(false));
    }
  }, [open, vendors.length]);

  // Update email when vendor changes
  const selectedVendorId = form.watch('vendor_id');
  useEffect(() => {
    if (selectedVendorId && vendors.length > 0) {
      const vendor = vendors.find((v) => v.id === selectedVendorId);
      if (vendor) {
        form.setValue('vendor_name', vendor.name);
        if (vendor.primary_contact_email) {
          form.setValue('vendor_email', vendor.primary_contact_email);
        }
      }
    }
  }, [selectedVendorId, vendors, form]);

  async function onSubmit(data: SendQuestionnaireInput) {
    setLoading(true);
    try {
      const result = await sendQuestionnaire(data);

      if (result.success) {
        toast.success('Questionnaire sent successfully');
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send questionnaire');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Questionnaire
          </DialogTitle>
          <DialogDescription>
            Send an NIS2 security questionnaire to a vendor. They&apos;ll receive a magic link to
            complete it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vendor Selection */}
            <FormField
              control={form.control}
              name="vendor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Vendor
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingData || !!vendorId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Selection */}
            <FormField
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Questionnaire Template
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ~{template.estimated_completion_minutes} min
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the questionnaire template to send
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Email */}
            <FormField
              control={form.control}
              name="vendor_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Vendor Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vendor@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The magic link will be sent to this email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Name (Optional) */}
            <FormField
              control={form.control}
              name="vendor_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Name
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date (Optional) */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Send Email Checkbox */}
            <FormField
              control={form.control}
              name="send_email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send email invitation</FormLabel>
                    <FormDescription>
                      Send the magic link to the vendor immediately
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* AI Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">AI-Powered Completion</p>
                <p className="text-muted-foreground">
                  Vendors can upload SOC 2 reports, ISO 27001 certificates, or security policies.
                  AI will automatically extract answers to save time.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingData}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Questionnaire
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
