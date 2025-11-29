import { googleAI } from '@genkit-ai/google-genai';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync, statSync } from 'fs';
import { Document, genkit } from 'genkit';
import { join } from 'path';

// Initialize Firebase
initializeApp({
  credential: applicationDefault(),
  projectId: 'ng-lens',
});

const db = getFirestore();

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
});

const embedder = googleAI.embedder('text-embedding-004');

// Define the indexer
const angularDocsIndexer = ai.defineIndexer(
  {
    name: 'angularDocsIndexer',
  },
  async (docs) => {
    const batch = db.batch();
    let batchCount = 0;

    // Generate embeddings for all docs in this batch
    const embeddings = await Promise.all(
      docs.map((d) => ai.embed({ embedder, content: d.text }))
    );

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const { version, path, section, url, tokens } = doc.metadata || {};

      // Handle potential array response or single object
      const result = embeddings[i];
      const embedding = Array.isArray(result)
        ? result[0].embedding
        : (result as any).embedding;

      // Create a deterministic ID
      const docId =
        doc.metadata?.id ||
        `${version}_${path.replace(/[/.]/g, '-')}_${Date.now()}`;

      const docRef = db.collection('angular-docs').doc(docId);

      batch.set(docRef, {
        id: docId,
        version,
        path,
        content: doc.text,
        embedding: FieldValue.vector(embedding),
        metadata: {
          section,
          url,
          tokens,
        },
        createdAt: new Date(),
      });

      batchCount++;
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`    Committed batch of ${batchCount} chunks`);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`    Committed final batch of ${batchCount} chunks`);
    }
  }
);

// Parse markdown frontmatter and content
function parseMarkdown(content: string, filePath: string) {
  // const lines = content.split('\n'); // Unused
  let title = filePath.split('/').pop()?.replace('.md', '') || 'Untitled';

  // Extract title from first h1 or filename
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1];
  }

  return { title, content };
}

// Chunk content into smaller pieces for better retrieval
function chunkContent(content: string, maxTokens = 500): string[] {
  const chunks: string[] = [];
  const paragraphs = content.split(/\n\n+/);

  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = Math.ceil(paragraph.length / 4); // Rough token estimate

    if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
      currentTokens = paragraphTokens;
    } else {
      currentChunk += '\n\n' + paragraph;
      currentTokens += paragraphTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Get all markdown files from a version directory
function getMarkdownFiles(versionDir: string): string[] {
  const files: string[] = [];

  function traverse(dir: string) {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  traverse(versionDir);
  return files;
}

// Process a single version's documentation
async function processVersion(version: string, docsPath: string) {
  console.log(`\nProcessing Angular ${version}...`);

  const versionDir = join(docsPath, version);

  // Check if directory exists
  try {
    statSync(versionDir);
  } catch {
    console.warn(
      `Directory for ${version} not found at ${versionDir}. Skipping.`
    );
    return;
  }

  const files = getMarkdownFiles(versionDir);
  console.log(`Found ${files.length} markdown files`);

  let processedCount = 0;
  const documents: Document[] = [];

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const relativePath = filePath.replace(versionDir + '/', '');
      const section = relativePath.split('/')[0];

      const { title } = parseMarkdown(content, filePath);
      const chunks = chunkContent(content);

      console.log(`  Processing: ${relativePath} (${chunks.length} chunks)`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const sanitizedPath = relativePath.replace(/[/.]/g, '-');
        const docId = `${version}_${sanitizedPath}_${i}`;

        documents.push(
          new Document({
            content: [{ text: chunk }],
            metadata: {
              id: docId,
              version,
              path: relativePath,
              title,
              section,
              url: `https://angular.dev/${relativePath.replace('.md', '')}`,
              tokens: Math.ceil(chunk.length / 4),
            },
          })
        );
      }

      processedCount++;

      // Index in batches of 50 documents to avoid memory issues and show progress
      if (documents.length >= 50) {
        await ai.index({
          indexer: angularDocsIndexer,
          documents: [...documents], // Pass a copy
        });
        documents.length = 0; // Clear array
      }
    } catch (error) {
      console.error(`  Error processing ${filePath}:`, error);
    }
  }

  // Index remaining documents
  if (documents.length > 0) {
    await ai.index({
      indexer: angularDocsIndexer,
      documents,
    });
  }

  console.log(
    `✓ Completed Angular ${version}: ${processedCount} files processed`
  );
}

// Main execution
async function main() {
  const docsPath = join(process.cwd(), 'docs');
  const versions = ['v18', 'v19', 'v20', 'v21'];

  console.log('Starting Angular documentation processing...');
  console.log('Docs path:', docsPath);

  for (const version of versions) {
    await processVersion(version, docsPath);
  }

  console.log('\n✓ All versions processed successfully!');
}

// Run the script
main().catch(console.error);
