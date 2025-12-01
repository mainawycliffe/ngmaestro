import { defineFirestoreRetriever } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/google-genai';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCallGenkit } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { genkit, z } from 'genkit';

initializeApp();
const db = getFirestore();

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const angularDocsRetriever = defineFirestoreRetriever(ai, {
  name: 'angularDocsRetriever',
  firestore: db,
  collection: 'angular-docs',
  contentField: 'content',
  vectorField: 'embedding',
  embedder: googleAI.embedder('text-embedding-004'),
  distanceMeasure: 'COSINE',
});

const oracleInputSchema = z.object({
  query: z
    .string()
    .describe('The user query, error message, or code to review'),
  angularVersion: z.string().describe('Angular version (18, 19, 20, or 21)'),
  mode: z.enum(['question', 'error', 'review']).describe('Interaction mode'),
  image: z.string().optional().describe('Base64 encoded image or data URL'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.union([z.string(), z.array(z.any())]),
      })
    )
    .optional()
    .describe('Conversation history'),
});

const oracleResponseSchema = z.object({
  blocks: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('text'), content: z.string() }),
      z.object({
        type: z.literal('code'),
        language: z.string(),
        content: z.string(),
        filename: z.string().optional(),
      }),
    ])
  ),
});

const oracleOutputSchema = z.object({
  response: oracleResponseSchema,
  sources: z.array(z.string()).optional(),
});

// Helper to build mode-specific prompts
function buildPrompt(
  mode: 'question' | 'error' | 'review',
  query: string,
  angularVersion: string,
  context?: string
) {
  const baseSystem = `You are ng-lens, an AI-powered Angular documentation assistant specialized in Angular ${angularVersion}.

Your goal is to guide the user rather than just giving them the answer.
If the user's request is ambiguous or if you are unsure, ASK A CLARIFYING QUESTION.
If the information is not present in the provided context, explicitly state "I don't know" or "I cannot answer this based on the documentation provided".
Do not make up information.

IMPORTANT: You must respond with a JSON object containing a 'blocks' array.
- Use 'text' blocks for explanations.
- Use 'code' blocks for code snippets, specifying the language and optional filename.
`;

  const modeInstructions = {
    question: `

When answering questions:
- Do not just dump the answer. Ask the user questions to help them understand the concept if appropriate.
- If the question is clear and simple, you can answer, but prefer a guiding approach.
- Use ONLY information from the provided context.
- If the context doesn't contain the answer, say "I don't know based on the docs."`,

    error: `

When analyzing errors:
- Do not immediately fix the error. Ask the user about their setup or what they tried first.
- Guide them to the solution using the context.
- If the context lacks information, say "I don't know based on the docs."`,

    review: `

When reviewing code:
- Ask questions about why they implemented it that way.
- Point out potential issues by asking "Have you considered...?"
- Reference relevant documentation sections from the context.
- If the context lacks information, say "I don't know based on the docs."`,
  };

  const contextSection = context
    ? `\n\nRELEVANT DOCUMENTATION:\n${context}\n`
    : '\n\nNOTE: No specific documentation context was found. You must state that you cannot answer based on the provided documentation.\n';

  const userPrompts = {
    question: `${contextSection}\nQUESTION: ${query}`,
    error: `${contextSection}\nERROR TO ANALYZE:\n${query}`,
    review: `${contextSection}\nCODE TO REVIEW:\n\`\`\`typescript\n${query}\n\`\`\``,
  };

  return {
    system: baseSystem + modeInstructions[mode],
    prompt: userPrompts[mode],
  };
}

const theOracleFlow = ai.defineFlow(
  {
    name: 'theOracle',
    inputSchema: oracleInputSchema,
    outputSchema: oracleOutputSchema,
  },
  async (input) => {
    const { query, angularVersion, mode, history, image } = input;
    const formattedVersion = `v${angularVersion}`;

    const relevantDocs = await ai.retrieve({
      retriever: angularDocsRetriever,
      options: {
        where: {
          version: formattedVersion,
        },
      },
      query: query,
    });

    const context = relevantDocs.map((doc) => doc.text).join('\n\n');
    const sources = relevantDocs
      .map((doc) => doc.metadata?.url)
      .filter(Boolean) as string[];

    const { system, prompt } = buildPrompt(
      mode,
      query,
      angularVersion,
      context
    );

    const messages = (history || []).map((m) => ({
      role: m.role,
      content: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));

    const userContent = [{ text: prompt }];
    if (image) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userContent.push({ text: '', media: { url: image } } as any);
    }

    messages.push({
      role: 'user',
      content: userContent,
    });

    const response = await ai.generate({
      system,
      messages,
      output: { schema: oracleResponseSchema },
      config: {
        temperature: 0.3,
      },
    });

    return {
      response: response.output,
      sources,
    };
  }
);

export const theOracle = onCallGenkit(
  {
    secrets: [GEMINI_API_KEY],
  },
  theOracleFlow
);
