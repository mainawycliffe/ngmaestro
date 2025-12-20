import { ai } from './genkit';
import { buildPrompt } from './prompts';
import {
  oracleInputSchema,
  oracleOutputSchema,
  oracleResponseSchema,
} from './schemas';
import { searchAngularDocs, searchMaterialDocs, searchNgrxDocs } from './tools';
import { validateResponse, type ToolCall } from './validation';

export const theOracleFlow = ai.defineFlow(
  {
    name: 'theOracle',
    inputSchema: oracleInputSchema,
    outputSchema: oracleOutputSchema,
  },
  async (input) => {
    const { query, angularVersion, mode, history, image } = input;

    const { system, prompt } = buildPrompt(mode, query, angularVersion);

    const messages: Array<{
      role: 'user' | 'model' | 'tool' | 'system';
      content: Array<{ text: string } | { media: { url: string } }>;
    }> = (history || []).map((m) => ({
      role: m.role as 'user' | 'model' | 'tool',
      content: [
        {
          text:
            typeof m.content === 'string'
              ? m.content
              : JSON.stringify(m.content),
        },
      ],
    }));

    const userContent: Array<{ text: string } | { media: { url: string } }> = [
      { text: prompt },
    ];
    if (image) {
      userContent.push({ media: { url: image } });
    }

    messages.push({
      role: 'user',
      content: userContent,
    });

    const response = await ai.generate({
      system,
      messages,
      tools: [searchAngularDocs, searchMaterialDocs, searchNgrxDocs],
      output: { format: 'json', schema: oracleResponseSchema },
      config: { thinkingConfig: { thinkingLevel: 'HIGH' } },
    });

    // Extract tool calls from response for validation
    const toolCalls: ToolCall[] = [];

    // Check if response includes tool request information
    if (response.toolRequests && Array.isArray(response.toolRequests)) {
      toolCalls.push(
        ...response.toolRequests.map((req) => ({
          name: req.toolRequest.name,
          input: (req.toolRequest.input || {}) as Record<string, unknown>,
        })),
      );
    }

    // Validate the response (with type assertion since we know the schema is correct)
    const validation = validateResponse(
      response.output as { blocks: Array<{ type: string; content: string }> },
      angularVersion,
      toolCalls,
    );

    // Log validation results
    if (!validation.isValid) {
      console.error('Response validation failed:', {
        errors: validation.errors,
        warnings: validation.warnings,
        searchMetrics: validation.searchMetrics,
      });
    } else if (validation.warnings.length > 0) {
      console.warn('Response validation warnings:', {
        warnings: validation.warnings,
        searchMetrics: validation.searchMetrics,
      });
    }

    return {
      response: response.output,
    };
  },
);
