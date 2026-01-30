# Development Guide

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.development`
3. Start dev server: `npm run dev`

## Coding Standards

### TypeScript

- Use strict mode (already configured)
- Avoid `any` type - use proper types or `unknown`
- Use type inference where possible
- Define explicit return types for exported functions

### Components

- Use functional components with hooks
- Keep components small and focused (Single Responsibility)
- Extract reusable logic into custom hooks
- Use proper TypeScript props interfaces

### State Management

- Use React Query for server state
- Use Zustand for global client state
- Use useState for local component state
- Use URL state for filters and pagination

### Testing

- Write tests for all utility functions
- Write tests for custom hooks
- Write tests for complex components
- Maintain >80% code coverage

## Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add my feature"`
3. Push and create PR: `git push origin feature/my-feature`

### Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `docs:` - Documentation updates
- `chore:` - Build process or auxiliary tool changes

## API Integration

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for backend API details.

### Making API Calls

1. Define types in `src/api/types.ts` (snake_case)
2. Create transformer in `src/api/transformers.ts`
3. Define domain types in `src/types/` (camelCase)
4. Create API function in `src/api/*.api.ts`
5. Create custom hook in `src/hooks/`

## Troubleshooting

### Port Already in Use

Change port in `vite.config.ts`:

```typescript
server: {
  port: 3001;
}
```

### Type Errors

Run type check: `npm run type-check`

### Linting Errors

Auto-fix: `npm run lint -- --fix`
