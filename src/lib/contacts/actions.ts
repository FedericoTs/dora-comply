'use server';

/**
 * Vendor Contacts Server Actions
 * Server-side actions for vendor contacts CRUD operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactFormData,
  type UpdateContactFormData,
} from './schema';
import type { VendorContact } from './types';

// ============================================================================
// Types
// ============================================================================

export type ContactErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ContactError {
  code: ContactErrorCode;
  message: string;
  field?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: ContactError;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createContactError(
  code: ContactErrorCode,
  message: string,
  field?: string
): ContactError {
  return { code, message, field };
}

function mapDatabaseError(error: { message: string; code?: string }): ContactError {
  const message = error.message.toLowerCase();

  if (message.includes('foreign key') || message.includes('violates')) {
    return createContactError('DATABASE_ERROR', 'Invalid vendor reference');
  }

  if (message.includes('permission') || message.includes('policy')) {
    return createContactError('UNAUTHORIZED', 'You do not have permission to perform this action');
  }

  return createContactError('DATABASE_ERROR', error.message);
}

async function getCurrentUserOrganization(): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

async function verifyVendorOwnership(vendorId: string, organizationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  return !!vendor;
}

function mapContactFromDatabase(row: Record<string, unknown>): VendorContact {
  return {
    id: row.id as string,
    vendor_id: row.vendor_id as string,
    contact_type: row.contact_type as VendorContact['contact_type'],
    name: row.name as string,
    title: row.title as string | null,
    email: row.email as string | null,
    phone: row.phone as string | null,
    created_at: row.created_at as string,
  };
}

// ============================================================================
// Create Contact
// ============================================================================

export async function createContact(
  formData: CreateContactFormData
): Promise<ActionResult<VendorContact>> {
  // Validate input
  const result = createContactSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createContactError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.')
      ),
    };
  }

  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContactError('UNAUTHORIZED', 'You must be logged in to add a contact'),
    };
  }

  const data = result.data;

  // Verify vendor ownership
  const isOwner = await verifyVendorOwnership(data.vendor_id, organizationId);
  if (!isOwner) {
    return {
      success: false,
      error: createContactError('NOT_FOUND', 'Vendor not found'),
    };
  }

  // Insert contact
  const { data: contact, error } = await supabase
    .from('vendor_contacts')
    .insert({
      vendor_id: data.vendor_id,
      contact_type: data.contact_type,
      name: data.name.trim(),
      title: data.title?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create contact error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'created',
    entity_type: 'vendor_contact',
    entity_id: contact.id,
    entity_name: contact.name,
    details: { vendor_id: data.vendor_id, contact_type: contact.contact_type },
  });

  revalidatePath(`/vendors/${data.vendor_id}`);

  return {
    success: true,
    data: mapContactFromDatabase(contact),
  };
}

// ============================================================================
// Update Contact
// ============================================================================

export async function updateContact(
  contactId: string,
  formData: UpdateContactFormData
): Promise<ActionResult<VendorContact>> {
  // Validate input
  const result = updateContactSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createContactError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.')
      ),
    };
  }

  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContactError('UNAUTHORIZED', 'You must be logged in to update a contact'),
    };
  }

  // Get existing contact and verify ownership through vendor
  const { data: existingContact, error: fetchError } = await supabase
    .from('vendor_contacts')
    .select('*, vendors!inner(organization_id)')
    .eq('id', contactId)
    .single();

  if (fetchError || !existingContact) {
    return {
      success: false,
      error: createContactError('NOT_FOUND', 'Contact not found'),
    };
  }

  // Verify organization ownership
  if ((existingContact.vendors as { organization_id: string }).organization_id !== organizationId) {
    return {
      success: false,
      error: createContactError('UNAUTHORIZED', 'You do not have permission to update this contact'),
    };
  }

  const data = result.data;

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (data.contact_type !== undefined) updateData.contact_type = data.contact_type;
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.title !== undefined) updateData.title = data.title?.trim() || null;
  if (data.email !== undefined) updateData.email = data.email?.trim() || null;
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;

  // Update contact
  const { data: contact, error } = await supabase
    .from('vendor_contacts')
    .update(updateData)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    console.error('Update contact error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'updated',
    entity_type: 'vendor_contact',
    entity_id: contact.id,
    entity_name: contact.name,
    details: { updated_fields: Object.keys(updateData) },
  });

  revalidatePath(`/vendors/${contact.vendor_id}`);

  return {
    success: true,
    data: mapContactFromDatabase(contact),
  };
}

// ============================================================================
// Delete Contact
// ============================================================================

export async function deleteContact(contactId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContactError('UNAUTHORIZED', 'You must be logged in to delete a contact'),
    };
  }

  // Get existing contact and verify ownership through vendor
  const { data: existingContact, error: fetchError } = await supabase
    .from('vendor_contacts')
    .select('*, vendors!inner(organization_id)')
    .eq('id', contactId)
    .single();

  if (fetchError || !existingContact) {
    return {
      success: false,
      error: createContactError('NOT_FOUND', 'Contact not found'),
    };
  }

  // Verify organization ownership
  if ((existingContact.vendors as { organization_id: string }).organization_id !== organizationId) {
    return {
      success: false,
      error: createContactError('UNAUTHORIZED', 'You do not have permission to delete this contact'),
    };
  }

  // Delete contact
  const { error } = await supabase
    .from('vendor_contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    console.error('Delete contact error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'deleted',
    entity_type: 'vendor_contact',
    entity_id: contactId,
    entity_name: existingContact.name,
  });

  revalidatePath(`/vendors/${existingContact.vendor_id}`);

  return { success: true };
}

// ============================================================================
// Get Contacts for Vendor
// ============================================================================

export async function getVendorContacts(vendorId: string): Promise<VendorContact[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return [];
  }

  // Verify vendor ownership
  const isOwner = await verifyVendorOwnership(vendorId, organizationId);
  if (!isOwner) {
    return [];
  }

  const { data, error } = await supabase
    .from('vendor_contacts')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get contacts error:', error);
    return [];
  }

  return (data || []).map(mapContactFromDatabase);
}
