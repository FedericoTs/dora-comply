'use server';

import { revalidatePath } from 'next/cache';
import {
  createIncident,
  updateIncident,
  deleteIncident,
  createIncidentReport,
  submitIncidentReport,
  addIncidentEvent,
} from './queries';
import {
  createIncidentSchema,
  updateIncidentSchema,
  createReportSchema,
  createEventSchema,
} from './validation';
import type {
  Incident,
  IncidentReport,
  IncidentEvent,
  CreateIncidentInput,
  UpdateIncidentInput,
  CreateReportInput,
  CreateEventInput,
} from './types';

// ============================================================================
// Server Actions
// ============================================================================

export async function createIncidentAction(
  data: CreateIncidentInput
): Promise<{ success: true; incident: Incident } | { success: false; error: string }> {
  try {
    // Validate input
    const validationResult = createIncidentSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: incident, error } = await createIncident(validationResult.data);
    if (error || !incident) {
      return { success: false, error: error || 'Failed to create incident' };
    }

    revalidatePath('/incidents');
    return { success: true, incident };
  } catch (error) {
    console.error('Create incident action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateIncidentAction(
  id: string,
  data: UpdateIncidentInput
): Promise<{ success: true; incident: Incident } | { success: false; error: string }> {
  try {
    // Validate input
    const validationResult = updateIncidentSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: incident, error } = await updateIncident(id, validationResult.data);
    if (error || !incident) {
      return { success: false, error: error || 'Failed to update incident' };
    }

    revalidatePath('/incidents');
    revalidatePath(`/incidents/${id}`);
    return { success: true, incident };
  } catch (error) {
    console.error('Update incident action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteIncidentAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { success, error } = await deleteIncident(id);
    if (!success) {
      return { success: false, error: error || 'Failed to delete incident' };
    }

    revalidatePath('/incidents');
    return { success: true };
  } catch (error) {
    console.error('Delete incident action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function createReportAction(
  incidentId: string,
  data: CreateReportInput
): Promise<{ success: true; report: IncidentReport } | { success: false; error: string }> {
  try {
    // Validate input
    const validationResult = createReportSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: report, error } = await createIncidentReport(incidentId, validationResult.data);
    if (error || !report) {
      return { success: false, error: error || 'Failed to create report' };
    }

    revalidatePath(`/incidents/${incidentId}`);
    return { success: true, report };
  } catch (error) {
    console.error('Create report action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function submitReportAction(
  reportId: string
): Promise<{ success: true; report: IncidentReport } | { success: false; error: string }> {
  try {
    const { data: report, error } = await submitIncidentReport(reportId);
    if (error || !report) {
      return { success: false, error: error || 'Failed to submit report' };
    }

    revalidatePath('/incidents');
    return { success: true, report };
  } catch (error) {
    console.error('Submit report action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function addEventAction(
  incidentId: string,
  data: CreateEventInput
): Promise<{ success: true; event: IncidentEvent } | { success: false; error: string }> {
  try {
    // Validate input
    const validationResult = createEventSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: event, error } = await addIncidentEvent(incidentId, validationResult.data);
    if (error || !event) {
      return { success: false, error: error || 'Failed to add event' };
    }

    revalidatePath(`/incidents/${incidentId}`);
    return { success: true, event };
  } catch (error) {
    console.error('Add event action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
