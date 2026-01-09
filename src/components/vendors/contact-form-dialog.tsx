'use client';

/**
 * Contact Form Dialog
 *
 * Dialog component for creating/editing vendor contacts
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  createContactSchema,
  type CreateContactFormData,
  CONTACT_TYPE_INFO,
  CONTACT_TYPES,
} from '@/lib/contacts';
import { type VendorContactRecord } from '@/lib/vendors/types';
import { createContact, updateContact } from '@/lib/contacts/actions';

interface ContactFormDialogProps {
  vendorId: string;
  contact?: VendorContactRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ContactFormDialog({
  vendorId,
  contact,
  open,
  onOpenChange,
  onSuccess,
}: ContactFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!contact;

  const form = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactSchema),
    mode: 'onTouched',
    defaultValues: {
      vendor_id: vendorId,
      contact_type: contact?.contact_type || 'primary',
      name: contact?.name || '',
      title: contact?.title || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
    },
  });

  const onSubmit = async (data: CreateContactFormData) => {
    setIsLoading(true);

    try {
      if (isEditing && contact) {
        const result = await updateContact(contact.id, {
          contact_type: data.contact_type,
          name: data.name,
          title: data.title || null,
          email: data.email || null,
          phone: data.phone || null,
        });

        if (!result.success) {
          toast.error(result.error?.message || 'Failed to update contact');
          return;
        }

        toast.success('Contact updated successfully');
      } else {
        const result = await createContact(data);

        if (!result.success) {
          toast.error(result.error?.message || 'Failed to create contact');
          return;
        }

        toast.success('Contact added successfully');
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        vendor_id: vendorId,
        contact_type: 'primary',
        name: '',
        title: '',
        email: '',
        phone: '',
      });
    } else if (contact) {
      form.reset({
        vendor_id: vendorId,
        contact_type: contact.contact_type,
        name: contact.name,
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the contact information below.'
              : 'Add a new contact for this vendor. Required for DORA RoI template B_02.02.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_type">Contact Type</Label>
            <Select
              value={form.watch('contact_type')}
              onValueChange={(value) =>
                form.setValue('contact_type', value as CreateContactFormData['contact_type'])
              }
            >
              <SelectTrigger id="contact_type">
                <SelectValue placeholder="Select contact type" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex flex-col">
                      <span>{CONTACT_TYPE_INFO[type].label}</span>
                      <span className="text-xs text-muted-foreground">
                        {CONTACT_TYPE_INFO[type].description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.contact_type && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contact_type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="John Smith"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="Senior Account Manager"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.smith@vendor.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+49 123 456 7890"
              {...form.register('phone')}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Contact' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
