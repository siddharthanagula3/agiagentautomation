import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Download,
  Copy,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Artifact } from '@/services/artifact-service';

interface ArtifactViewerProps {
  artifact: Artifact;
  onClose?: () => void;
  className?: string;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  artifact,
  onClose,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    const getExtension = () => {
      switch (artifact.type) {
        case 'code':
          return 'js';
        case 'html':
          return 'html';
        case 'markdown':
          return 'md';
        case 'json':
          return 'json';
        case 'svg':
          return 'svg';
        case 'csv':
          return 'csv';
        default:
          return 'txt';
      }
    };

    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_')}.${getExtension()}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Artifact downloaded');
  };

  const getIcon = () => {
    switch (artifact.type) {
      case 'code':
        return <Code className="h-5 w-5" />;
      case 'html':
        return <FileText className="h-5 w-5" />;
      case 'svg':
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'chart':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const renderPreview = () => {
    if (showRaw) {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap bg-background/50 p-4 rounded-lg border overflow-auto">
          {artifact.content}
        </pre>
      );
    }

    switch (artifact.type) {
      case 'html':
        return (
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={artifact.content}
              className="w-full h-full min-h-[400px]"
              sandbox="allow-scripts"
              title={artifact.title}
            />
          </div>
        );

      case 'svg':
        return (
          <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
            <div dangerouslySetInnerHTML={{ __html: artifact.content }} />
          </div>
        );

      case 'markdown':
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert bg-background/50 p-4 rounded-lg border">
            <div dangerouslySetInnerHTML={{
              __html: artifact.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code>$1</code>')
                .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
                .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
                .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
                .replace(/\n/g, '<br />')
            }} />
          </div>
        );

      case 'json':
        try {
          const formatted = JSON.stringify(JSON.parse(artifact.content), null, 2);
          return (
            <pre className="text-sm font-mono whitespace-pre-wrap bg-background/50 p-4 rounded-lg border overflow-auto">
              {formatted}
            </pre>
          );
        } catch {
          return (
            <pre className="text-sm font-mono whitespace-pre-wrap bg-background/50 p-4 rounded-lg border overflow-auto">
              {artifact.content}
            </pre>
          );
        }

      case 'code':
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap bg-background/50 p-4 rounded-lg border overflow-auto">
            <code>{artifact.content}</code>
          </pre>
        );

      case 'chart':
        return (
          <div className="p-4 bg-background/50 rounded-lg border">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Chart visualization would render here</p>
              <p className="text-xs mt-1">Using Chart.js or Recharts</p>
            </div>
          </div>
        );

      default:
        return (
          <pre className="text-sm font-mono whitespace-pre-wrap bg-background/50 p-4 rounded-lg border overflow-auto">
            {artifact.content}
          </pre>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn('my-3', className)}
    >
      <Card className="border-2 border-primary/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 rounded-lg bg-primary/20"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h4 className="font-semibold">{artifact.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {artifact.type}
                  </Badge>
                  {artifact.metadata?.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {artifact.metadata.createdAt.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                title={showRaw ? 'Show preview' : 'Show raw content'}
              >
                {showRaw ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Raw
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          'p-4 transition-all duration-300 overflow-auto',
          isExpanded ? 'max-h-[800px]' : 'max-h-[400px]'
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={showRaw ? 'raw' : 'preview'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPreview()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
          <div className="p-3 bg-muted/30 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {Object.entries(artifact.metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// Gallery view for multiple artifacts
interface ArtifactGalleryProps {
  artifacts: Artifact[];
  onSelectArtifact?: (artifact: Artifact) => void;
  className?: string;
}

export const ArtifactGallery: React.FC<ArtifactGalleryProps> = ({
  artifacts,
  onSelectArtifact,
  className
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {artifacts.map((artifact, idx) => (
        <motion.div
          key={artifact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card
            className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
            onClick={() => onSelectArtifact?.(artifact)}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                {artifact.type === 'code' && <Code className="h-5 w-5 text-primary" />}
                {artifact.type === 'html' && <FileText className="h-5 w-5 text-primary" />}
                {(artifact.type === 'svg' || artifact.type === 'image') && <ImageIcon className="h-5 w-5 text-primary" />}
                {artifact.type === 'chart' && <BarChart3 className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {artifact.title}
                </h5>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {artifact.type}
                  </Badge>
                  {artifact.metadata?.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {artifact.metadata.createdAt.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ArtifactViewer;
