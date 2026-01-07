'use server';

import { revalidatePath } from 'next/cache';
import {
  createProgramme,
  updateProgramme,
  deleteProgramme,
  createTest,
  updateTest,
  deleteTest,
  createFinding,
  updateFinding,
  deleteFinding,
  createTLPT,
  updateTLPT,
  deleteTLPT,
  linkTestingDocument,
  unlinkTestingDocument,
} from './queries';
import {
  createProgrammeSchema,
  updateProgrammeSchema,
  createTestSchema,
  updateTestSchema,
  createFindingSchema,
  updateFindingSchema,
  createTLPTSchema,
  updateTLPTSchema,
  createTestingDocumentSchema,
} from './validation';
import type {
  TestingProgramme,
  ResilienceTest,
  TestFinding,
  TLPTEngagement,
  TestingDocument,
  CreateProgrammeInput,
  UpdateProgrammeInput,
  CreateTestInput,
  UpdateTestInput,
  CreateFindingInput,
  UpdateFindingInput,
  CreateTLPTInput,
  UpdateTLPTInput,
  TestingDocumentType,
} from './types';

// ============================================================================
// Programme Actions
// ============================================================================

export async function createProgrammeAction(
  data: CreateProgrammeInput
): Promise<{ success: true; programme: TestingProgramme } | { success: false; error: string }> {
  try {
    const validationResult = createProgrammeSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: programme, error } = await createProgramme(validationResult.data);
    if (error || !programme) {
      return { success: false, error: error || 'Failed to create programme' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/programmes');
    return { success: true, programme };
  } catch (error) {
    console.error('Create programme action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateProgrammeAction(
  id: string,
  data: UpdateProgrammeInput
): Promise<{ success: true; programme: TestingProgramme } | { success: false; error: string }> {
  try {
    const validationResult = updateProgrammeSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: programme, error } = await updateProgramme(id, validationResult.data);
    if (error || !programme) {
      return { success: false, error: error || 'Failed to update programme' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/programmes');
    revalidatePath(`/testing/programmes/${id}`);
    return { success: true, programme };
  } catch (error) {
    console.error('Update programme action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteProgrammeAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { success, error } = await deleteProgramme(id);
    if (!success) {
      return { success: false, error: error || 'Failed to delete programme' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/programmes');
    return { success: true };
  } catch (error) {
    console.error('Delete programme action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Test Actions
// ============================================================================

export async function createTestAction(
  data: CreateTestInput
): Promise<{ success: true; test: ResilienceTest } | { success: false; error: string }> {
  try {
    const validationResult = createTestSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: test, error } = await createTest(validationResult.data);
    if (error || !test) {
      return { success: false, error: error || 'Failed to create test' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/tests');
    return { success: true, test };
  } catch (error) {
    console.error('Create test action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateTestAction(
  id: string,
  data: UpdateTestInput
): Promise<{ success: true; test: ResilienceTest } | { success: false; error: string }> {
  try {
    const validationResult = updateTestSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: test, error } = await updateTest(id, validationResult.data);
    if (error || !test) {
      return { success: false, error: error || 'Failed to update test' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/tests');
    revalidatePath(`/testing/tests/${id}`);
    return { success: true, test };
  } catch (error) {
    console.error('Update test action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteTestAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { success, error } = await deleteTest(id);
    if (!success) {
      return { success: false, error: error || 'Failed to delete test' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/tests');
    return { success: true };
  } catch (error) {
    console.error('Delete test action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Finding Actions
// ============================================================================

export async function createFindingAction(
  data: CreateFindingInput
): Promise<{ success: true; finding: TestFinding } | { success: false; error: string }> {
  try {
    const validationResult = createFindingSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: finding, error } = await createFinding(validationResult.data);
    if (error || !finding) {
      return { success: false, error: error || 'Failed to create finding' };
    }

    revalidatePath('/testing');
    revalidatePath(`/testing/tests/${data.test_id}`);
    return { success: true, finding };
  } catch (error) {
    console.error('Create finding action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateFindingAction(
  id: string,
  data: UpdateFindingInput
): Promise<{ success: true; finding: TestFinding } | { success: false; error: string }> {
  try {
    const validationResult = updateFindingSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: finding, error } = await updateFinding(id, validationResult.data);
    if (error || !finding) {
      return { success: false, error: error || 'Failed to update finding' };
    }

    revalidatePath('/testing');
    revalidatePath(`/testing/tests/${finding.test_id}`);
    return { success: true, finding };
  } catch (error) {
    console.error('Update finding action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteFindingAction(
  id: string,
  testId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { success, error } = await deleteFinding(id);
    if (!success) {
      return { success: false, error: error || 'Failed to delete finding' };
    }

    revalidatePath('/testing');
    revalidatePath(`/testing/tests/${testId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete finding action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// TLPT Actions
// ============================================================================

export async function createTLPTAction(
  data: CreateTLPTInput
): Promise<{ success: true; tlpt: TLPTEngagement } | { success: false; error: string }> {
  try {
    const validationResult = createTLPTSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: tlpt, error } = await createTLPT(validationResult.data);
    if (error || !tlpt) {
      return { success: false, error: error || 'Failed to create TLPT engagement' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/tlpt');
    return { success: true, tlpt };
  } catch (error) {
    console.error('Create TLPT action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updateTLPTAction(
  id: string,
  data: UpdateTLPTInput
): Promise<{ success: true; tlpt: TLPTEngagement } | { success: false; error: string }> {
  try {
    const validationResult = updateTLPTSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: tlpt, error } = await updateTLPT(id, validationResult.data);
    if (error || !tlpt) {
      return { success: false, error: error || 'Failed to update TLPT engagement' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/tlpt');
    revalidatePath(`/testing/tlpt/${id}`);
    return { success: true, tlpt };
  } catch (error) {
    console.error('Update TLPT action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteTLPTAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { success, error } = await deleteTLPT(id);
    if (!success) {
      return { success: false, error: error || 'Failed to delete TLPT engagement' };
    }

    revalidatePath('/testing');
    revalidatePath('/testing/tlpt');
    return { success: true };
  } catch (error) {
    console.error('Delete TLPT action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Document Actions
// ============================================================================

export async function linkDocumentAction(
  documentId: string,
  entityId: string,
  entityType: 'test' | 'tlpt' | 'programme',
  documentType: TestingDocumentType,
  description?: string
): Promise<{ success: true; document: TestingDocument } | { success: false; error: string }> {
  try {
    const validationResult = createTestingDocumentSchema.safeParse({
      document_id: documentId,
      document_type: documentType,
      description,
      [entityType === 'test' ? 'test_id' : entityType === 'tlpt' ? 'tlpt_id' : 'programme_id']: entityId,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { data: document, error } = await linkTestingDocument(
      documentId,
      entityId,
      entityType,
      documentType,
      description
    );

    if (error || !document) {
      return { success: false, error: error || 'Failed to link document' };
    }

    // Revalidate appropriate paths
    if (entityType === 'test') {
      revalidatePath(`/testing/tests/${entityId}`);
    } else if (entityType === 'tlpt') {
      revalidatePath(`/testing/tlpt/${entityId}`);
    } else {
      revalidatePath(`/testing/programmes/${entityId}`);
    }

    return { success: true, document };
  } catch (error) {
    console.error('Link document action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function unlinkDocumentAction(
  id: string,
  entityId: string,
  entityType: 'test' | 'tlpt' | 'programme'
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { success, error } = await unlinkTestingDocument(id);
    if (!success) {
      return { success: false, error: error || 'Failed to unlink document' };
    }

    // Revalidate appropriate paths
    if (entityType === 'test') {
      revalidatePath(`/testing/tests/${entityId}`);
    } else if (entityType === 'tlpt') {
      revalidatePath(`/testing/tlpt/${entityId}`);
    } else {
      revalidatePath(`/testing/programmes/${entityId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Unlink document action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
