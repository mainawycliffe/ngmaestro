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
  blocks: z
    .array(
      z
        .discriminatedUnion('type', [
          z
            .object({
              type: z.literal('text').describe('Plain text block'),
              content: z
                .string()
                .describe('The text content, can include markdown formatting'),
            })
            .describe('Plain text block with explanations or instructions'),
          z
            .object({
              type: z
                .literal('code')
                .describe('Code block with language and optional filename'),
              language: z
                .string()
                .describe('Programming language for syntax highlighting'),
              content: z.string().describe('The code content'),
              filename: z
                .string()
                .optional()
                .describe('Optional filename for the code block'),
            })
            .describe(
              'Code block with language, content, and optional filename for context',
            ),
        ])
        .describe('Structured content blocks that make up the response'),
    )
    .describe('Structured response blocks with type, content, and metadata'),
  confidence: confidenceMetadataSchema.describe(
    'Confidence metrics for different aspects of the response (overall, documentation retrieval, answer quality) and any concerns or limitations',
  ),
  related_topics: z
    .array(z.string())
    .optional()
    .describe(
      '2-4 related Angular concepts/APIs found during docs search that user might explore next',
    ),
  sources: z
    .array(
      z.object({
        title: z.string().describe('Document title or topic'),
        url: z.string().describe('Full URL to the documentation page'),
        source: z
          .enum(['angular', 'material', 'ngrx', 'analogjs'])
          .describe('Documentation source'),
      }),
    )
    .optional()
    .describe(
      'List of documentation sources used to answer the question. Extract from retrieved docs metadata.',
    ),
});

export const oracleOutputSchema = z.object({
  response: oracleResponseSchema,
});
