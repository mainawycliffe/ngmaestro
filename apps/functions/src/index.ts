import { defineFirestoreRetriever } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/google-genai';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCallGenkit } from 'firebase-functions/https';
import { genkit, z } from 'genkit';

initializeApp();
const db = getFirestore();

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

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

You provide accurate, concise answers based on the official Angular documentation provided in the context below.`;

  const modeInstructions = {
    question: `

When answering questions:
- Answer directly and concisely
- Use ONLY information from the provided context
- Focus on Angular ${angularVersion} best practices
- Include code examples from the context when relevant
- If the context doesn't contain the answer, say so clearly`,

    error: `

When analyzing errors:
- Use the context to identify the root cause
- Explain what the error means in simple terms
- Provide step-by-step solutions based on the context
- Include relevant code fixes from the documentation
- If the context lacks information, acknowledge it`,

    review: `

When reviewing code:
- Compare against Angular ${angularVersion} best practices from the context
- Check for: standalone components, signals, input()/output(), OnPush
- Identify accessibility and performance issues
- Provide specific, actionable feedback
- Reference relevant documentation sections from the context`,
  };

  const contextSection = context
    ? `\n\nRELEVANT DOCUMENTATION:\n${context}\n`
    : '\n\nNOTE: No specific documentation context was found. Provide a general answer based on Angular best practices.\n';

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

    const relevantDocs = await ai.retrieve({
      retriever: angularDocsRetriever,
      options: { version: angularVersion },
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

export const theOracle = onCallGenkit(theOracleFlow);
