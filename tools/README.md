# Documentation Processing Tools

## Overview

This directory contains scripts for fetching and processing documentation from Angular, Angular Material, and NgRx repositories.

---

## Fetch Scripts

### fetch-all-docs.sh

**Convenience script** that runs all three fetch scripts in sequence.

**Usage:**

```bash
./tools/fetch-all-docs.sh
# OR
pnpm fetch:all
```

**Equivalent to running:**

```bash
pnpm fetch:angular
pnpm fetch:material
pnpm fetch:ngrx
```

---

### fetch-docs.sh

Fetches Angular core documentation from the `angular/angular` repository.

**Versions:** v18, v19, v20, v21  
**Branch Mapping:**

- v18 → 18.2.x
- v19 → 19.0.x
- v20 → 20.0.x
- v21 → main

**Usage:**

```bash
./tools/fetch-docs.sh
# OR
pnpm fetch:angular
```

**Output:** `docs/v{18,19,20,21}/`

---

### fetch-material-docs.sh

Fetches Angular Material documentation from the `angular/components` repository.

**Versions:** v18, v19, v20, v21 (aligned with Angular versions)  
**Branch Mapping:**

- v18 → 18.2.x
- v19 → 19.0.x
- v20 → 20.0.x
- v21 → main

**Content:** Material guides (theming, custom components, harnesses, etc.)

**Usage:**

```bash
./tools/fetch-material-docs.sh
# OR
pnpm fetch:material
```

**Output:** `docs/material/v{18,19,20,21}/`

---

### fetch-ngrx-docs.sh

Fetches NgRx documentation from the `ngrx/platform` repository.

**Versions:** v18, v19, v20, v21 (aligned with Angular versions)  
**Tag/Branch Mapping:**

- v18 → 18.1.0
- v19 → 19.0.0
- v20 → 20.1.0
- v21 → main

**Content:** NgRx guides (Store, Effects, Router Store, Entity, Component Store, etc.)

**Usage:**

```bash
./tools/fetch-ngrx-docs.sh
# OR
pnpm fetch:ngrx
```

**Output:** `docs/ngrx/v{18,19,20,21}/`

---

## Processing Script

### process-docs.ts

Processes fetched documentation and creates vector embeddings for RAG (Retrieval-Augmented Generation).

### What it does:

1. **Reads markdown files** from all documentation sources:
   - `docs/v{18,19,20,21}/` (Angular core)
   - `docs/material/v{18,19,20,21}/` (Angular Material)
   - `docs/ngrx/v{18,19,20,21}/` (NgRx)
2. **Chunks content** into ~500 token pieces for optimal retrieval
3. **Generates embeddings** using Vertex AI text-embedding-004
4. **Stores in Firestore** with:
   - Content chunks
   - Vector embeddings
   - Metadata (source, version, section, URL)
   - Timestamps

### Firestore Schema:

```typescript
Collections:
  - angular-docs (Angular core documentation)
  - material-docs (Angular Material documentation)
  - ngrx-docs (NgRx documentation)

Document ID: {source}_{version}_{path}_{chunkIndex}
Fields:
  - id: string
  - source: string ('angular' | 'material' | 'ngrx')
  - version: string (v18, v19, v20, v21)
  - path: string (relative file path)
  - content: string (chunk text)
  - embedding: vector (vector embedding)
  - metadata:
      - section: string
      - url: string
      - tokens: number
  - createdAt: timestamp
```

**URLs by Source:**

- Angular: `https://angular.dev/{path}`
- Material: `https://material.angular.io/{path}`
- NgRx: `https://ngrx.io/guide/{path}`

### Prerequisites:

1. **Google Cloud Project** with Vertex AI API enabled
2. **Firebase project** setup
3. **Application Default Credentials** configured

### Environment Setup:

```bash
# Authenticate with Google Cloud (provides credentials for both Firebase and Vertex AI)
gcloud auth application-default login

# Set your Google Cloud Project ID (optional if already set in .env)
export GOOGLE_CLOUD_PROJECT="ng-lens"

# Set Vertex AI location (optional, defaults to us-central1)
export VERTEX_AI_LOCATION="us-central1"
```

Or create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Usage:

```bash
# Install dependencies (if not already done)
pnpm install

# Run the processor
pnpm process-docs
```

### Output

The script will:

- Process all markdown files
- Show progress for each version
- Commit documents in batches of 450
- Rate limit to avoid API quotas

### Notes

- Processing time: ~30-60 minutes for all sources
- Cost: Embeddings via Vertex AI (check pricing)
- Firestore writes: ~1000-5000 documents per version per source
- Can be run multiple times (will overwrite existing docs)
- Handles all three documentation sources in one execution

### Next Steps

After processing, you can query the vector database using Firestore's `findNearest` for semantic search.

---

## Complete Workflow

To fetch and process all documentation:

```bash
# Option 1: Use the convenience script
pnpm fetch:all

# Option 2: Fetch individually
pnpm fetch:angular   # Angular core
pnpm fetch:material  # Angular Material
pnpm fetch:ngrx      # NgRx

# Then process and index all docs
pnpm ingest-docs
```

The `process-docs.ts` script now handles all three documentation sources (Angular, Material, NgRx) automatically.

---

## Version Compatibility

All documentation versions are aligned with Angular major versions:

| Angular | Material | NgRx   | Branch/Tag |
| ------- | -------- | ------ | ---------- |
| v18     | 18.x     | 18.1.0 | 18.2.x     |
| v19     | 19.x     | 19.0.0 | 19.0.x     |
| v20     | 20.x     | 20.1.0 | 20.0.x     |
| v21     | 21.x     | main   | main       |
