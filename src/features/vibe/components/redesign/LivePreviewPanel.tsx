/**
 * LivePreviewPanel - Live preview with iframe sandbox
 * Real-time preview of generated applications
 * Inspired by Bolt.new and Replit preview experiences
 * Integrated with vibeFileSystem for automatic HTML generation
 */

import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';
import { toast } from 'sonner';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportDimensions = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet (768×1024)' },
  mobile: { width: '375px', height: '667px', label: 'Mobile (375×667)' },
};

/**
 * Generate HTML preview from file system
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

    // Collect JS files
    const jsFiles: string[] = [];
    const jsFilesList = vibeFileSystem.searchFiles('.js');
    for (const file of jsFilesList) {
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

export function LivePreviewPanel() {
  const { appViewerState, setViewport, setAppViewerUrl } = useVibeViewStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleMessage[]>([]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [autoPreview, setAutoPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewUrl = appViewerState.url || (generatedHtml ? 'data:text/html;charset=utf-8,' + encodeURIComponent(generatedHtml) : 'about:blank');
  const currentViewport = viewportDimensions[appViewerState.viewport];

  // Auto-generate preview when files change
  useEffect(() => {
    if (!autoPreview) return;

    const html = generateHtmlPreview();
    if (html) {
      setGeneratedHtml(html);
      addConsoleMessage({
        type: 'info',
        message: 'Preview updated from file system',
        timestamp: new Date(),
      });
    }
  }, [autoPreview]); // Simplified dependency - in real implementation, watch file system changes

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

    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleGeneratePreview = () => {
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

  // Listen for console messages from iframe (if supported)
  useEffect(() => {
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
  }, []);

  const addConsoleMessage = (message: ConsoleMessage) => {
    setConsoleOutput((prev) => [...prev.slice(-99), message]);
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  return (
    <div className="flex h-full flex-col bg-background">
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
            {/* Generate Preview */}
            <Button
              variant="default"
              size="sm"
              onClick={handleGeneratePreview}
              className="h-7 text-xs"
            >
              <Monitor className="mr-1.5 h-3.5 w-3.5" />
              Generate
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
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 px-1 text-xs"
                >
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
              >
                <X className="h-3 w-3" />
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
                consoleOutput.map((msg, idx) => (
                  <ConsoleMessageRow key={idx} message={msg} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
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
