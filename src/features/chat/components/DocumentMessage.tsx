/**
 * Document Message Component
 *
 * Displays generated documents in chat with enhanced rendering and download options
 * Includes document preview, formatting, and export functionality
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';
import { DocumentActions } from './DocumentActions';
import type { GeneratedDocument } from '../services/document-generation-service';

interface DocumentMessageProps {
  document: GeneratedDocument;
  onEnhance?: (
    enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure'
  ) => void;
  isEnhancing?: boolean;
  className?: string;
}

export const DocumentMessage: React.FC<DocumentMessageProps> = ({
  document,
  onEnhance,
  isEnhancing = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine if document should be expandable (if content is long)
  const shouldBeExpandable = document.content.length > 2000;
  const maxPreviewHeight = isExpanded ? 'none' : '400px';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('my-4 w-full', className)}
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-bold">
                  {document.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {document.metadata.type}
                  </Badge>
                  <span>•</span>
                  <span>{document.metadata.wordCount} words</span>
                  <span>•</span>
                  <span>
                    {document.metadata.generatedAt.toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                  {document.metadata.model && (
                    <>
                      <span>•</span>
                      <span className="font-mono">
                        {document.metadata.model}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Document Actions */}
          <div className="mt-3">
            <DocumentActions
              content={document.content}
              title={document.title}
              author="AGI Agent Automation"
              onEnhance={onEnhance}
              variant="compact"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Document Preview */}
          <ScrollArea
            className={cn(
              'w-full transition-all',
              isFullscreen && 'h-[calc(100vh-300px)]'
            )}
            style={{
              maxHeight: isFullscreen ? undefined : maxPreviewHeight,
            }}
          >
            <div className="p-6">
              {isEnhancing ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">
                      Enhancing document...
                    </p>
                  </div>
                </div>
              ) : (
                <EnhancedMarkdownRenderer
                  content={document.content}
                  enableMath={true}
                  enableCodeCopy={true}
                />
              )}
            </div>
          </ScrollArea>

          {/* Expand/Collapse Button */}
          {shouldBeExpandable && !isFullscreen && (
            <div className="border-t border-border bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full rounded-none py-3 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-3 w-3" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-3 w-3" />
                    Show More
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DocumentMessage;
