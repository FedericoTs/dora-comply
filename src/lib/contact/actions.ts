'use server';

import { createClient } from '@/lib/supabase/server';

export interface ContactRequestInput {
  name: string;
  email: string;
  company: string;
  interest?: string;
  message?: string;
  source?: string;
}

export interface ContactRequestResult {
  success: boolean;
  error?: string;
}

export async function submitContactRequest(
  input: ContactRequestInput
): Promise<ContactRequestResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('contact_requests').insert({
    name: input.name,
    email: input.email,
    company: input.company,
    interest: input.interest || null,
    message: input.message || null,
    source: input.source || null,
  });

  if (error) {
    console.error('Failed to save contact request:', error);
    return {
      success: false,
      error: 'Failed to submit request. Please try again.',
    };
  }

  return { success: true };
}
