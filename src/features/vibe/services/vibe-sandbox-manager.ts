/**
 * VibeSandboxManager - E2B-inspired sandbox management for code execution
 *
 * Key patterns from E2B:
 * - Sandbox session management (create, connect, pause, resume)
 * - File system operations with real-time watching
 * - Command execution with streaming output
 * - Template builder pattern for project scaffolding
 *
 * Since we run in browser, we use:
 * - Sandpack for React/TypeScript execution
 * - Virtual file system for storage
 * - WebSocket for real-time updates
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPE DEFINITIONS (E2B-inspired)
// ============================================================================

export type SandboxStatus =
  | 'idle'
  | 'creating'
  | 'running'
  | 'paused'
  | 'error'
  | 'terminated';

export type FileChangeType = 'create' | 'update' | 'delete' | 'rename';

export interface SandboxFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

export interface FileChange {
  type: FileChangeType;
  path: string;
  oldPath?: string; // For rename
  content?: string;
  timestamp: Date;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface SandboxMetrics {
  filesCount: number;
  totalSize: number;
  lastActivity: Date;
  commandsExecuted: number;
}

export interface SandboxTemplate {
  id: string;
  name: string;
  description: string;
  framework: 'react' | 'react-ts' | 'vanilla' | 'vanilla-ts' | 'vue' | 'vue-ts' | 'svelte';
  files: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface SandboxSession {
  id: string;
  status: SandboxStatus;
  template: SandboxTemplate;
  files: Map<string, SandboxFile>;
  previewUrl?: string;
  error?: string;
  metrics: SandboxMetrics;
  createdAt: Date;
  lastActivityAt: Date;
}

// ============================================================================
// TEMPLATE DEFINITIONS (E2B Template Builder Pattern)
// ============================================================================

export const SANDBOX_TEMPLATES: Record<string, SandboxTemplate> = {
  'react-ts': {
    id: 'react-ts',
    name: 'React TypeScript',
    description: 'React 18 with TypeScript and Vite',
    framework: 'react-ts',
    files: {
      '/package.json': JSON.stringify({
        name: 'vibe-sandbox',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.0',
          typescript: '^5.3.0',
          vite: '^5.0.0',
        },
      }, null, 2),
      '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vibe App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      '/src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      '/src/App.tsx': `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Welcome to Vibe</h1>
      <p>Start building your app!</p>
    </div>
  );
}

export default App;`,
      '/src/index.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app {
  text-align: center;
  color: white;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}`,
      '/vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
      '/tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
      }, null, 2),
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.2.0',
      typescript: '^5.3.0',
      vite: '^5.0.0',
    },
  },

  'vanilla-ts': {
    id: 'vanilla-ts',
    name: 'Vanilla TypeScript',
    description: 'Plain TypeScript with Vite',
    framework: 'vanilla-ts',
    files: {
      '/package.json': JSON.stringify({
        name: 'vibe-vanilla-sandbox',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        devDependencies: {
          typescript: '^5.3.0',
          vite: '^5.0.0',
        },
      }, null, 2),
      '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vibe App</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      '/src/main.ts': `import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = \`
  <div class="container">
    <h1>Welcome to Vibe</h1>
    <p>Start building your app with TypeScript!</p>
  </div>
\`;`,
      '/src/style.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  color: white;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}`,
      '/tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
        },
        include: ['src'],
      }, null, 2),
    },
    dependencies: {},
    devDependencies: {
      typescript: '^5.3.0',
      vite: '^5.0.0',
    },
  },
};

// ============================================================================
// TEMPLATE BUILDER (E2B Fluent API Pattern)
// ============================================================================

export class TemplateBuilder {
  private template: Partial<SandboxTemplate>;
  private customFiles: Record<string, string> = {};
  private customDeps: Record<string, string> = {};

  constructor(baseTemplate?: SandboxTemplate) {
    this.template = baseTemplate ? { ...baseTemplate } : {
      id: `custom-${Date.now()}`,
      name: 'Custom Template',
      description: 'Custom project template',
      framework: 'react-ts',
      files: {},
      dependencies: {},
    };
  }

  /**
   * Start from a React TypeScript template
   */
  static fromReactTS(): TemplateBuilder {
    return new TemplateBuilder(SANDBOX_TEMPLATES['react-ts']);
  }

  /**
   * Start from a Vanilla TypeScript template
   */
  static fromVanillaTS(): TemplateBuilder {
    return new TemplateBuilder(SANDBOX_TEMPLATES['vanilla-ts']);
  }

  /**
   * Set template name and description
   */
  withName(name: string, description?: string): TemplateBuilder {
    this.template.name = name;
    if (description) {
      this.template.description = description;
    }
    return this;
  }

  /**
   * Add a file to the template
   */
  addFile(path: string, content: string): TemplateBuilder {
    this.customFiles[path] = content;
    return this;
  }

  /**
   * Add multiple files
   */
  addFiles(files: Record<string, string>): TemplateBuilder {
    Object.assign(this.customFiles, files);
    return this;
  }

  /**
   * Add npm dependencies
   */
  addDependency(name: string, version: string): TemplateBuilder {
    this.customDeps[name] = version;
    return this;
  }

  /**
   * Add multiple dependencies
   */
  addDependencies(deps: Record<string, string>): TemplateBuilder {
    Object.assign(this.customDeps, deps);
    return this;
  }

  /**
   * Add Tailwind CSS
   */
  withTailwind(): TemplateBuilder {
    this.customDeps['tailwindcss'] = '^3.4.0';
    this.customDeps['postcss'] = '^8.4.0';
    this.customDeps['autoprefixer'] = '^10.4.0';

    this.customFiles['/tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`;

    this.customFiles['/postcss.config.js'] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

    return this;
  }

  /**
   * Add React Router
   */
  withRouter(): TemplateBuilder {
    this.customDeps['react-router-dom'] = '^6.20.0';
    return this;
  }

  /**
   * Add Zustand for state management
   */
  withZustand(): TemplateBuilder {
    this.customDeps['zustand'] = '^4.4.0';
    return this;
  }

  /**
   * Build the final template
   */
  build(): SandboxTemplate {
    const baseFiles = this.template.files || {};
    const baseDeps = this.template.dependencies || {};

    // Merge package.json with new dependencies
    const packageJson = JSON.parse(baseFiles['/package.json'] || '{}');
    packageJson.dependencies = { ...packageJson.dependencies, ...this.customDeps };

    const mergedFiles = {
      ...baseFiles,
      ...this.customFiles,
      '/package.json': JSON.stringify(packageJson, null, 2),
    };

    return {
      id: this.template.id || `template-${Date.now()}`,
      name: this.template.name || 'Custom Template',
      description: this.template.description || '',
      framework: this.template.framework || 'react-ts',
      files: mergedFiles,
      dependencies: { ...baseDeps, ...this.customDeps },
      devDependencies: this.template.devDependencies,
    };
  }
}

