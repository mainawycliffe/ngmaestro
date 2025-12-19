import { z } from 'genkit';

export const oracleInputSchema = z.object({
  query: z
    .string()
    .describe('The user query, error message, or code to review'),
  angularVersion: z.string().describe('Angular version (18, 19, 20, or 21)'),
  mode: z.enum(['question', 'error', 'review']).describe('Interaction mode'),
  image: z.string().optional().describe('Base64 encoded image or data URL'),
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

export const confidenceMetadataSchema = z.object({
  overall_confidence: z
    .number()
    .min(1)
    .max(10)
    .describe('Overall confidence score (1-10)'),
  docs_confidence: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Confidence in documentation retrieval/completeness (1-10)'),
  answer_confidence: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Confidence in final answer quality (1-10)'),
  concerns: z
    .array(z.string())
    .optional()
    .describe('Any remaining uncertainties or limitations'),
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
  confidence: confidenceMetadataSchema.describe(
    'Step-by-step confidence scores from reasoning process',
  ),
  related_topics: z
    .array(z.string())
    .optional()
    .describe(
      '2-4 related Angular concepts/APIs found during docs search that user might explore next',
    ),
});

export const oracleOutputSchema = z.object({
  response: oracleResponseSchema,
});
