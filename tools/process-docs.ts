import { vertexAI } from '@genkit-ai/google-genai';
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

// Vertex AI configuration
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'ng-lens';
const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

// Initialize Genkit with Vertex AI
const ai = genkit({
  plugins: [vertexAI({ projectId, location })],
});

// Use Vertex AI embedder
const embedder = vertexAI.embedder('text-embedding-004');

console.log('Using Vertex AI for embeddings');
console.log(`Project: ${projectId}, Location: ${location}`);

// Rate limiting helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Documentation source types
type DocSource = 'angular' | 'material' | 'ngrx' | 'analogjs';

// Map source to collection name
const getCollectionName = (source: DocSource): string => {
  switch (source) {
    case 'angular':
      return 'angular-docs';
    case 'material':
      return 'material-docs';
    case 'ngrx':
      return 'ngrx-docs';
    case 'analogjs':
      return 'analogjs-docs';
  }
};

// Define the indexer
const docsIndexer = ai.defineIndexer(
  {
    name: 'docsIndexer',
  },
  async (docs) => {
    const batch = db.batch();
    let batchCount = 0;

    // Process embeddings in smaller batches to avoid rate limits
    const EMBEDDING_BATCH_SIZE = 5;
    const embeddings = [];

    for (let i = 0; i < docs.length; i += EMBEDDING_BATCH_SIZE) {
      const batchDocs = docs.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchEmbeddings = await Promise.all(
        batchDocs.map((d) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ai.embed({ embedder: embedder as any, content: d.text }),
        ),
      );
      embeddings.push(...batchEmbeddings);

      // Add delay between batches to respect rate limits
      if (i + EMBEDDING_BATCH_SIZE < docs.length) {
        await sleep(1000); // 1 second delay between batches
      }
    }

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const { source, version, path, section, url, tokens } =
        doc.metadata || {};

      // Handle potential array response or single object
      const result = embeddings[i];
      const embedding = Array.isArray(result)
        ? result[0].embedding
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result as any).embedding;

      // Create a deterministic ID
      const docId =
        doc.metadata?.id ||
        `${source}_${version}_${path.replace(/[/.]/g, '-')}_${Date.now()}`;

      const collectionName = getCollectionName(source as DocSource);
      const docRef = db.collection(collectionName).doc(docId);

      batch.set(docRef, {
        id: docId,
        source,
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
  },
);

// Parse markdown frontmatter and content
function parseMarkdown(content: string, filePath: string) {
  let title = filePath.split('/').pop()?.replace('.md', '') || 'Untitled';
  let slug: string | undefined;

  // Extract frontmatter if it exists
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const slugMatch = frontmatter.match(/^slug:\s*(.+)$/m);
    if (slugMatch) {
      slug = slugMatch[1].trim();
    }
  }

  // Extract title from first h1 or filename
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1];
  }

  return { title, content, slug };
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

// Generate URL based on source and path
function generateUrl(
  source: DocSource,
  relativePath: string,
  version: string,
  customSlug?: string,
): string {
  // If custom slug is provided, use it
  if (customSlug) {
    switch (source) {
      case 'angular': {
        const baseUrl =
          version === 'v21'
            ? 'https://angular.dev'
            : `https://${version}.angular.dev`;
        return `${baseUrl}${customSlug.startsWith('/') ? customSlug : '/' + customSlug}`;
      }
      case 'material': {
        const baseUrl =
          version === 'v21'
            ? 'https://material.angular.io'
            : `https://${version}.material.angular.io`;
        return `${baseUrl}${customSlug.startsWith('/') ? customSlug : '/' + customSlug}`;
      }
      case 'ngrx': {
        const baseUrl =
          version === 'v21' ? 'https://ngrx.io' : `https://${version}.ngrx.io`;
        return `${baseUrl}/guide${customSlug.startsWith('/') ? customSlug : '/' + customSlug}`;
      }
      case 'analogjs':
        return `https://analogjs.org/docs${customSlug.startsWith('/') ? customSlug : '/' + customSlug}`;
    }
  }

  const pathWithoutExt = relativePath.replace('.md', '');
  const pathParts = pathWithoutExt.split('/');

  switch (source) {
    case 'angular': {
      // For Angular docs, use version-specific subdomain (v21 uses main domain, others use v{version}.angular.dev)
      const baseUrl =
        version === 'v21'
          ? 'https://angular.dev'
          : `https://${version}.angular.dev`;

      // For Angular docs, use only the top-level category and the file name
      // e.g., "best-practices/runtime-performance/skipping-subtrees" -> "best-practices/skipping-subtrees"
      if (pathParts.length > 2) {
        return `${baseUrl}/${pathParts[0]}/${pathParts[pathParts.length - 1]}`;
      }
      return `${baseUrl}/${pathWithoutExt}`;
    }
    case 'material': {
      // Material uses version-specific subdomain (v21 uses main domain, others use v{version}.material.angular.io)
      const baseUrl =
        version === 'v21'
          ? 'https://material.angular.io'
          : `https://${version}.material.angular.io`;

      // Material follows similar pattern - use top-level category and file name
      // Most material docs are flat, but handle nested structure if present
      if (pathParts.length > 1) {
        return `${baseUrl}/guide/${pathParts[pathParts.length - 1]}`;
      }
      return `${baseUrl}/guide/${pathWithoutExt}`;
    }
    case 'ngrx': {
      // NgRx uses version-specific subdomain (v21 uses main domain, others use v{version}.ngrx.io)
      const baseUrl =
        version === 'v21' ? 'https://ngrx.io' : `https://${version}.ngrx.io`;

      // For ngrx docs, keep only the first level of nesting
      // e.g., "eslint-plugin/rules/prefer-action-creator" -> "eslint-plugin"
      // e.g., "router-store/actions" -> "router-store/actions" (2 levels is fine)
      if (pathParts.length > 2) {
        return `${baseUrl}/guide/${pathParts[0]}`;
      }
      return `${baseUrl}/guide/${pathWithoutExt}`;
    }
    case 'analogjs':
      return `https://analogjs.org/docs/${pathWithoutExt}`;
    default:
      return '';
  }
}

