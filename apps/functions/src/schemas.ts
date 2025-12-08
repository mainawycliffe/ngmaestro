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

export const confidenceMetadataSchema = z.object({
  step0_intent_analysis: z
    .number()
    .min(1)
    .max(10)
    .describe('Confidence in understanding user intent (1-10)'),
  step1_search_planning: z
    .number()
    .min(1)
    .max(10)
    .describe('Confidence in search strategy (1-10)'),
  step2_documentation_search: z
    .number()
    .min(1)
    .max(10)
    .describe('Confidence in finding complete documentation (1-10)'),
  step25_pre_synthesis: z
    .number()
    .min(1)
    .max(10)
    .describe('Confidence before synthesis (1-10)'),
  step3_synthesis: z
    .number()
    .min(1)
    .max(10)
    .describe('Confidence in answer accuracy and completeness (1-10)'),
  step4_final_verification: z
    .number()
    .min(1)
    .max(10)
    .describe('Overall confidence in final response (1-10)'),
  overall_confidence: z
    .number()
    .min(1)
    .max(10)
    .describe('Overall confidence score (1-10)'),
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
});

export const oracleOutputSchema = z.object({
  response: oracleResponseSchema,
});
