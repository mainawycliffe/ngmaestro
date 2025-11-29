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
});

// Helper to build mode-specific prompts
function buildPrompt(
  mode: 'question' | 'error' | 'review',
  query: string,
  angularVersion: string,
  context?: string
) {
  const baseSystem = `You are ng-lens, an AI-powered Angular documentation assistant specialized in Angular ${angularVersion}.

You provide accurate, concise answers strictly based on the official Angular documentation provided in the context below.
Do not use outside knowledge to answer the question if it is not supported by the context.`;

  const modeInstructions = {
    question: `

When answering questions:
- Answer directly and concisely
- Use ONLY information from the provided context
- Focus on Angular ${angularVersion} best practices
- Include code examples from the context when relevant
- If the context doesn't contain the answer, state that the information is not available in the provided documentation.`,

    error: `

When analyzing errors:
- Use the context to identify the root cause
- Explain what the error means in simple terms
- Provide step-by-step solutions based on the context
- Include relevant code fixes from the documentation
- If the context lacks information, state that the information is not available in the provided documentation.`,

    review: `

When reviewing code:
- Compare against Angular ${angularVersion} best practices from the context
- Check for: standalone components, signals, input()/output(), OnPush
- Identify accessibility and performance issues
- Provide specific, actionable feedback
- Reference relevant documentation sections from the context
- If the context lacks information, state that the information is not available in the provided documentation.`,
  };

  const contextSection = context
    ? `\n\nRELEVANT DOCUMENTATION:\n${context}\n`
    : '\n\nNOTE: No specific documentation context was found. State that you cannot answer based on the provided documentation.\n';

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
    outputSchema: z.object({
      response: z.string(),
      sources: z.array(z.string()).optional(),
    }),
  },
  async (input) => {
    const { query, angularVersion, mode } = input;
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

    const { text } = await ai.generate({
      system,
      prompt,
      config: {
        temperature: 0.3,
      },
    });

    return {
      response: text,
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
