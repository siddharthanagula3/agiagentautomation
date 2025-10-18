# Contributing Guidelines

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase CLI (for local development)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd agi-agent-automation
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp src/env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start local Supabase**

   ```bash
   supabase start
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Commit Convention

Use conventional commits:

```
type(scope): description

feat(auth): add OAuth integration
fix(chat): resolve message streaming issue
docs(api): update authentication guide
```

**Types:**

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Code formatting
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance

## Code Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types
- Use path aliases (`@shared/*`, `@features/*`)
- Avoid `any` type

### React

- Use functional components
- Prefer hooks over class components
- Use proper prop types
- Implement error boundaries

### File Organization

```
src/features/[feature-name]/
├── components/
├── pages/
├── hooks/
├── services/
├── types/
└── index.ts
```

### Naming Conventions

- **Files:** kebab-case (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Functions:** camelCase (`getUserProfile`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Writing Tests

- Unit tests for utilities and services
- Integration tests for API calls
- E2E tests for user workflows
- Test coverage > 80%

## Pull Request Process

### Before Submitting

1. **Run tests**

   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```

2. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update type definitions

3. **Test manually**
   - Test the feature thoroughly
   - Check for edge cases
   - Verify responsive design

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Architecture Guidelines

### Feature Development

1. **Create feature directory**

   ```bash
   mkdir src/features/my-feature
   ```

2. **Follow standard structure**
   - Components in `components/`
   - Pages in `pages/`
   - Hooks in `hooks/`
   - Services in `services/`

3. **Use proper imports**

   ```typescript
   // ✅ Good
   import { useAuth } from '@shared/hooks';
   import { authService } from '@_core/auth';

   // ❌ Bad
   import { useAuth } from '../../../shared/hooks';
   ```

### State Management

- Use Zustand for global state
- Keep state close to components when possible
- Use proper TypeScript types
- Implement proper error handling

### API Integration

- Use the unified LLM service
- Implement proper error handling
- Use TypeScript types
- Add loading states

## Performance Guidelines

### Bundle Size

- Use dynamic imports for large components
- Optimize images and assets
- Remove unused dependencies

### Rendering

- Use React.memo for expensive components
- Implement proper key props
- Avoid unnecessary re-renders
- Use proper dependency arrays

## Security Guidelines

### Data Handling

- Never expose API keys in client code
- Use environment variables
- Implement proper validation
- Sanitize user inputs

### Authentication

- Use Supabase Auth
- Implement proper route protection
- Handle token expiration
- Use secure storage

## Documentation

### Code Documentation

- Use JSDoc for functions
- Add README files for complex features
- Document API interfaces
- Include usage examples

### Architecture Documentation

- Update architecture docs for major changes
- Document new patterns
- Include diagrams for complex flows
- Maintain API documentation

## Troubleshooting

### Common Issues

1. **Build failures**
   - Check TypeScript errors
   - Verify import paths
   - Run `npm run type-check`

2. **Runtime errors**
   - Check browser console
   - Verify environment variables
   - Check network requests

3. **Test failures**
   - Update test snapshots
   - Check test environment
   - Verify mock implementations

### Getting Help

- Check existing issues
- Search documentation
- Ask in team chat
- Create detailed issue report
