/**
 * LivePreviewPanel - Live preview with multiple engines
 * Real-time preview of generated applications
 * Inspired by Bolt.new and Replit preview experiences
 *
 * Supports two preview modes:
 * 1. Sandpack (default) - Open source browser-native execution, works in Safari/iOS
 * 2. Classic iframe - Simple HTML/CSS/JS with build service for React
 *
 * Sandpack chosen for 2026 because:
 * - Open source (Apache 2.0) - important for the project
 * - Safari/iOS support (no SharedArrayBuffer requirement)
 * - Battle-tested by CodeSandbox (millions of users)
 * - WASI 0.3 roadmap ready
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { supabase } from '@shared/lib/supabase-client';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
  Hammer,
  Sparkles,
  Layers,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { vibeFileSystem } from '@features/vibe/services/vibe-file-system';
import { toast } from 'sonner';
import { SandpackPreviewPanel } from './SandpackPreviewPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

// Build service API endpoint
const BUILD_SERVICE_URL = '/.netlify/functions/utilities/vibe-build';

interface BuildResult {
  success: boolean;
  html?: string;
  error?: string;
  warnings?: string[];
  buildTime?: number;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportDimensions = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet (768×1024)' },
  mobile: { width: '375px', height: '667px', label: 'Mobile (375×667)' },
};

/**
 * Detect project type based on files
 */
function detectProjectType(): 'react' | 'typescript' | 'html' {
  const allFiles = vibeFileSystem.listFiles('/');

  const hasReact = allFiles.some(
    (f) =>
      f.path.endsWith('.tsx') ||
      f.path.endsWith('.jsx') ||
      f.path.includes('App.tsx') ||
      f.path.includes('main.tsx')
  );

  if (hasReact) return 'react';

  const hasTypeScript = allFiles.some((f) => f.path.endsWith('.ts'));
  if (hasTypeScript) return 'typescript';

  return 'html';
}

/**
 * Collect all files from file system for build service
 */
function collectFilesForBuild(): Record<string, string> {
  const files: Record<string, string> = {};
  const allFiles = vibeFileSystem.listFiles('/');

  for (const file of allFiles) {
    if (file.type === 'file') {
      try {
        const content = vibeFileSystem.readFile(file.path);
        files[file.path] = content;
      } catch (error) {
        console.error(`Failed to read file ${file.path}:`, error);
      }
    }
  }

  return files;
}

/**
 * Get the current user's auth token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Call the build service to compile React/TypeScript
 */
async function buildWithService(
  files: Record<string, string>,
  projectType: 'react' | 'typescript' | 'html'
): Promise<BuildResult> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return {
        success: false,
        error: 'Authentication required for build service',
      };
    }

    const response = await fetch(BUILD_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        files,
        projectType,
      }),
    });

    const result = await response.json();
    return result as BuildResult;
  } catch (error) {
    console.error('Build service error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Build service unavailable',
    };
  }
}

/**
 * Generate HTML preview from file system (for simple HTML projects)
 */
function generateHtmlPreview(): string | null {
  try {
    // Look for HTML entry point
    let htmlContent = '';

    try {
      htmlContent = vibeFileSystem.readFile('/index.html');
    } catch {
      try {
        htmlContent = vibeFileSystem.readFile('/public/index.html');
      } catch {
        // No HTML file found
        return null;
      }
    }

    // Collect CSS files
    const cssFiles: string[] = [];
    const allFiles = vibeFileSystem.searchFiles('.css');
    for (const file of allFiles) {
      try {
        const content = vibeFileSystem.readFile(file.path);
        cssFiles.push(content);
      } catch (error) {
        console.error('Failed to read CSS file:', error);
      }
    }

    // Collect JS files (only .js, not .ts/.tsx)
    const jsFiles: string[] = [];
    const jsFilesList = vibeFileSystem.searchFiles('.js');
    for (const file of jsFilesList) {
      // Skip .ts and .tsx files
      if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) continue;
      try {
        const content = vibeFileSystem.readFile(file.path);
        jsFiles.push(content);
      } catch (error) {
        console.error('Failed to read JS file:', error);
      }
    }

    // Inject CSS and JS into HTML
    let processedHtml = htmlContent;

    // Inject CSS
    if (cssFiles.length > 0) {
      const cssTag = `<style>\n${cssFiles.join('\n\n')}\n</style>`;
      processedHtml = processedHtml.replace('</head>', `${cssTag}\n</head>`);
    }

    // Inject JS (as module to support imports)
    if (jsFiles.length > 0) {
      const jsTag = `<script type="module">\n${jsFiles.join('\n\n')}\n</script>`;
      processedHtml = processedHtml.replace('</body>', `${jsTag}\n</body>`);
    }

    return processedHtml;
  } catch (error) {
    console.error('Failed to generate HTML preview:', error);
    return null;
  }
}