// Process a single version's documentation
async function processVersion(
  source: DocSource,
  version: string,
  versionDir: string,
) {
  const sourceLabel = source.charAt(0).toUpperCase() + source.slice(1);
  console.log(`\nProcessing ${sourceLabel} ${version}...`);

  // Check if directory exists
  try {
    statSync(versionDir);
  } catch {
    console.warn(
      `Directory for ${sourceLabel} ${version} not found at ${versionDir}. Skipping.`,
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

      const { title, slug } = parseMarkdown(content, filePath);
      const chunks = chunkContent(content);

      console.log(`  Processing: ${relativePath} (${chunks.length} chunks)`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const sanitizedPath = relativePath.replace(/[/.]/g, '-');
        const docId = `${source}_${version}_${sanitizedPath}_${i}`;

        documents.push(
          new Document({
            content: [{ text: chunk }],
            metadata: {
              id: docId,
              source,
              version,
              path: relativePath,
              title,
              section,
              url: generateUrl(source, relativePath, version, slug),
              tokens: Math.ceil(chunk.length / 4),
            },
          }),
        );
      }

      processedCount++;

      // Index in batches of 10 documents to avoid rate limits and show progress
      if (documents.length >= 10) {
        await ai.index({
          indexer: docsIndexer,
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
      indexer: docsIndexer,
      documents,
    });
  }

  console.log(
    `✓ Completed ${sourceLabel} ${version}: ${processedCount} files processed`,
  );
}

// Main execution
async function main() {
  const docsPath = join(process.cwd(), 'docs');
  const versions = ['v18', 'v19', 'v20', 'v21'];

  console.log('Starting documentation processing...');
  console.log('Docs path:', docsPath);
  console.log('================================================\n');

  // Process Angular core documentation
  console.log('Processing Angular Core Documentation');
  console.log('---------------------------------------');
  for (const version of versions) {
    const versionDir = join(docsPath, version);
    await processVersion('angular', version, versionDir);
  }

  // Process Angular Material documentation
  console.log('\n\nProcessing Angular Material Documentation');
  console.log('------------------------------------------');
  for (const version of versions) {
    const versionDir = join(docsPath, 'material', version);
    await processVersion('material', version, versionDir);
  }

  // Process NgRx documentation
  console.log('\n\nProcessing NgRx Documentation');
  console.log('------------------------------');
  for (const version of versions) {
    const versionDir = join(docsPath, 'ngrx', version);
    await processVersion('ngrx', version, versionDir);
  }

  // Process AnalogJS documentation
  console.log('\n\nProcessing AnalogJS Documentation');
  console.log('----------------------------------');
  const analogjsVersion = 'latest';
  const analogjsDir = join(docsPath, 'analogjs', analogjsVersion);
  await processVersion('analogjs', analogjsVersion, analogjsDir);

  console.log('\n================================================');
  console.log('✓ All documentation processed successfully!');
  console.log('================================================');
}

// Run the script
main().catch(console.error);
