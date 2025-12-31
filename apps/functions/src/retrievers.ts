import { defineFirestoreRetriever } from '@genkit-ai/firebase';
import { vertexAI } from '@genkit-ai/google-genai';
import { db } from './config';
import { ai } from './genkit';

export const angularDocsRetriever = defineFirestoreRetriever(ai, {
  name: 'angularDocsRetriever',
  firestore: db,
  collection: 'angular-docs',
  contentField: 'content',
  vectorField: 'embedding',
  embedder: vertexAI.embedder('text-embedding-004'),
  distanceMeasure: 'COSINE',
});

export const materialDocsRetriever = defineFirestoreRetriever(ai, {
  name: 'materialDocsRetriever',
  firestore: db,
  collection: 'material-docs',
  contentField: 'content',
  vectorField: 'embedding',
  embedder: vertexAI.embedder('text-embedding-004'),
  distanceMeasure: 'COSINE',
});

export const ngrxDocsRetriever = defineFirestoreRetriever(ai, {
  name: 'ngrxDocsRetriever',
  firestore: db,
  collection: 'ngrx-docs',
  contentField: 'content',
  vectorField: 'embedding',
  embedder: vertexAI.embedder('text-embedding-004'),
  distanceMeasure: 'COSINE',
});

export const analogjsDocsRetriever = defineFirestoreRetriever(ai, {
  name: 'analogjsDocsRetriever',
  firestore: db,
  collection: 'analogjs-docs',
  contentField: 'content',
  vectorField: 'embedding',
  embedder: vertexAI.embedder('text-embedding-004'),
  distanceMeasure: 'COSINE',
});
