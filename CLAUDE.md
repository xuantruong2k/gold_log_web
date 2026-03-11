# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # tsc + vite build (outputs to /dist)
npm run lint         # ESLint (exits 1 on warnings)
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm run type-check   # TypeScript check without emit
npm run test         # Run all tests with Vitest
npm run test:ui      # Vitest UI dashboard
npm run test:coverage # Coverage report
```

To run a single test file: `npx vitest run src/utils/__tests__/constants.test.ts`

## Domain Context

This app tracks gold investment transactions. Key domain units:

- **Gold quantity**: CHI (default), LUONG, OZ
- **Currency**: VND (default), USD
- **Providers**: SJC, PNJ, SBJ (Vietnamese gold providers)
- Transactions are either `BUY` or `SELL` and support soft delete

## Architecture

### State Management — Three-Layer Strategy

1. **Server state (TanStack React Query):** All API data — transactions, user profile. Handles caching and revalidation.
2. **Global client state (Zustand):** Auth token/user in `src/stores/authStore.ts`, persisted to localStorage.
3. **URL state (React Router v7):** Filter/pagination parameters live in query params.

### API Layer (`src/api/`)

- `client.ts` — Axios instance (`baseURL: VITE_API_BASE_URL`, 10s timeout) with two interceptors: (1) injects Bearer token from Zustand store, (2) clears auth and redirects on 401
- `transformers.ts` — Converts between snake_case API DTOs and camelCase domain types. Always use this layer when adding API endpoints.
- `types.ts` — API DTO types (snake_case, matches backend)
- Domain types in `src/types/` are camelCase — never mix conventions

**Workflow for adding a new API endpoint:**

1. Add DTO types to `src/api/types.ts` (snake_case)
2. Add transformer functions to `src/api/transformers.ts`
3. Add domain types to `src/types/` (camelCase)
4. Add API function to `src/api/*.api.ts`
5. Create a custom hook in `src/hooks/` using React Query

**Idempotency:** Transaction creation requires a UUID v4 `idempotency_key` — generate a fresh one per request (never reuse). The API returns 409 on duplicates.

### Forms

React Hook Form + Zod schemas (`src/schemas/`). Use `@hookform/resolvers/zod` for integration. Infer TypeScript types from Zod schemas with `z.infer<typeof schema>`.

### Routing

Protected routes via `ProtectedRoute` HOC that checks Zustand auth state. Route constants in `src/config/routes.ts`. OAuth callback with CSRF state verification in `OAuthCallbackPage` (state stored in sessionStorage, verified before token exchange).

### Component Organization

- `src/components/common/` — Reusable UI primitives (Button, Input, Modal, etc.)
- `src/components/layout/` — App shell (Header, Footer, MainLayout)
- `src/components/features/` — Business logic components grouped by domain
- `src/pages/` — Route-level components (thin, delegate to hooks/features)
- `src/hooks/` — Custom hooks encapsulating React Query calls and derived state

### Testing

Tests use Vitest + React Testing Library with jsdom. Global test utilities in `src/test/utils.tsx`. Tests colocated with source (`*.test.ts`) or in `__tests__/` subdirectories.

## Conventions

### File Naming

- Components: `PascalCase.tsx` (e.g., `TransactionForm.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useTransactions.ts`)
- Types: `camelCase.types.ts` (e.g., `transaction.types.ts`)
- Stores: `camelCaseStore.ts` (e.g., `authStore.ts`)
- Schemas: `camelCase.schema.ts` (e.g., `transaction.schema.ts`)

### TypeScript

- **Strict mode** — `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` all enabled
- Avoid `any` — use `unknown` with type guards or proper types
- No `console.log` in production code
- **Path alias:** `@/` maps to `src/`

### Code Style

- **Prettier:** 2-space indent, single quotes, 100-char line width, trailing commas ES5
- Pre-commit hook runs lint-staged (ESLint + Prettier on `*.ts`/`*.tsx`)

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`, `perf:`

Branch naming: `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`

## Environment

Copy `.env.example` to `.env.development`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback/google
VITE_ENVIRONMENT=development
```

The backend API follows REST conventions with all fields in `snake_case`. See `API_DOCUMENTATION.md` for full endpoint reference.

## Key Docs

- `ARCHITECTURE.md` — component hierarchy, state management patterns, full code examples for API layer, Zustand store, React Query hooks, and OAuth flow
- `CONTRIBUTING.md` — file naming rules, TypeScript/React best practices, API integration conventions, commit format, and PR process
- `DEVELOPMENT.md` — step-by-step setup, coding standards summary, git workflow, and troubleshooting (port conflicts, type errors)
- `API_DOCUMENTATION.md` — full REST API reference: auth endpoints, transaction CRUD, gold price endpoints (Vietnamese SJC/PNJ/SBJ and world price), error codes, rate limiting, and data models
- `TESTING_GUIDE.md` — testing pyramid strategy, mocking techniques (vi.mock, MSW), coverage targets by area, and AAA/BDD patterns
- `PRODUCT.md` — product vision, target users (Vietnamese gold investors), and feature scope

## Plans

Implementation plans live in `.claude/plans/`. Each `plan-*.md` covers a feature end-to-end (types → transformer → API function → hook → verification).