// ============================================================================
// SANDBOX MANAGER STORE
// ============================================================================

interface SandboxManagerState {
  sessions: Map<string, SandboxSession>;
  activeSessionId: string | null;
  fileWatchers: Map<string, Set<(change: FileChange) => void>>;

  // Session management
  createSession: (template?: SandboxTemplate) => string;
  getSession: (sessionId: string) => SandboxSession | undefined;
  getActiveSession: () => SandboxSession | undefined;
  setActiveSession: (sessionId: string) => void;
  pauseSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  terminateSession: (sessionId: string) => void;

  // File operations
  readFile: (sessionId: string, path: string) => string | undefined;
  writeFile: (sessionId: string, path: string, content: string) => void;
  deleteFile: (sessionId: string, path: string) => void;
  renameFile: (sessionId: string, oldPath: string, newPath: string) => void;
  listFiles: (sessionId: string, directory?: string) => SandboxFile[];
  watchFiles: (sessionId: string, callback: (change: FileChange) => void) => () => void;

  // Utilities
  getFilesForSandpack: (sessionId: string) => Record<string, string>;
  importFiles: (sessionId: string, files: Record<string, string>) => void;
  exportFiles: (sessionId: string) => Record<string, string>;
}

export const useSandboxManager = create<SandboxManagerState>()(
  immer((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,
    fileWatchers: new Map(),

    createSession: (template?: SandboxTemplate) => {
      const sessionId = `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const selectedTemplate = template || SANDBOX_TEMPLATES['react-ts'];

      // Convert template files to SandboxFile objects
      const files = new Map<string, SandboxFile>();
      for (const [path, content] of Object.entries(selectedTemplate.files)) {
        files.set(path, {
          path,
          content,
          language: detectLanguage(path),
          size: content.length,
          lastModified: new Date(),
        });
      }

      const session: SandboxSession = {
        id: sessionId,
        status: 'running',
        template: selectedTemplate,
        files,
        metrics: {
          filesCount: files.size,
          totalSize: Array.from(files.values()).reduce((acc, f) => acc + f.size, 0),
          lastActivity: new Date(),
          commandsExecuted: 0,
        },
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      set((state) => {
        state.sessions.set(sessionId, session);
        state.activeSessionId = sessionId;
        state.fileWatchers.set(sessionId, new Set());
      });

      return sessionId;
    },

    getSession: (sessionId: string) => {
      return get().sessions.get(sessionId);
    },

    getActiveSession: () => {
      const { activeSessionId, sessions } = get();
      if (!activeSessionId) return undefined;
      return sessions.get(activeSessionId);
    },

    setActiveSession: (sessionId: string) => {
      set((state) => {
        state.activeSessionId = sessionId;
      });
    },

    pauseSession: (sessionId: string) => {
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          session.status = 'paused';
          session.lastActivityAt = new Date();
        }
      });
    },

    resumeSession: (sessionId: string) => {
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session && session.status === 'paused') {
          session.status = 'running';
          session.lastActivityAt = new Date();
        }
      });
    },

    terminateSession: (sessionId: string) => {
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          session.status = 'terminated';
        }
        state.fileWatchers.delete(sessionId);
        if (state.activeSessionId === sessionId) {
          state.activeSessionId = null;
        }
      });
    },

    readFile: (sessionId: string, path: string) => {
      const session = get().sessions.get(sessionId);
      return session?.files.get(path)?.content;
    },

    writeFile: (sessionId: string, path: string, content: string) => {
      const isUpdate = get().sessions.get(sessionId)?.files.has(path);

      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          session.files.set(path, {
            path,
            content,
            language: detectLanguage(path),
            size: content.length,
            lastModified: new Date(),
          });
          session.lastActivityAt = new Date();
          session.metrics.filesCount = session.files.size;
          session.metrics.totalSize = Array.from(session.files.values())
            .reduce((acc, f) => acc + f.size, 0);
          session.metrics.lastActivity = new Date();
        }
      });

      // Notify watchers
      const watchers = get().fileWatchers.get(sessionId);
      if (watchers) {
        const change: FileChange = {
          type: isUpdate ? 'update' : 'create',
          path,
          content,
          timestamp: new Date(),
        };
        watchers.forEach((callback) => callback(change));
      }
    },

    deleteFile: (sessionId: string, path: string) => {
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          session.files.delete(path);
          session.lastActivityAt = new Date();
          session.metrics.filesCount = session.files.size;
          session.metrics.totalSize = Array.from(session.files.values())
            .reduce((acc, f) => acc + f.size, 0);
        }
      });

      // Notify watchers
      const watchers = get().fileWatchers.get(sessionId);
      if (watchers) {
        const change: FileChange = {
          type: 'delete',
          path,
          timestamp: new Date(),
        };
        watchers.forEach((callback) => callback(change));
      }
    },

    renameFile: (sessionId: string, oldPath: string, newPath: string) => {
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          const file = session.files.get(oldPath);
          if (file) {
            session.files.delete(oldPath);
            session.files.set(newPath, {
              ...file,
              path: newPath,
              lastModified: new Date(),
            });
            session.lastActivityAt = new Date();
          }
        }
      });

      // Notify watchers
      const watchers = get().fileWatchers.get(sessionId);
      if (watchers) {
        const change: FileChange = {
          type: 'rename',
          path: newPath,
          oldPath,
          timestamp: new Date(),
        };
        watchers.forEach((callback) => callback(change));
      }
    },

    listFiles: (sessionId: string, directory?: string) => {
      const session = get().sessions.get(sessionId);
      if (!session) return [];

      let files = Array.from(session.files.values());

      if (directory) {
        files = files.filter((f) => f.path.startsWith(directory));
      }

      return files.sort((a, b) => a.path.localeCompare(b.path));
    },

    watchFiles: (sessionId: string, callback: (change: FileChange) => void) => {
      const watchers = get().fileWatchers.get(sessionId);
      if (watchers) {
        watchers.add(callback);
      }

      // Return unsubscribe function
      return () => {
        const currentWatchers = get().fileWatchers.get(sessionId);
        if (currentWatchers) {
          currentWatchers.delete(callback);
        }
      };
    },

    getFilesForSandpack: (sessionId: string) => {
      const session = get().sessions.get(sessionId);
      if (!session) return {};

      const files: Record<string, string> = {};
      for (const [path, file] of session.files.entries()) {
        files[path] = file.content;
      }
      return files;
    },

    importFiles: (sessionId: string, files: Record<string, string>) => {
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          for (const [path, content] of Object.entries(files)) {
            session.files.set(path, {
              path,
              content,
              language: detectLanguage(path),
              size: content.length,
              lastModified: new Date(),
            });
          }
          session.lastActivityAt = new Date();
          session.metrics.filesCount = session.files.size;
          session.metrics.totalSize = Array.from(session.files.values())
            .reduce((acc, f) => acc + f.size, 0);
        }
      });
    },

    exportFiles: (sessionId: string) => {
      return get().getFilesForSandpack(sessionId);
    },
  }))
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Detect file language from path
 */
function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    svg: 'xml',
    py: 'python',
    rs: 'rust',
    go: 'go',
  };
  return languageMap[ext || ''] || 'plaintext';
}

/**
 * Create a sandbox from a template builder
 */
export function createSandboxFromBuilder(builder: TemplateBuilder): string {
  const template = builder.build();
  return useSandboxManager.getState().createSession(template);
}

/**
 * Quick create a React TypeScript sandbox
 */
export function createReactTSSandbox(): string {
  return useSandboxManager.getState().createSession(SANDBOX_TEMPLATES['react-ts']);
}

/**
 * Quick create with Tailwind
 */
export function createReactTailwindSandbox(): string {
  const template = TemplateBuilder.fromReactTS()
    .withTailwind()
    .withName('React + Tailwind', 'React TypeScript with Tailwind CSS')
    .build();
  return useSandboxManager.getState().createSession(template);
}

export default useSandboxManager;
