/**
 * Artifact Renderer Component
 * Renders different types of artifacts (code, React, HTML, SVG, etc.)
 */

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Download, Copy, Code, Eye, Edit, Maximize2, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import type { Artifact } from '@_core/api/artifact-service';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ArtifactRendererProps {
  artifact: Artifact;
  onEdit?: (content: string) => void;
  onClose?: () => void;
  className?: string;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifact,
  onEdit,
  onClose,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(artifact.content);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const extension = getFileExtension(artifact);
    const filename = `${artifact.title.replace(/\s+/g, '_')}.${extension}`;
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedContent);
      setIsEditing(false);
      toast.success('Artifact updated');
    }
  };

  const getFileExtension = (artifact: Artifact): string => {
    switch (artifact.type) {
      case 'code':
        return artifact.language || 'txt';
      case 'react':
        return 'jsx';
      case 'html':
        return 'html';
      case 'svg':
        return 'svg';
      case 'markdown':
        return 'md';
      case 'mermaid':
        return 'mmd';
      default:
        return 'txt';
    }
  };

  const renderPreview = () => {
    switch (artifact.type) {
      case 'code':
        return (
          <SyntaxHighlighter
            language={artifact.language || 'text'}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {artifact.content}
          </SyntaxHighlighter>
        );

      case 'html':
        return (
          <iframe
            ref={iframeRef}
            srcDoc={artifact.content}
            className="h-full w-full rounded-lg border-0"
            sandbox="allow-scripts"
            title={artifact.title}
          />
        );

      case 'svg':
        return (
          <div
            className="flex h-full w-full items-center justify-center rounded-lg bg-white"
            dangerouslySetInnerHTML={{ __html: artifact.content }}
          />
        );

      case 'react':
        return (
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              React Component (preview not available)
            </p>
            <SyntaxHighlighter
              language="jsx"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {artifact.content}
            </SyntaxHighlighter>
          </div>
        );

      case 'markdown':
        return (
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-4"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(artifact.content),
            }}
          />
        );

      case 'mermaid':
        return (
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Mermaid Diagram (preview requires mermaid.js)
            </p>
            <SyntaxHighlighter
              language="mermaid"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {artifact.content}
            </SyntaxHighlighter>
          </div>
        );

      default:
        return (
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {artifact.content}
          </pre>
        );
    }
  };

  const renderMarkdown = (markdown: string): string => {
    // Basic markdown rendering (use marked.js in production)
    let html = markdown;
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    return html;
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{artifact.title}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {artifact.type}
                </Badge>
                {artifact.language && (
                  <Badge variant="outline" className="text-xs">
                    {artifact.language}
                  </Badge>
                )}
                {artifact.metadata?.version && (
                  <Badge variant="outline" className="text-xs">
                    v{artifact.metadata.version}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        {isEditing ? (
          <div className="flex h-full flex-col gap-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 resize-none rounded-lg border bg-muted p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}
            className="flex flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4 flex-1 overflow-auto">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="code" className="mt-4 flex-1 overflow-auto">
              <SyntaxHighlighter
                language={artifact.language || 'text'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
                showLineNumbers
              >
                {artifact.content}
              </SyntaxHighlighter>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
