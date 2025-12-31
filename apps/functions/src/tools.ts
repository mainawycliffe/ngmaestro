import { z } from 'genkit';
import { ai } from './genkit';
import {
  analogjsDocsRetriever,
  angularDocsRetriever,
  materialDocsRetriever,
  ngrxDocsRetriever,
} from './retrievers';

export const searchAngularDocs = ai.defineTool(
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
          version: z.string().optional(),
          title: z.string().optional(),
        }),
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
        limit: 20,
      },
    });
    return {
      results: docs.map((d) => ({
        content: d.text,
        url: d.metadata?.url,
      })),
    };
  },
);

export const searchMaterialDocs = ai.defineTool(
  {
    name: 'searchMaterialDocs',
    description:
      'Search the Angular Material documentation. Use this to find information about Material components, theming, CDK, or accessibility.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      version: z.string().describe('The Material version (e.g., "v18", "v19")'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          content: z.string(),
          url: z.string().optional(),
        }),
      ),
    }),
  },
  async ({ query, version }) => {
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;
    const docs = await ai.retrieve({
      retriever: materialDocsRetriever,
      query,
      options: {
        where: {
          version: formattedVersion,
        },
        limit: 20,
      },
    });
    return {
      results: docs.map((d) => ({
        content: d.text,
        url: d.metadata?.url,
      })),
    };
  },
);

export const searchNgrxDocs = ai.defineTool(
  {
    name: 'searchNgrxDocs',
    description:
      'Search the NgRX documentation. Use this to find information about state management, Store, Effects, Entity, Router Store, or Signal Store - everything NgRX Related.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      version: z.string().describe('The NgRX version (e.g., "v18", "v19")'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          content: z.string(),
          url: z.string().optional(),
        }),
      ),
    }),
  },
  async ({ query, version }) => {
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;
    const docs = await ai.retrieve({
      retriever: ngrxDocsRetriever,
      query,
      options: {
        where: {
          version: formattedVersion,
        },
        limit: 20,
      },
    });
    return {
      results: docs.map((d) => ({
        content: d.text,
        url: d.metadata?.url,
      })),
    };
  },
);

export const searchAnalogJSDocs = ai.defineTool(
  {
    name: 'searchAnalogJSDocs',
    description:
      'Search the AnalogJS documentation. Use this to find information about the AnalogJS meta-framework, file-based routing, server-side rendering (SSR), static site generation (SSG), API routes, content routes, or Vite integration.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      version: z
        .string()
        .optional()
        .describe('The AnalogJS version (e.g., "latest", "v1.x")'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          content: z.string(),
          url: z.string().optional(),
        }),
      ),
    }),
  },
  async ({ query, version = 'latest' }) => {
    const docs = await ai.retrieve({
      retriever: analogjsDocsRetriever,
      query,
      options: {
        where: {
          version: version,
        },
        limit: 20,
      },
    });
    return {
      results: docs.map((d) => ({
        content: d.text,
        url: d.metadata?.url,
      })),
    };
  },
);
