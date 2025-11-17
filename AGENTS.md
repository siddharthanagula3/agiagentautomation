# Repository Guidelines

## Project Structure & Module Organization

The Vite + React workspace keeps feature logic in `src/` with `core/` (state/services), `features/` (UI flows), `shared/` (atoms/utilities), `components/`, `layouts/`, and `pages/`. Static assets live in `public/`, automation scripts in `scripts/`, deployment configs in `netlify/`, and Supabase migrations plus policies in `supabase/`. Agent blueprints reside in `.agi/employees/`, while developer docs and blogs live in `docs/` and `blogs/`. Tests are grouped under `tests/` (`unit`, `e2e`, `fixtures`), with outputs landing in `coverage/` and `test-results/`.

## Build, Test, and Development Commands

`npm run dev` boots the local server (5173). `npm run build` or `build:prod` emits production bundles inside `dist/`, and `npm run preview` serves a compiled build. Quality gates rely on `npm run lint`, `npm run type-check`, and `npm run format`/`format:check`. `npm run test`, `test:run`, and `test:coverage` drive Vitest, while `npm run e2e`, `e2e:ui`, and `e2e:debug` execute Playwright suites. Run `supabase start` before anything that touches database-backed agents.

## Coding Style & Naming Conventions

Strict TypeScript settings prohibit `any`, implicit returns, and unused symbols. Prettier enforces 2-space indentation, single quotes, 80-character width, and Tailwind class ordering; Husky + lint-staged apply it automatically on commit. Prefer PascalCase component files (`AgentPanel.tsx`), camelCase utilities/hooks, and kebab-case asset directories. Access modules through aliases (`@core/*`, `@features/*`, `@shared/*`, `@/*`) rather than long relative paths, and colocate business logic with the relevant feature folder.

## Testing Guidelines

Keep UI unit tests close to their component or in `tests/unit`, using Vitest plus Testing Library for assertions. Mock Supabase, LLM gateways, and network calls with fixtures under `tests/fixtures` to keep runs deterministic. Maintain coverage for success, error, and loading states whenever adding or refactoring flows, and fail the build locally with `npm run test:coverage` if thresholds regress. Cross-agent workflows, onboarding, and billing journeys belong to Playwright specs in `tests/e2e` named `{feature}.spec.ts`; capture traces/snapshots for any flaky reproduction before filing issues.

## Commit & Pull Request Guidelines

Follow the existing `<type>: <summary>` convention (`feat: Complete VIBE v2 multi-agent workspace implementation`) and reference incident IDs where possible. Each PR must describe the problem, outline the solution, attach screenshots for UI-facing work, and list the exact commands/tests executed. Include links to docs or `.agi` updates, call out environment variable changes (mirrored in `.env.example`), and mention any Supabase migration files. Husky runs ESLint/Prettier on staged files, so keep commits focused to speed up the hook.
