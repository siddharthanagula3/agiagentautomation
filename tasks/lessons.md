# Lessons Learned

Patterns and corrections captured during development. Review at session start.

## Supabase

- Use `.maybeSingle()` not `.single()` when a row may not exist — `.single()` throws PGRST116 (406) on zero rows
- Always use `auth.getUser()` for JWT verification, never just decode — prevents forged tokens
- Database changes always via migrations (`supabase migration new`), never direct SQL

## State Management

- Import all Zustand stores from `@shared/stores/index.ts`, never directly from store files
- Use `Record<>` not `Map/Set` in Zustand stores — Map/Set don't serialize with Immer
- Use React Query for server state, not manual `useState`/`useEffect` fetch patterns

## Security

- API keys never on client — always proxy through Netlify Functions / Vercel API routes
- CORS: use origin whitelist, never `*`
- Rate limiter should fail closed (deny) when Redis is unavailable, not fail open

## Build & Deploy

- `.vercel/output/` must be excluded from ESLint — it contains compiled artifacts
- Vite glob: use `query: '?raw', import: 'default'` not deprecated `as: 'raw'`
- Bundle size limits in `.size-limit.json` — check after adding dependencies

## Path Aliases

- Always use `@features/`, `@core/`, `@shared/` — never relative paths across feature boundaries
- These are defined in both `tsconfig.json` and `vite.config.ts`
