import { vertexAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

export const ai = genkit({
  plugins: [vertexAI({ location: 'global' })],
  model: vertexAI.model('gemini-3-flash-preview', {
    config: {
      // Strict JSON mode to reduce formatting errors
      temperature: 1.0,
      responseMimeType: 'application/json',
    },
  }),
});
