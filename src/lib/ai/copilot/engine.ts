/**
 * AI Compliance Copilot Engine
 *
 * Uses Claude with tool use to answer compliance questions by querying
 * the database and interpreting results in context.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  getVendorSummary,
  getDocumentSummary,
  getRoiSummary,
  getIncidentSummary,
  getConcentrationRisk,
  getComplianceGaps,
  searchVendors,
  getVendorDetails,
} from './queries';

// ============================================================================
// Constants
// ============================================================================

const COPILOT_MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are a DORA Compliance Copilot, an AI assistant helping compliance officers at EU financial institutions manage their Digital Operational Resilience Act (DORA) compliance.

Your role is to:
1. Answer questions about the organization's compliance status
2. Identify risks and gaps in their vendor management
3. Help them prepare for regulatory deadlines
4. Provide actionable recommendations

Key DORA deadlines:
- January 17, 2026: DORA became effective
- April 30, 2026: First Register of Information (RoI) submission to national authorities
- July 2025: ESAs classify Critical ICT Third-Party Providers (CTPPs)

When answering questions:
- Use the available tools to fetch real data before answering
- Be specific with numbers and names when available
- Highlight urgent issues first (expired certs, overdue reports, missing data)
- Provide clear, actionable next steps
- If data is missing, explain what information would be needed

Format guidelines:
- Use bullet points for lists
- Bold important numbers or warnings using **text**
- Keep responses concise but complete
- Include specific vendor/document names when relevant`;

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Anthropic.Tool[] = [
  {
    name: 'getVendorOverview',
    description: 'Get an overview of all vendors including risk levels, tiers, and compliance status. Use this to answer questions about vendor counts, risk distribution, or vendors missing certifications.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getDocumentOverview',
    description: 'Get an overview of all compliance documents including types, expiration status, and documents expiring soon. Use this to answer questions about certifications, expiring documents, or document coverage.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getRoiStatus',
    description: 'Get the Register of Information (RoI) completion status for DORA compliance. Use this to answer questions about RoI readiness, missing templates, or deadline status.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getIncidentOverview',
    description: 'Get an overview of ICT incidents including active incidents, overdue reports, and recent activity. Use this to answer questions about incident management or reporting status.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getConcentrationRiskAnalysis',
    description: 'Analyze concentration risk across vendors including single points of failure and geographic distribution. Use this to answer questions about vendor dependencies or concentration risk.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getComplianceGapsAnalysis',
    description: 'Identify compliance gaps including vendors without contracts, missing risk assessments, or DORA clause coverage. Use this to answer questions about compliance gaps or missing requirements.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'searchVendorsByName',
    description: 'Search for vendors by name. Use this when the user asks about a specific vendor.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The vendor name or partial name to search for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getVendorDetailsById',
    description: 'Get detailed information about a specific vendor including their documents, contracts, and services. Use this after searching for a vendor to get full details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        vendorId: {
          type: 'string',
          description: 'The UUID of the vendor',
        },
      },
      required: ['vendorId'],
    },
  },
];

// ============================================================================
// Tool Executor
// ============================================================================

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'getVendorOverview': {
      const summary = await getVendorSummary();
      return JSON.stringify(summary);
    }
    case 'getDocumentOverview': {
      const summary = await getDocumentSummary();
      return JSON.stringify(summary);
    }
    case 'getRoiStatus': {
      const summary = await getRoiSummary();
      return JSON.stringify(summary);
    }
    case 'getIncidentOverview': {
      const summary = await getIncidentSummary();
      return JSON.stringify(summary);
    }
    case 'getConcentrationRiskAnalysis': {
      const risk = await getConcentrationRisk();
      return JSON.stringify(risk);
    }
    case 'getComplianceGapsAnalysis': {
      const gaps = await getComplianceGaps();
      return JSON.stringify(gaps);
    }
    case 'searchVendorsByName': {
      const vendors = await searchVendors(input.query as string);
      return JSON.stringify(vendors);
    }
    case 'getVendorDetailsById': {
      const details = await getVendorDetails(input.vendorId as string);
      return JSON.stringify(details);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ============================================================================
// Types
// ============================================================================

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotResponse {
  message: string;
  toolsUsed: string[];
  processingTimeMs: number;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Process a user question and return an AI-generated response
 */
export async function askCopilot(
  question: string,
  conversationHistory: CopilotMessage[] = []
): Promise<CopilotResponse> {
  const startTime = Date.now();
  const toolsUsed: string[] = [];

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: question },
    ];

    // Agentic loop - keep calling until no more tool use
    let response = await client.messages.create({
      model: COPILOT_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    // Process tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        if (!toolsUsed.includes(toolUse.name)) {
          toolsUsed.push(toolUse.name);
        }

        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content,
      });
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Get next response
      response = await client.messages.create({
        model: COPILOT_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
        tools,
      });
    }

    // Extract final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return {
      message: textBlock?.text || 'I was unable to generate a response.',
      toolsUsed,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Copilot error:', error);
    throw new Error(
      error instanceof Error
        ? `Copilot failed: ${error.message}`
        : 'Copilot failed with unknown error'
    );
  }
}

/**
 * Get suggested questions based on current data
 */
export function getSuggestedQuestions(): string[] {
  return [
    "What's my DORA compliance status?",
    "Which vendors don't have valid SOC 2 reports?",
    "What's my biggest concentration risk?",
    "Am I ready for the April 2026 deadline?",
    "Which documents are expiring soon?",
    "How many critical vendors do I have?",
    "What compliance gaps should I address first?",
    "Show me overdue incident reports",
  ];
}
