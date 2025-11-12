import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Code,
  Eye,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  ExternalLink,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';

export interface ArtifactVersion {
  id: string;
  content: string;
  timestamp: Date;
  description?: string;
}

export interface ArtifactData {
  id: string;
  type: 'html' | 'react' | 'svg' | 'mermaid' | 'code';
  language?: string;
  title?: string;
  content: string;
  versions?: ArtifactVersion[];
  currentVersion?: number;
}

interface ArtifactPreviewProps {
  artifact: ArtifactData;
  onVersionChange?: (versionIndex: number) => void;
  onShare?: () => void;
  className?: string;
}

/**
 * ArtifactPreview Component - Claude Artifacts-like Live Preview
 *
 * Features:
 * - Live rendering of HTML/React/SVG code
 * - Preview/Code toggle (split view)
 * - Version control with history
 * - Instant sharing
 * - Multiple export formats
 * - Responsive iframe sandbox
 *
 * Dominates ChatGPT Canvas by:
 * - Live interactive preview (Canvas only shows static editor)
 * - Real-time rendering of web apps
 * - Instant version switching
 */
export function ArtifactPreview({
  artifact,
  onVersionChange,
  onShare,
  className,
}: ArtifactPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update iframe content when artifact changes
  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(getPreviewHTML());
        iframeDoc.close();
      }
    }
  }, [artifact.content, artifact.currentVersion, activeTab]);

  const getPreviewHTML = (): string => {
    const content =
      artifact.versions && artifact.currentVersion !== undefined
        ? artifact.versions[artifact.currentVersion].content
        : artifact.content;

    switch (artifact.type) {
      case 'html':
        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: system-ui, -apple-system, sans-serif;
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;

      case 'react':
        // For React, we'd need to transpile JSX - for now, show as HTML
        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      ${content}
    </script>
  </body>
</html>`;

      case 'svg':
        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        margin: 0;
        padding: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;

      case 'mermaid':
        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({ startOnLoad: true });</script>
  </head>
  <body>
    <div class="mermaid">
      ${content}
    </div>
  </body>
</html>`;

      default:
        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: monospace;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>${content}</body>
</html>`;
    }
  };

  const handleCopy = async () => {
    const content =
      artifact.versions && artifact.currentVersion !== undefined
        ? artifact.versions[artifact.currentVersion].content
        : artifact.content;

    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'html' | 'txt' | 'md') => {
    const content =
      artifact.versions && artifact.currentVersion !== undefined
        ? artifact.versions[artifact.currentVersion].content
        : artifact.content;

    let blob: Blob;
    let filename: string;

    switch (format) {
      case 'html':
        blob = new Blob([getPreviewHTML()], { type: 'text/html' });
        filename = `${artifact.title || 'artifact'}.html`;
        break;
      case 'md':
        const markdown = `# ${artifact.title || 'Artifact'}\n\n\`\`\`${artifact.language || artifact.type}\n${content}\n\`\`\``;
        blob = new Blob([markdown], { type: 'text/markdown' });
        filename = `${artifact.title || 'artifact'}.md`;
        break;
      default:
        blob = new Blob([content], { type: 'text/plain' });
        filename = `${artifact.title || 'artifact'}.${artifact.language || 'txt'}`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const html = getPreviewHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(getPreviewHTML());
        iframeDoc.close();
      }
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const canPreview = ['html', 'react', 'svg', 'mermaid'].includes(
    artifact.type
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-lg',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              {artifact.title || 'Artifact'}
            </span>
          </div>
          {artifact.type && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {artifact.type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Version History */}
          {artifact.versions && artifact.versions.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <History className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs">
                    v{(artifact.currentVersion || 0) + 1}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {artifact.versions.map((version, index) => (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={() => onVersionChange?.(index)}
                    className={cn(
                      artifact.currentVersion === index && 'bg-accent'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium">
                        Version {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {version.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span className="ml-1 text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="ml-1 text-xs">Copy</span>
              </>
            )}
          </Button>

          {/* Download Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('html')}>
                Download as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('txt')}>
                Download as {artifact.language?.toUpperCase() || 'TXT'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('md')}>
                Download as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="h-7 px-2"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {canPreview && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-7 px-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewTab}
                className="h-7 px-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="h-7 px-2"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Preview/Code Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}
        className="w-full"
      >
        {canPreview && (
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 px-4">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-3.5 w-3.5" />
              Code
            </TabsTrigger>
          </TabsList>
        )}

        {/* Preview Tab */}
        {canPreview && (
          <TabsContent value="preview" className="m-0 p-0">
            <div
              className={cn(
                'bg-white',
                isFullscreen ? 'h-[calc(100vh-100px)]' : 'h-[500px]'
              )}
            >
              <iframe
                ref={iframeRef}
                title={artifact.title || 'Artifact Preview'}
                sandbox="allow-scripts allow-same-origin"
                className="h-full w-full border-0"
              />
            </div>
          </TabsContent>
        )}

        {/* Code Tab */}
        <TabsContent value="code" className="m-0 p-0">
          <ScrollArea
            className={cn(
              'bg-gray-900',
              isFullscreen ? 'h-[calc(100vh-100px)]' : 'h-[500px]'
            )}
          >
            <pre className="p-4">
              <code className="text-sm text-gray-100">
                {artifact.versions && artifact.currentVersion !== undefined
                  ? artifact.versions[artifact.currentVersion].content
                  : artifact.content}
              </code>
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
