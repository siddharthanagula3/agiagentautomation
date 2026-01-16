/**
 * AppViewerView - Live application preview with iframe
 * Shows app output with responsive viewport controls
 */

import React, { useState } from 'react';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

// Updated: Jan 15th 2026 - Fixed any type
const viewportSizes = {
  desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: {
    width: '375px',
    height: '667px',
    icon: Smartphone,
    label: 'Mobile',
  },
} as const;

type ViewportKey = keyof typeof viewportSizes;

export function AppViewerView() {
  const { appViewerState, setViewport, setAppViewerUrl } = useVibeViewStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Mock URL - will be replaced with real preview URL
  const previewUrl = appViewerState.url || 'about:blank';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLoadUrl = () => {
    if (customUrl) {
      setAppViewerUrl(customUrl);
    }
  };

  const currentViewport = viewportSizes[appViewerState.viewport];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="space-y-3 border-b border-gray-200 p-3 dark:border-gray-800">
        {/* Viewport Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Object.entries(viewportSizes).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={
                    appViewerState.viewport === key ? 'default' : 'ghost'
                  }
                  size="sm"
                  onClick={() => setViewport(key as ViewportKey)}
                  className="h-8"
                >
                  <Icon className="mr-1.5 h-4 w-4" />
                  {config.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            </Button>
            {previewUrl !== 'about:blank' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(previewUrl, '_blank')}
                className="h-8"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
            placeholder="Enter URL to preview (e.g., http://localhost:3000)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" onClick={handleLoadUrl} className="h-8">
            Load
          </Button>
        </div>

        {/* Info */}
        {previewUrl !== 'about:blank' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {currentViewport.width} × {currentViewport.height}
            </Badge>
            <span className="truncate">{previewUrl}</span>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        {previewUrl === 'about:blank' ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Monitor className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mb-2 text-sm text-muted-foreground">
                No preview available
              </p>
              <p className="text-xs text-muted-foreground">
                Enter a URL or wait for agent to generate a preview
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div
              className="overflow-hidden rounded-lg bg-background shadow-lg transition-all duration-300"
              style={{
                width: currentViewport.width,
                height: currentViewport.height,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {appViewerState.isLoading && (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <iframe
                key={isRefreshing ? Date.now() : previewUrl}
                src={previewUrl}
                className="h-full w-full border-0"
                title="App Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={() => {
                  setIsRefreshing(false);
                  // Update loading state
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
