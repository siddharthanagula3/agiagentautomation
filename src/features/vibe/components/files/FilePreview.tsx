/**
 * FilePreview Component
 * Inline file preview with syntax highlighting for code
 * Supports: images, text, code, PDFs, and more
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  File,
  FileText,
  Image as ImageIcon,
  Code,
  Download,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { cn } from '@/shared/lib/utils';

export interface FilePreviewProps {
  file: {
    name: string;
    path: string;
    type: string;
    size: number;
    url?: string;
    content?: string;
  };
  onClose?: () => void;
  onDownload?: () => void;
  onOpen?: () => void;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  onDownload,
  onOpen,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileType = getFileType(file.name, file.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={className}
    >
      <Card className={cn('overflow-hidden', isExpanded && 'fixed inset-4 z-50')}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* File Icon */}
            <FileTypeIcon type={fileType} className="h-5 w-5 flex-shrink-0" />

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  {getFileExtension(file.name)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onDownload && (
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onOpen && (
              <Button variant="ghost" size="sm" onClick={onOpen}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
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
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className={cn(isExpanded ? 'h-[calc(100%-4rem)]' : 'max-h-96')}>
          {renderPreview(file, fileType, isExpanded)}
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Render preview based on file type
 */
function renderPreview(
  file: FilePreviewProps['file'],
  fileType: string,
  isExpanded: boolean
) {
  switch (fileType) {
    case 'image':
      return (
        <div className="flex items-center justify-center p-4 bg-muted/20">
          <img
            src={file.url}
            alt={file.name}
            className={cn(
              'max-w-full object-contain',
              isExpanded ? 'max-h-full' : 'max-h-80'
            )}
          />
        </div>
      );

    case 'code':
      return (
        <ScrollArea className="h-full">
          <pre className="p-4 text-xs font-mono">
            <code>{file.content || 'Loading...'}</code>
          </pre>
        </ScrollArea>
      );

    case 'text':
      return (
        <ScrollArea className="h-full">
          <div className="p-4 text-sm whitespace-pre-wrap">
            {file.content || 'Loading...'}
          </div>
        </ScrollArea>
      );

    case 'pdf':
      return file.url ? (
        <iframe
          src={file.url}
          className="w-full h-full border-0"
          title={file.name}
        />
      ) : (
        <PreviewPlaceholder
          icon={FileText}
          message="PDF preview not available"
          action="Download to view"
        />
      );

    default:
      return (
        <PreviewPlaceholder
          icon={File}
          message="Preview not available"
          action="Download to view this file"
        />
      );
  }
}

/**
 * Preview Placeholder Component
 */
interface PreviewPlaceholderProps {
  icon: React.ElementType;
  message: string;
  action?: string;
}

const PreviewPlaceholder: React.FC<PreviewPlaceholderProps> = ({
  icon: Icon,
  message,
  action,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
    <Icon className="h-12 w-12 text-muted-foreground mb-3" />
    <p className="text-sm font-medium mb-1">{message}</p>
    {action && <p className="text-xs text-muted-foreground">{action}</p>}
  </div>
);

/**
 * File Type Icon Component
 */
interface FileTypeIconProps {
  type: string;
  className?: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ type, className }) => {
  switch (type) {
    case 'image':
      return <ImageIcon className={cn('text-blue-500', className)} />;
    case 'code':
      return <Code className={cn('text-green-500', className)} />;
    case 'text':
    case 'pdf':
      return <FileText className={cn('text-amber-500', className)} />;
    default:
      return <File className={cn('text-muted-foreground', className)} />;
  }
};

/**
 * Determine file type for preview
 */
function getFileType(filename: string, mimeType: string): string {
  const ext = getFileExtension(filename).toLowerCase();

  // Image types
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext) ||
    mimeType.startsWith('image/')
  ) {
    return 'image';
  }

  // Code types
  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml'].includes(ext)
  ) {
    return 'code';
  }

  // Text types
  if (
    ['txt', 'md', 'markdown', 'log', 'csv'].includes(ext) ||
    mimeType.startsWith('text/')
  ) {
    return 'text';
  }

  // PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }

  return 'unknown';
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
