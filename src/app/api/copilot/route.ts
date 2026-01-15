/**
 * AI Compliance Copilot API Endpoint
 *
 * POST /api/copilot - Ask a compliance question
 * Uses Claude Sonnet with tool use to query data and provide insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askCopilot, getSuggestedQuestions, type CopilotMessage } from '@/lib/ai/copilot/engine';

// Allow longer execution for complex queries
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Note: startTime can be used for performance logging if needed
  // const startTime = Date.now();

  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Copilot API] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: { code: 'CONFIG_ERROR', message: 'AI service not configured' } },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { question, history = [] } = body as {
      question: string;
      history?: CopilotMessage[];
    };

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Question is required' } },
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Question is too long (max 2000 characters)' } },
        { status: 400 }
      );
    }

    // Limit history to last 10 messages to control context size
    const recentHistory = history.slice(-10);

    console.log('[Copilot API] Processing question:', question.substring(0, 100));

    // Get response from copilot
    const response = await askCopilot(question, recentHistory);

    console.log('[Copilot API] Response generated in', response.processingTimeMs, 'ms');
    console.log('[Copilot API] Tools used:', response.toolsUsed.join(', ') || 'none');

    return NextResponse.json({
      success: true,
      data: {
        message: response.message,
        toolsUsed: response.toolsUsed,
        processingTimeMs: response.processingTimeMs,
      },
    });
  } catch (error) {
    console.error('[Copilot API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: {
          code: 'COPILOT_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/copilot - Get suggested questions
 */
export async function GET() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const suggestions = getSuggestedQuestions();

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    console.error('[Copilot API] Error getting suggestions:', error);

    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to get suggestions' } },
      { status: 500 }
    );
  }
}
