/**
 * Document Actions Component
 *
 * Provides download options and actions for generated documents
 * Supports MD, PDF, and DOCX export formats
 */

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@shared/ui/dropdown-menu';
import { Button } from '@shared/ui/button';
import {
  Download,
  FileText,
  FileCode,
  File,
  Copy,
  Check,
  Edit,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { documentExportService } from '../services/document-export-service';
import type { DocumentFormat } from '../services/document-generation-service';
import { cn } from '@shared/lib/utils';

interface DocumentActionsProps {
  content: string;
  title?: string;
  author?: string;
  onEnhance?: (enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure') => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  content,
  title = 'document',
  author,
  onEnhance,
  className,
  variant = 'default',
}) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleExport = async (format: DocumentFormat) => {
    setExporting(true);
    try {
      const filename = title.toLowerCase().replace(/\s+/g, '-');
      const options = {
        title,
        author,
      };

      await documentExportService.exportDocument(
        content,
        format,
        filename,
        options
      );

      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: content,
        });
        toast.success('Shared successfully');
      } else {
        // Fallback: copy to clipboard
        await handleCopyToClipboard();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyToClipboard}
          className="h-8 px-2"
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={exporting}
              className="h-8 px-2"
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('markdown')}>
              <FileText className="mr-2 h-4 w-4" />
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <File className="mr-2 h-4 w-4" />
              PDF (.pdf)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('docx')}>
              <FileCode className="mr-2 h-4 w-4" />
              Word (.docx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2',
        className
      )}
    >
      {/* Copy to Clipboard */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyToClipboard}
        className="h-8"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </>
        )}
      </Button>

      {/* Export Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            className="h-8"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Download'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('markdown')}>
            <FileText className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Markdown</span>
              <span className="text-xs text-muted-foreground">.md file</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <File className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>PDF</span>
              <span className="text-xs text-muted-foreground">
                Portable document
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('docx')}>
            <FileCode className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Word Document</span>
              <span className="text-xs text-muted-foreground">
                .docx format
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Enhancement Options (if callback provided) */}
      {onEnhance && (
        <>
          <div className="h-6 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Edit className="mr-2 h-4 w-4" />
                Enhance
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>AI Enhancement</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEnhance('proofread')}>
                <Check className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Proofread</span>
                  <span className="text-xs text-muted-foreground">
                    Fix errors
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEnhance('expand')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Expand</span>
                  <span className="text-xs text-muted-foreground">
                    Add details
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEnhance('summarize')}>
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Summarize</span>
                  <span className="text-xs text-muted-foreground">
                    Make concise
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEnhance('restructure')}>
                <Edit className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Restructure</span>
                  <span className="text-xs text-muted-foreground">
                    Better flow
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {/* Share (if supported) */}
      {navigator.share && (
        <>
          <div className="h-6 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </>
      )}
    </div>
  );
};

export default DocumentActions;
