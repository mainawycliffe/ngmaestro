import { ai } from './genkit';
import { buildPrompt } from './prompts';
import {
  oracleInputSchema,
  oracleOutputSchema,
  oracleResponseSchema,
} from './schemas';
import { searchAngularDocs, searchMaterialDocs, searchNgrxDocs } from './tools';

export const theOracleFlow = ai.defineFlow(
  {
    name: 'theOracle',
    inputSchema: oracleInputSchema,
    outputSchema: oracleOutputSchema,
  },
  async (input) => {
    const { query, angularVersion, mode, history, image, learningMode } = input;

    const { system, prompt } = buildPrompt(
      mode,
      query,
      angularVersion,
      learningMode,
    );

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
      output: { schema: oracleResponseSchema },
      config: {
        temperature: 0.5,
      },
    });

    return {
      response: response.output,
    };
  },
);
