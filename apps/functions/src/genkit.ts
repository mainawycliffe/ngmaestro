import { vertexAI } from '@genkit-ai/vertexai';
import { genkit } from 'genkit';

export const ai = genkit({
  plugins: [vertexAI({ location: 'global' })],
  model: vertexAI.model('gemini-3-flash-preview'),
});
