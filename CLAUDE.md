# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (runs on localhost:8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:run` - Run tests once (no watch mode)

## Architecture Overview

This is a comprehensive React TypeScript application built with Vite that implements an AGI Agent Automation platform. The application features multiple layouts and extensive routing for different user types and functionalities.

### Key Technologies
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation and optimized code splitting
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom color scheme including agent/workforce themes
- **Routing**: React Router v6 with nested routing and protected routes
- **State Management**: React Query for server state, Zustand for client state
- **Backend Integration**: Supabase for database, authentication, and real-time features
- **Testing**: Vitest with React Testing Library and jsdom

### Project Structure
- `src/pages/` - Application pages organized by feature area (dashboard, auth, public pages)
- `src/layouts/` - Layout components (PublicLayout, DashboardLayout, AuthLayout, AdminLayout)
- `src/components/` - Reusable UI components organized by feature
- `src/components/ui/` - shadcn/ui component library
- `src/contexts/` - React contexts (AuthContext, AccessibilityContext)
- `src/hooks/` - Custom React hooks
- `src/integrations/supabase/` - Backend integration with typed client
- `src/lib/` - Utility functions and configurations
- `src/stores/` - Zustand state management stores

### Application Architecture

#### Multi-Layout System
- **PublicLayout**: Landing pages, marketing content, blog
- **AuthLayout**: Login/register forms
- **DashboardLayout**: Main application interface with extensive feature set
- **AdminLayout**: Administrative functions with role-based access

#### Route Organization
The application has 100+ routes organized into:
- Public routes (marketing, about, contact, blog)
- Authentication routes (login, register)
- Dashboard routes (70+ feature pages including workforce, analytics, settings)
- Admin routes with protected access
- Chat interface as standalone route

#### Authentication & Authorization
- Context-based authentication with Supabase
- Protected routes with role-based access control
- Admin-only routes with dedicated AdminRoute component

### Core Features
1. **Chat Interface**: ChatGPT-like interface with message history, model selection, and conversation management
2. **Multi-tenant Dashboard**: Comprehensive dashboard with workforce management, analytics, settings
3. **Authentication System**: Complete auth flow with registration, login, profile management
4. **Admin Panel**: Administrative interface with user management
5. **Responsive Design**: Mobile-first approach with collapsible sidebars

### UI/UX Patterns
- Custom Tailwind theme with semantic color tokens (agent, workforce, primary)
- Consistent component patterns using shadcn/ui
- Accessible components with ARIA support
- Toast notifications via Sonner
- Loading states and error boundaries
- Theme switching support (dark/light mode)

### Development Notes
- Path alias `@/` resolves to `src/` directory
- TypeScript with permissive settings (noImplicitAny: false, strictNullChecks: false)
- Vite dev server on port 8080 with IPv6 support ("::")
- Optimized build with manual code splitting for vendor chunks
- ESLint with React and TypeScript rules
- Vitest for testing with coverage support
- Built for deployment on multiple platforms (Docker, Vercel)