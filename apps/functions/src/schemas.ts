import { z } from 'genkit';

export const oracleInputSchema = z.object({
  query: z
    .string()
    .describe('The user query, error message, or code to review'),
  angularVersion: z.string().describe('Angular version (18, 19, 20, or 21)'),
  mode: z.enum(['question', 'error', 'review']).describe('Interaction mode'),
  image: z.string().optional().describe('Base64 encoded image or data URL'),
  learningMode: z
    .boolean()
    .optional()
    .describe('If true, provide a step-by-step learning guide'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'tool']),
        content: z.union([z.string(), z.array(z.any())]),
      }),
    )
    .optional()
    .describe('Conversation history'),
});

export const oracleResponseSchema = z.object({
  blocks: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('text'), content: z.string() }),
      z.object({
        type: z.literal('code'),
        language: z.string(),
        content: z.string(),
        filename: z.string().optional(),
      }),
    ]),
  ),
});

export const oracleOutputSchema = z.object({
  response: oracleResponseSchema,
});