export type PreviewMode = 'sandpack' | 'classic';

interface LivePreviewPanelProps {
  defaultMode?: PreviewMode;
}

function LivePreviewPanelContent({
  defaultMode = 'sandpack',
}: LivePreviewPanelProps) {
  const { appViewerState, setViewport, setAppViewerUrl } = useVibeViewStore();
  const [previewMode, setPreviewMode] = useState<PreviewMode>(defaultMode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleMessage[]>([]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [autoPreview, setAutoPreview] = useState(true);
  const [projectType, setProjectType] = useState<
    'react' | 'typescript' | 'html'
  >('html');
  const [lastBuildTime, setLastBuildTime] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Track refresh timeout for cleanup - must be declared before any early returns
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper functions (defined before hooks that use them)
  const addConsoleMessage = useCallback((message: ConsoleMessage) => {
    setConsoleOutput((prev) => [...prev.slice(-99), message]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleOutput([]);
  }, []);

  // Preview URL calculation
  const previewUrl =
    appViewerState.url ||
    (generatedHtml
      ? 'data:text/html;charset=utf-8,' + encodeURIComponent(generatedHtml)
      : 'about:blank');
  const currentViewport = viewportDimensions[appViewerState.viewport];

  // Auto-generate preview when files change
  useEffect(() => {
    if (!autoPreview) return;
    if (previewMode === 'sandpack') return; // Skip in sandpack mode

    const html = generateHtmlPreview();
    if (html) {
      setGeneratedHtml(html);
      addConsoleMessage({
        type: 'info',
        message: 'Preview updated from file system',
        timestamp: new Date(),
      });
    }
  }, [autoPreview, previewMode, addConsoleMessage]);

  // Listen for console messages from iframe (if supported)
  useEffect(() => {
    if (previewMode === 'sandpack') return; // Skip in sandpack mode

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        addConsoleMessage({
          type: event.data.level || 'log',
          message: event.data.message,
          timestamp: new Date(),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewMode, addConsoleMessage]);

  // Generate preview callback
  const handleGeneratePreview = useCallback(async () => {
    // Detect project type
    const detectedType = detectProjectType();
    setProjectType(detectedType);

    addConsoleMessage({
      type: 'info',
      message: `Detected project type: ${detectedType}`,
      timestamp: new Date(),
    });

    // For React/TypeScript, use the build service
    if (detectedType === 'react' || detectedType === 'typescript') {
      setIsBuilding(true);
      addConsoleMessage({
        type: 'info',
        message: `Building ${detectedType} project...`,
        timestamp: new Date(),
      });

      try {
        const files = collectFilesForBuild();
        const result = await buildWithService(files, detectedType);

        if (result.success && result.html) {
          setGeneratedHtml(result.html);
          setLastBuildTime(result.buildTime || null);
          toast.success(`Build completed in ${result.buildTime}ms`);
          addConsoleMessage({
            type: 'info',
            message: `Build successful (${result.buildTime}ms)`,
            timestamp: new Date(),
          });

          // Show warnings if any
          if (result.warnings && result.warnings.length > 0) {
            for (const warning of result.warnings) {
              addConsoleMessage({
                type: 'warn',
                message: warning,
                timestamp: new Date(),
              });
            }
          }
        } else {
          toast.error(result.error || 'Build failed');
          addConsoleMessage({
            type: 'error',
            message: result.error || 'Build failed',
            timestamp: new Date(),
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Build error: ${errorMessage}`);
        addConsoleMessage({
          type: 'error',
          message: `Build error: ${errorMessage}`,
          timestamp: new Date(),
        });
      } finally {
        setIsBuilding(false);
      }
    } else {
      // For HTML projects, use simple injection
      const html = generateHtmlPreview();
      if (html) {
        setGeneratedHtml(html);
        toast.success('Preview generated from files');
        addConsoleMessage({
          type: 'info',
          message: 'Generated preview from file system',
          timestamp: new Date(),
        });
      } else {
        toast.error('No HTML file found in project');
        addConsoleMessage({
          type: 'error',
          message: 'Failed to find index.html or public/index.html',
          timestamp: new Date(),
        });
      }
    }
  }, [addConsoleMessage]);

  // Cleanup timeouts on unmount - must be before early returns
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Use Sandpack mode by default for better browser support
  if (previewMode === 'sandpack') {
    return (
      <div className="flex h-full flex-col bg-background">
        {/* Mode Toggle Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Preview Engine</span>
          </div>
          <Tabs
            value={previewMode}
            onValueChange={(v) => setPreviewMode(v as PreviewMode)}
          >
            <TabsList className="h-7">
              <TabsTrigger value="sandpack" className="h-5 gap-1 px-2 text-xs">
                <Sparkles className="h-3 w-3" />
                Sandpack
              </TabsTrigger>
              <TabsTrigger value="classic" className="h-5 gap-1 px-2 text-xs">
                <Layers className="h-3 w-3" />
                Classic
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-hidden">
          <SandpackPreviewPanel />
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Regenerate HTML from file system
    const html = generateHtmlPreview();
    if (html) {
      setGeneratedHtml(html);
      toast.success('Preview refreshed');
    } else {
      // Fall back to reloading iframe
      if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = currentSrc;
      }
    }

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLoadUrl = () => {
    if (customUrl.trim()) {
      setAppViewerUrl(customUrl.trim());
      setCustomUrl('');
    }
  };

  const handleOpenExternal = () => {
    if (previewUrl !== 'about:blank') {
      window.open(previewUrl, '_blank');
    }
  };

  // Classic preview mode (iframe-based with build service)
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Mode Toggle Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">Preview Engine</span>
        </div>
        <Tabs
          value={previewMode}
          onValueChange={(v) => setPreviewMode(v as PreviewMode)}
        >
          <TabsList className="h-7">
            <TabsTrigger value="sandpack" className="h-5 gap-1 px-2 text-xs">
              <Sparkles className="h-3 w-3" />
              Sandpack
            </TabsTrigger>
            <TabsTrigger value="classic" className="h-5 gap-1 px-2 text-xs">
              <Layers className="h-3 w-3" />
              Classic
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Viewport Selector */}
            {(['desktop', 'tablet', 'mobile'] as ViewportSize[]).map(
              (viewport) => {
                const Icon =
                  viewport === 'desktop'
                    ? Monitor
                    : viewport === 'tablet'
                      ? Tablet
                      : Smartphone;
                return (
                  <Button
                    key={viewport}
                    variant={
                      appViewerState.viewport === viewport ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() => setViewport(viewport)}
                    className="h-7 text-xs"
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {viewportDimensions[viewport].label.split(' ')[0]}
                    </span>
                  </Button>
                );
              }
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Project Type Badge */}
            {projectType !== 'html' && (
              <Badge variant="outline" className="h-6 text-xs">
                {projectType === 'react' ? '⚛️ React' : '📘 TS'}
              </Badge>
            )}

            {/* Build/Generate Preview */}
            <Button
              variant="default"
              size="sm"
              onClick={handleGeneratePreview}
              disabled={isBuilding}
              className="h-7 text-xs"
            >
              {isBuilding ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Building...
                </>
              ) : projectType === 'react' || projectType === 'typescript' ? (
                <>
                  <Hammer className="mr-1.5 h-3.5 w-3.5" />
                  Build
                </>
              ) : (
                <>
                  <Monitor className="mr-1.5 h-3.5 w-3.5" />
                  Generate
                </>
              )}
            </Button>

            {/* Console Toggle */}
            <Button
              variant={showConsole ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowConsole(!showConsole)}
              className="h-7 text-xs"
            >
              <Terminal className="mr-1.5 h-3.5 w-3.5" />
              Console
              {consoleOutput.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                  {consoleOutput.length}
                </Badge>
              )}
            </Button>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 text-xs"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
              />
            </Button>

            {/* Open External */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenExternal}
              disabled={previewUrl === 'about:blank'}
              className="h-7 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
            placeholder="Enter URL (e.g., http://localhost:3000)"
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            onClick={handleLoadUrl}
            disabled={!customUrl.trim()}
            className="h-7 text-xs"
          >
            Load
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div
        className={cn(
          'flex-1 overflow-auto bg-gradient-to-br from-muted/20 to-muted/40',
          showConsole && 'flex-[0.6]'
        )}
      >
        {previewUrl === 'about:blank' ? (
          <EmptyPreviewState />
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <div
              className="relative overflow-hidden rounded-lg border border-border bg-background shadow-2xl transition-all duration-300"
              style={{
                width: currentViewport.width,
                height: currentViewport.height,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {/* Loading Overlay */}
              {appViewerState.isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Loading preview...
                    </span>
                  </div>
                </div>
              )}

              {/* Preview iframe */}
              <iframe
                ref={iframeRef}
                key={isRefreshing ? Date.now() : previewUrl}
                src={previewUrl}
                className="h-full w-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                onLoad={() => {
                  setIsRefreshing(false);
                  // Could update loading state here
                }}
                onError={() => {
                  addConsoleMessage({
                    type: 'error',
                    message: 'Failed to load preview',
                    timestamp: new Date(),
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Console Output */}
      {showConsole && (
        <div
          className={cn(
            'flex flex-col border-t border-border bg-black/95',
            'flex-[0.4]'
          )}
        >
          {/* Console Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-semibold text-white">Console</span>
              {consoleOutput.length > 0 && (
                <Badge variant="secondary" className="h-4 text-xs">
                  {consoleOutput.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConsole}
                className="h-6 text-xs text-white hover:bg-white/10"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConsole(false)}
                className="h-6 w-6 text-white hover:bg-white/10"
                aria-label="Close console"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Console Messages */}
          <ScrollArea className="flex-1">
            <div className="space-y-0.5 p-2 font-mono text-xs">
              {consoleOutput.length === 0 ? (
                <div className="flex h-full items-center justify-center py-8 text-gray-500">
                  <span>Console output will appear here</span>
                </div>
              ) : (
                consoleOutput.map((msg, msgIndex) => (
                  <ConsoleMessageRow
                    key={`console-${msgIndex}-${msg.type}-${msg.timestamp || Date.now()}`}
                    message={msg}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/**
 * LivePreviewPanel - Live preview with error boundary protection
 */
export function LivePreviewPanel(props: LivePreviewPanelProps) {
  return (
    <ErrorBoundary compact componentName="Live Preview">
      <LivePreviewPanelContent {...props} />
    </ErrorBoundary>
  );
}

// Empty state component
function EmptyPreviewState() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <Monitor className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-40" />
        <h3 className="mb-2 text-sm font-medium text-foreground">
          No preview available
        </h3>
        <p className="mb-1 text-xs text-muted-foreground">
          Enter a URL above or wait for the agent to generate a preview
        </p>
        <p className="text-xs text-muted-foreground/70">
          Live previews appear here in real-time
        </p>
      </div>
    </div>
  );
}

// Console message types
interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

function ConsoleMessageRow({ message }: { message: ConsoleMessage }) {
  const iconMap = {
    log: { icon: '>', color: 'text-gray-400' },
    info: { icon: 'ℹ', color: 'text-blue-400' },
    warn: { icon: '⚠', color: 'text-yellow-400' },
    error: { icon: '✕', color: 'text-red-400' },
  };

  const config = iconMap[message.type];

  return (
    <div className="flex items-start gap-2 rounded px-2 py-1 hover:bg-white/5">
      <span className={cn('shrink-0', config.color)}>{config.icon}</span>
      <span className="flex-1 break-all text-gray-300">{message.message}</span>
      <span className="shrink-0 text-gray-600">
        {message.timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
}
