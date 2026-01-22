/**
 * SandpackPreviewPanel - Browser-native code execution using Sandpack
 *
 * Open source solution (Apache 2.0) from CodeSandbox
 * Works in all browsers including Safari/iOS
 * Full React/TypeScript support with hot reload
 *
 * Chosen for 2026 because:
 * - Open source (user's requirement)
 * - Safari/iOS support (critical for mobile)
 * - Battle-tested by millions of CodeSandbox users
 * - WASI 0.3 roadmap ready
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  SandpackLayout,
  useSandpack,
  SandpackThemeProvider,
} from '@codesandbox/sandpack-react';
import type {
  SandpackFiles,
  SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Loader2,
  Terminal,
  X,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { vibeFileSystem } from '@features/vibe/services/vibe-file-system';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shared/ui/dropdown-menu';

// Sandpack dark theme matching our UI
const vibeDarkTheme = {
  colors: {
    surface1: '#1e1e1e',
    surface2: '#252526',
    surface3: '#2d2d2d',
    clickable: '#999999',
    base: '#808080',
    disabled: '#4d4d4d',
    hover: '#c5c5c5',
    accent: '#7c3aed',
    error: '#ef4444',
    errorSurface: '#3c1a1a',
  },
  syntax: {
    plain: '#d4d4d4',
    comment: { color: '#6a9955', fontStyle: 'italic' },
    keyword: '#569cd6',
    tag: '#4ec9b0',
    punctuation: '#808080',
    definition: '#dcdcaa',
    property: '#9cdcfe',
    static: '#b5cea8',
    string: '#ce9178',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "JetBrains Mono", Menlo, Monaco, monospace',
    size: '13px',
    lineHeight: '20px',
  },
};

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportDimensions = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' },
};

interface SandpackPreviewPanelProps {
  className?: string;
  onError?: (error: string) => void;
}

/**
 * Convert vibeFileSystem files to Sandpack format
 */
function collectSandpackFiles(): SandpackFiles {
  const files: SandpackFiles = {};
  const allFiles = vibeFileSystem.listFiles('/');

  for (const file of allFiles) {
    if (file.type === 'file') {
      try {
        const content = vibeFileSystem.readFile(file.path);
        // Sandpack needs paths without leading slash for some files
        const sandpackPath = file.path.startsWith('/')
          ? file.path
          : `/${file.path}`;
        files[sandpackPath] = { code: content };
      } catch (error) {
        console.error(`Failed to read file ${file.path}:`, error);
      }
    }
  }

  return files;
}

/**
 * Detect the appropriate Sandpack template based on files
 */
function detectTemplate(files: SandpackFiles): SandpackPredefinedTemplate {
  const filePaths = Object.keys(files);

  // Check for React
  const hasReact = filePaths.some(
    (f) =>
      f.endsWith('.tsx') ||
      f.endsWith('.jsx') ||
      f.includes('App.tsx') ||
      f.includes('App.jsx')
  );
  if (hasReact) return 'react-ts';

  // Check for vanilla TypeScript
  const hasTs = filePaths.some(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts')
  );
  if (hasTs) return 'vanilla-ts';

  // Check for Vue
  const hasVue = filePaths.some((f) => f.endsWith('.vue'));
  if (hasVue) return 'vue-ts';

  // Check for Svelte
  const hasSvelte = filePaths.some((f) => f.endsWith('.svelte'));
  if (hasSvelte) return 'svelte';

  // Default to vanilla HTML/CSS/JS
  return 'vanilla';
}

/**
 * Ensure required entry files exist for the template
 */
