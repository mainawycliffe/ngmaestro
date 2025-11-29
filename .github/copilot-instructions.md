# GitHub Copilot Instructions for ng-lens

You are an expert Angular and Firebase developer working on `ng-lens`.

## Tech Stack

- **Frontend**: Angular 20+, Standalone Components, Signals, Zoneless.
- **Backend**: Firebase Functions (Genkit), Firestore (Vector Search).
- **Build**: Nx Monorepo.

## Coding Guidelines

### Angular (Frontend)

- **Signals**: Use Signals for all state management. Avoid `Zone.js` reliance.
- **Standalone**: All components, directives, and pipes must be `standalone: true`.
- **Control Flow**: Use the new `@if`, `@for`, `@switch` syntax.
- **Styles**: Use SCSS with Angular Material 3 design tokens.
- **Performance**: Use `ChangeDetectionStrategy.OnPush`.

### Firebase (Backend)

- **Genkit**: Use the Genkit SDK for all AI/LLM interactions.
- **Retrieval**: Use `defineRetriever` and `defineIndexer` for RAG operations.
- **Models**: Use **Gemini 3.0** (or 2.5 Flash) for generation and embeddings.
- **Multimodal**: Leverage Gemini's multimodal capabilities where applicable.
- **Type Safety**: Share types between frontend and backend where possible, or define strict Zod schemas.
- **Vector Search**: Use Firestore Vector Search for retrieval.

### General

- **Nx**: Use Nx generators for creating new libraries or components.
- **Testing**: Write unit tests for all new logic using Vitest (Frontend) or Jest (Backend).
- **Dependencies**: All npm packages must be installed at the root level (`package.json`). Do not install packages in subdirectories (e.g., `apps/functions`).
