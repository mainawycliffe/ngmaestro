# 📅 Project Plan: ng-lens

## Phase 1: Backend & Data Configuration

- [ ] **Install Dependencies**: Install `@genkit-ai/firebase` in `apps/functions` and root.
- [ ] **Configure Firestore Indexes**: Add vector index configuration to `firestore.indexes.json` for the `angular-docs` collection.
  - **Requirement**: The index must support filtering by the `version` field to allow version-specific searches.
- [ ] **Implement Genkit Retriever**: Refactor `apps/functions/src/index.ts` to use `defineFirestoreRetriever` from `@genkit-ai/firebase`.
  - **Requirement**: Use **Gemini 2.5/3.0 Flash** for embeddings.
  - **Requirement**: Use the `where` option in `ai.retrieve` to filter by `version`.
- [ ] **Refactor Indexer**: Update `tools/process-docs.ts` to populate Firestore in a format compatible with `defineFirestoreRetriever`.
  - **Schema**: `content` (text), `embedding` (vector), `metadata` (object).
- [ ] **Data Ingestion**: Run the ingestion script to populate Firestore.
  - **Task**: Populate `docs/` folders with markdown files.

## Phase 2: Frontend Integration

- [ ] **Create Oracle Service**: Implement `OracleService` in `apps/ui` to communicate with the `theOracle` Cloud Function.
- [ ] **Connect Components**: Wire up `search-bar` and `answer-display` components to the service.
- [ ] **State Management**: Ensure proper loading states and error handling in the UI.

## Phase 3: Polish & Deployment

- [ ] **UI Polish**: Ensure Markdown rendering and code highlighting work correctly in the answer display.
- [ ] **Deployment**: Deploy Firestore indexes and Cloud Functions.