function ensureEntryFiles(
  files: SandpackFiles,
  template: SandpackPredefinedTemplate
): SandpackFiles {
  const result = { ...files };

  if (template === 'react-ts') {
    // Ensure index.html exists
    if (!result['/index.html'] && !result['/public/index.html']) {
      result['/index.html'] = {
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vibe App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      };
    }

    // Ensure main entry exists
    if (
      !result['/index.tsx'] &&
      !result['/src/index.tsx'] &&
      !result['/main.tsx'] &&
      !result['/src/main.tsx']
    ) {
      result['/index.tsx'] = {
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);`,
      };
    }

    // Ensure App component exists
    if (!result['/App.tsx'] && !result['/src/App.tsx']) {
      result['/App.tsx'] = {
        code: `import React from 'react';

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome to Vibe</h1>
      <p className="text-gray-600">Start building your app!</p>
    </div>
  );
}`,
      };
    }
  }

  return result;
}

/**
 * Custom hook to sync Sandpack with vibeFileSystem
 */
function useSandpackSync() {
  const { sandpack } = useSandpack();

  // Watch for file changes and update Sandpack
  useEffect(() => {
    const handleFileChange = () => {
      const newFiles = collectSandpackFiles();
      Object.entries(newFiles).forEach(([path, content]) => {
        if (typeof content === 'object' && 'code' in content) {
          sandpack.updateFile(path, content.code);
        }
      });
    };

    // Subscribe to file system changes (simplified - could add actual subscription)
    const interval = setInterval(handleFileChange, 2000);
    return () => clearInterval(interval);
  }, [sandpack]);

  return sandpack;
}

/**
 * Inner preview component with Sandpack context
 */
function SandpackPreviewInner({ showConsole }: { showConsole: boolean }) {
  useSandpackSync();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex-1', showConsole && 'flex-[0.65]')}>
        <SandpackPreview
          showNavigator={false}
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          style={{ height: '100%' }}
        />
      </div>
      {showConsole && (
        <div className="flex-[0.35] border-t border-border">
          <SandpackConsole style={{ height: '100%' }} showHeader={false} />
        </div>
      )}
    </div>
  );
}

export function SandpackPreviewPanel({
  className,
  onError,
}: SandpackPreviewPanelProps) {
  const { appViewerState, setViewport } = useVibeViewStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sandpackKey, setSandpackKey] = useState(0);

  // Collect files from vibeFileSystem
  // sandpackKey is used to trigger re-computation when user clicks refresh
  // This is intentional: sandpackKey changes -> useMemo recomputes -> new files collected
  const files = useMemo(() => {
    // Using void to acknowledge sandpackKey is intentionally a trigger dependency
    void sandpackKey;
    const collected = collectSandpackFiles();
    const template = detectTemplate(collected);
    return ensureEntryFiles(collected, template);
  }, [sandpackKey]);

  const template = useMemo(() => detectTemplate(files), [files]);
  const currentViewport = viewportDimensions[appViewerState.viewport];
  const hasFiles = Object.keys(files).length > 0;

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setSandpackKey((k) => k + 1);
    toast.success('Preview refreshed');
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const handleOpenExternal = useCallback(() => {
    // Sandpack doesn't have direct external URL, but we can generate one
    toast.info('Use "Open in CodeSandbox" for external preview');
  }, []);

  // If no files, show empty state
  if (!hasFiles) {
    return (
      <div className={cn('flex h-full flex-col bg-background', className)}>
        <PreviewToolbar
          viewport={appViewerState.viewport}
          onViewportChange={setViewport}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          showConsole={showConsole}
          onToggleConsole={() => setShowConsole(!showConsole)}
          onOpenExternal={handleOpenExternal}
          template={template}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
        />
        <EmptyPreviewState />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-background',
        className,
        isFullscreen && 'fixed inset-0 z-modal'
      )}
    >
      <PreviewToolbar
        viewport={appViewerState.viewport}
        onViewportChange={setViewport}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        showConsole={showConsole}
        onToggleConsole={() => setShowConsole(!showConsole)}
        onOpenExternal={handleOpenExternal}
        template={template}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
      />

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="flex h-full items-center justify-center p-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg border border-border bg-background shadow-2xl transition-all duration-300',
              isFullscreen && 'rounded-none border-0'
            )}
            style={{
              width: isFullscreen ? '100%' : currentViewport.width,
              height: isFullscreen ? '100%' : currentViewport.height,
              maxWidth: isFullscreen ? '100%' : '100%',
              maxHeight: isFullscreen ? '100%' : '100%',
            }}
          >
            <SandpackProvider
              key={sandpackKey}
              template={template}
              files={files}
              theme={vibeDarkTheme}
              options={{
                autorun: autoRefresh,
                autoReload: autoRefresh,
                recompileMode: 'delayed',
                recompileDelay: 500,
                initMode: 'immediate',
                bundlerURL: undefined, // Use default bundler
              }}
              customSetup={{
                dependencies: {
                  react: '^18.2.0',
                  'react-dom': '^18.2.0',
                  'lucide-react': '^0.400.0',
                },
              }}
            >
              <SandpackPreviewInner showConsole={showConsole} />
            </SandpackProvider>

            {/* Refreshing overlay */}
            {isRefreshing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Refreshing...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Toolbar component
 */
interface PreviewToolbarProps {
  viewport: ViewportSize;
  onViewportChange: (viewport: ViewportSize) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  showConsole: boolean;
  onToggleConsole: () => void;
  onOpenExternal: () => void;
  template: SandpackPredefinedTemplate;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
}

function PreviewToolbar({
  viewport,
  onViewportChange,
  onRefresh,
  isRefreshing,
  showConsole,
  onToggleConsole,
  onOpenExternal,
  template,
  isFullscreen,
  onToggleFullscreen,
  autoRefresh,
  onAutoRefreshChange,
}: PreviewToolbarProps) {
  return (
    <div className="border-b border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Viewport Selector */}
          {(['desktop', 'tablet', 'mobile'] as ViewportSize[]).map((vp) => {
            const Icon =
              vp === 'desktop'
                ? Monitor
                : vp === 'tablet'
                  ? Tablet
                  : Smartphone;
            return (
              <Button
                key={vp}
                variant={viewport === vp ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewportChange(vp)}
                className="h-7 text-xs"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {viewportDimensions[vp].label}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          {/* Template Badge */}
          <Badge variant="outline" className="h-6 gap-1 text-xs">
            <Zap className="h-3 w-3" />
            {template === 'react-ts'
              ? 'React'
              : template === 'vanilla-ts'
                ? 'TypeScript'
                : template}
          </Badge>

          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onAutoRefreshChange(!autoRefresh)}
            className="h-7 text-xs"
          >
            {autoRefresh ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Console Toggle */}
          <Button
            variant={showConsole ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleConsole}
            className="h-7 text-xs"
          >
            <Terminal className="mr-1.5 h-3.5 w-3.5" />
            Console
          </Button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
            />
          </Button>

          {/* Fullscreen */}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="h-7 text-xs"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenExternal}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in CodeSandbox
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onAutoRefreshChange(!autoRefresh)}
              >
                {autoRefresh ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {autoRefresh ? 'Disable' : 'Enable'} Auto Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state when no files
 */
function EmptyPreviewState() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Monitor className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-sm font-medium text-foreground">
          No preview available
        </h3>
        <p className="mb-1 text-xs text-muted-foreground">
          Start building to see your app come to life
        </p>
        <p className="text-xs text-muted-foreground/70">
          Powered by Sandpack (open source, works everywhere)
        </p>
      </div>
    </div>
  );
}
