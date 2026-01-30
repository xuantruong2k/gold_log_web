# Gold Log Client

Web client for Gold Log - Track your gold investment transactions and performance.

## Tech Stack

- **React 18+** - UI framework
- **TypeScript 5+** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **React Query** - Server state management
- **Zustand** - Global state management
- **React Hook Form + Zod** - Form validation
- **Vitest** - Testing

## Prerequisites

- Node.js 18+ or 20+
- npm 9+

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create `.env.development` file:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback/google
VITE_ENVIRONMENT=development
```

## Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests
npm run test:ui      # Open Vitest UI
npm run type-check   # Run TypeScript type checking
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforces code quality rules
- **Prettier**: Auto-formats code
- **Husky**: Pre-commit hooks run linting and formatting
- **Vitest**: Unit and integration tests

### Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # React components
│   ├── common/       # Reusable components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── pages/            # Page components (routes)
├── stores/           # Zustand stores
├── types/            # TypeScript types
├── utils/            # Utility functions
├── schemas/          # Zod validation schemas
├── config/           # Configuration
└── test/             # Test utilities
```

## Testing

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Building for Production

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

## License

MIT
