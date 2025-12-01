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

const searchAngularDocs = ai.defineTool(
  {
    name: 'searchAngularDocs',
    description:
      'Search the Angular documentation. Use this to find answers to user questions, analyze errors, or review code.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      version: z.string().describe('The Angular version (e.g., "v18", "v19")'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          content: z.string(),
          url: z.string().optional(),
        })
      ),
    }),
  },
  async ({ query, version }) => {
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;
    const docs = await ai.retrieve({
      retriever: angularDocsRetriever,
      query,
      options: {
        where: {
          version: formattedVersion,
        },
        limit: 5,
      },
    });
    return {
      results: docs.map((d) => ({
        content: d.text,
        url: d.metadata?.url,
      })),
    };
  }
);

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
        role: z.enum(['user', 'model', 'tool']),
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
  angularVersion: string
) {
  const baseSystem = `You are ng-lens, an AI-powered Angular documentation assistant specialized in Angular ${angularVersion}.

Your goal is to guide the user rather than just giving them the answer.
If the user's request is ambiguous or if you are unsure, ASK A CLARIFYING QUESTION.

CRITICAL INSTRUCTIONS FOR ACCURACY:
1. You have access to a tool 'searchAngularDocs'. You MUST use it to find information.
2. You must answer ONLY using the information retrieved from the tool.
3. If the information is not present in the retrieved documents, explicitly state "I don't know" or "I cannot answer this based on the documentation provided".
4. DO NOT HALLUCINATE features or APIs. If a user asks about a feature (e.g., "signal forms") and it is not in the retrieved docs, do not invent it.
5. Verify that any code or advice you provide is supported by the retrieved documentation.

IMPORTANT: When you have gathered enough information, you must respond with a JSON object containing a 'blocks' array.
- Use 'text' blocks for explanations.
- Use 'code' blocks for code snippets, specifying the language and optional filename.
`;

  const modeInstructions = {
    question: `

When answering questions:
- Do not just dump the answer. Ask the user questions to help them understand the concept if appropriate.
- If the question is clear and simple, you can answer, but prefer a guiding approach.
- STRICTLY use information from the tool.`,

    error: `

When analyzing errors:
- Do not immediately fix the error. Ask the user about their setup or what they tried first.
- Guide them to the solution using the tool results.`,

    review: `

When reviewing code:
- Ask questions about why they implemented it that way.
- Point out potential issues by asking "Have you considered...?"
- Reference relevant documentation sections from the tool results.`,
  };

  const userPrompts = {
    question: `QUESTION: ${query}`,
    error: `ERROR TO ANALYZE:\n${query}`,
    review: `CODE TO REVIEW:\n\`\`\`typescript\n${query}\n\`\`\``,
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

    const { system, prompt } = buildPrompt(mode, query, angularVersion);

    const messages = (history || []).map((m) => ({
      role: m.role,
      content: [
        {
          text:
            typeof m.content === 'string'
              ? m.content
              : JSON.stringify(m.content),
        },
      ],
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

    let finalResponse;
    const sources = new Set<string>();

    // Agent Loop (Max 5 turns)
    for (let i = 0; i < 5; i++) {
      const response = await ai.generate({
        system,
        messages,
        tools: [searchAngularDocs],
        // We only enforce schema if no tools are called, but Genkit handles this if we pass schema.
        // However, to allow tool calls, we might need to be careful.
        // Gemini usually handles "tool use OR json output" well.
        output: { schema: oracleResponseSchema },
        config: {
          temperature: 0.3,
        },
      });

      const toolRequests = response.toolRequests;

      if (toolRequests && toolRequests.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages.push(response.message as any);

        for (const req of toolRequests) {
          if (req.toolRequest.name === searchAngularDocs.name) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const output = await searchAngularDocs.run(req.toolRequest.input as any);

            // Collect sources
            output.result.results.forEach((r) => {
              if (r.url) sources.add(r.url);
            });

            messages.push({
              role: 'tool',
              content: [
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { toolResponse: { name: req.toolRequest.name, ref: req.toolRequest.ref, output } } as any,
              ],
            });
          }
        }
      } else {
        finalResponse = response.output;
        break;
      }
    }

    if (!finalResponse) {
      // Fallback if loop exhausted or something went wrong
      // We can try to force a response or just return an error block
      finalResponse = {
        blocks: [
          {
            type: 'text',
            content:
              "I'm sorry, I couldn't find the answer after multiple attempts. Please try rephrasing your question.",
          },
        ],
      };
    }

    return {
      response: finalResponse,
      sources: Array.from(sources),
    };
  }
);

export const theOracle = onCallGenkit(
  {
    secrets: [GEMINI_API_KEY],
  },
  theOracleFlow
);
