/**
 * Webhook Server Actions
 *
 * Server-side functions for webhook management and dispatch.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import crypto from 'crypto';
import type {
  WebhookConfig,
  WebhookEventType,
  WebhookPayload,
  WebhookDelivery,
} from './types';

// ============================================================================
// Helper Functions
// ============================================================================

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// ============================================================================
// Webhook Configuration CRUD
// ============================================================================

export async function getWebhooks(): Promise<WebhookConfig[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Webhooks] Error fetching webhooks:', error);
    return [];
  }

  return data || [];
}

export async function getWebhook(id: string): Promise<WebhookConfig | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('[Webhooks] Error fetching webhook:', error);
    return null;
  }

  return data;
}

export async function createWebhook(
  name: string,
  url: string,
  events: WebhookEventType[]
): Promise<{ success: boolean; webhook?: WebhookConfig; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return { success: false, error: 'Invalid webhook URL' };
  }

  // Generate secret
  const secret = generateWebhookSecret();

  const { data, error } = await supabase
    .from('webhook_configs')
    .insert({
      organization_id: organizationId,
      name,
      url,
      secret,
      events,
      is_active: true,
      retry_count: 3,
      timeout_ms: 10000,
    })
    .select()
    .single();

  if (error) {
    console.error('[Webhooks] Error creating webhook:', error);
    return { success: false, error: 'Failed to create webhook' };
  }

  return { success: true, webhook: data };
}

export async function updateWebhook(
  id: string,
  updates: Partial<Pick<WebhookConfig, 'name' | 'url' | 'events' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate URL if provided
  if (updates.url) {
    try {
      new URL(updates.url);
    } catch {
      return { success: false, error: 'Invalid webhook URL' };
    }
  }

  const { error } = await supabase
    .from('webhook_configs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[Webhooks] Error updating webhook:', error);
    return { success: false, error: 'Failed to update webhook' };
  }

  return { success: true };
}

export async function deleteWebhook(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('webhook_configs')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[Webhooks] Error deleting webhook:', error);
    return { success: false, error: 'Failed to delete webhook' };
  }

  return { success: true };
}

export async function regenerateSecret(id: string): Promise<{ success: boolean; secret?: string; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  const newSecret = generateWebhookSecret();

  const { error } = await supabase
    .from('webhook_configs')
    .update({ secret: newSecret, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[Webhooks] Error regenerating secret:', error);
    return { success: false, error: 'Failed to regenerate secret' };
  }

  return { success: true, secret: newSecret };
}

// ============================================================================
// Webhook Dispatch
// ============================================================================

export async function dispatchWebhook(
  organizationId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  // Get active webhooks for this event
  const { data: webhooks, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (error || !webhooks?.length) {
    return;
  }

  // Build payload
  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    event: eventType,
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    data,
  };

  const payloadString = JSON.stringify(payload);

  // Dispatch to each webhook
  for (const webhook of webhooks) {
    const signature = signPayload(payloadString, webhook.secret);

    // Log delivery attempt
    const { data: delivery } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        retry_count: 0,
      })
      .select()
      .single();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_ms);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-ID': payload.id,
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update delivery status
      if (delivery) {
        await supabase
          .from('webhook_deliveries')
          .update({
            response_status: response.status,
            delivered_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);
      }
    } catch (error) {
      console.error(`[Webhooks] Delivery failed to ${webhook.url}:`, error);

      // Mark as failed
      if (delivery) {
        await supabase
          .from('webhook_deliveries')
          .update({
            failed_at: new Date().toISOString(),
            response_body: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', delivery.id);
      }

      // TODO: Implement retry logic with exponential backoff
    }
  }
}

// ============================================================================
// Webhook Delivery History
// ============================================================================

export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  // Verify webhook belongs to organization
  const { data: webhook } = await supabase
    .from('webhook_configs')
    .select('id')
    .eq('id', webhookId)
    .eq('organization_id', organizationId)
    .single();

  if (!webhook) return [];

  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Webhooks] Error fetching deliveries:', error);
    return [];
  }

  return data || [];
}

export async function retryDelivery(deliveryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get delivery and verify access
  const { data: delivery } = await supabase
    .from('webhook_deliveries')
    .select('*, webhook_configs!inner(organization_id, url, secret, timeout_ms)')
    .eq('id', deliveryId)
    .single();

  if (!delivery || delivery.webhook_configs.organization_id !== organizationId) {
    return { success: false, error: 'Delivery not found' };
  }

  const webhook = delivery.webhook_configs;
  const payloadString = JSON.stringify(delivery.payload);
  const signature = signPayload(payloadString, webhook.secret);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_ms);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event_type,
        'X-Webhook-ID': delivery.payload.id,
        'X-Webhook-Retry': 'true',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Update delivery
    await supabase
      .from('webhook_deliveries')
      .update({
        response_status: response.status,
        delivered_at: new Date().toISOString(),
        failed_at: null,
        retry_count: delivery.retry_count + 1,
      })
      .eq('id', deliveryId);

    return { success: true };
  } catch (error) {
    await supabase
      .from('webhook_deliveries')
      .update({
        failed_at: new Date().toISOString(),
        response_body: error instanceof Error ? error.message : 'Retry failed',
        retry_count: delivery.retry_count + 1,
      })
      .eq('id', deliveryId);

    return { success: false, error: 'Delivery retry failed' };
  }
}

// ============================================================================
// Test Webhook
// ============================================================================

export async function testWebhook(id: string): Promise<{ success: boolean; status?: number; error?: string }> {
  const webhook = await getWebhook(id);

  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  const testPayload: WebhookPayload = {
    id: crypto.randomUUID(),
    event: 'vendor.created',
    timestamp: new Date().toISOString(),
    organization_id: webhook.organization_id,
    data: {
      test: true,
      message: 'This is a test webhook delivery from DORA Comply',
    },
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = signPayload(payloadString, webhook.secret);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_ms);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test',
        'X-Webhook-ID': testPayload.id,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
