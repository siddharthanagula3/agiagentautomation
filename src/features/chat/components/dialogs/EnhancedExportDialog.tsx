/**
 * EnhancedExportDialog - Export chat history in multiple formats
 * Supports Markdown, JSON, HTML, PDF, and DOCX
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Label } from '@shared/ui/label';
import { Input } from '@shared/ui/input';
import { Checkbox } from '@shared/ui/checkbox';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  FileText,
  FileJson,
  FileCode,
  Download,
  Check,
  Loader2,
} from 'lucide-react';
import type { ChatSession, ChatMessage } from '../../types';
import { ChatExportService } from '../../services/conversation-export';
import {
  downloadAsMarkdown,
  downloadAsPDF,
  downloadAsDOCX,
} from '../../services/document-export-service';

interface EnhancedExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ChatSession | null;
  messages: ChatMessage[];
}

type ExportFormat = 'markdown' | 'json' | 'html' | 'pdf' | 'docx';

const EXPORT_FORMATS: Array<{
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
  color: string;
}> = [
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Plain text with formatting',
    icon: <FileText className="h-5 w-5" />,
    extension: '.md',
    color: 'text-blue-500',
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Portable document format',
    icon: <FileText className="h-5 w-5" />,
    extension: '.pdf',
    color: 'text-red-500',
  },
  {
    id: 'docx',
    name: 'Word Document',
    description: 'Microsoft Word format',
    icon: <FileText className="h-5 w-5" />,
    extension: '.docx',
    color: 'text-blue-600',
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web page format',
    icon: <FileCode className="h-5 w-5" />,
    extension: '.html',
    color: 'text-orange-500',
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Machine-readable data',
    icon: <FileJson className="h-5 w-5" />,
    extension: '.json',
    color: 'text-green-500',
  },
];

export function EnhancedExportDialog({
  open,
  onOpenChange,
  session,
  messages,
}: EnhancedExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [customFilename, setCustomFilename] = useState('');

  const exportService = new ChatExportService();

  const handleExport = async () => {
    if (!session) {
      toast.error('No session selected');
      return;
    }

    setIsExporting(true);
    try {
      const baseFilename =
        customFilename.trim() ||
        session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const selectedFormatData = EXPORT_FORMATS.find((f) => f.id === selectedFormat);
      const filename = `${baseFilename}${selectedFormatData?.extension || '.txt'}`;

      const options = {
        title: session.title,
        author: 'Chat Session Export',
        metadata: includeMetadata
          ? {
              Created: session.createdAt.toLocaleString(),
              Updated: session.updatedAt.toLocaleString(),
              Messages: messages.length.toString(),
            }
          : undefined,
      };

      switch (selectedFormat) {
        case 'markdown': {
          const content = exportService.exportAsMarkdown(session, messages);
          await downloadAsMarkdown(content, filename, options);
          break;
        }

        case 'pdf': {
          const content = exportService.exportAsMarkdown(session, messages);
          await downloadAsPDF(content, filename, options);
          break;
        }

        case 'docx': {
          const content = exportService.exportAsMarkdown(session, messages);
          await downloadAsDOCX(content, filename, options);
          break;
        }

        case 'html': {
          const content = exportService.exportAsHTML(session, messages);
          const blob = new Blob([content], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }

        case 'json': {
          const content = exportService.exportAsJSON(session, messages);
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
      }

      toast.success(`Exported as ${selectedFormatData?.name}`);
      onOpenChange(false);
    } catch (error) {
      console.error('[Export] Failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormatData = EXPORT_FORMATS.find((f) => f.id === selectedFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Chat History</DialogTitle>
          <DialogDescription>
            Choose a format to export your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent',
                    selectedFormat === format.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent'
                  )}
                >
                  <div className={cn('mt-0.5', format.color)}>{format.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{format.name}</p>
                      {selectedFormat === format.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format.description}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-2">
                      {format.extension}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm">
              Filename (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                placeholder={session?.title || 'chat-export'}
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground shrink-0">
                {selectedFormatData?.extension}
              </span>
            </div>
          </div>

          {/* Export Options */}
          {(selectedFormat === 'markdown' ||
            selectedFormat === 'pdf' ||
            selectedFormat === 'docx') && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Options</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeMetadata}
                    onCheckedChange={(checked) =>
                      setIncludeMetadata(checked === true)
                    }
                  />
                  <span className="text-sm">Include metadata (title, date, message count)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeTimestamps}
                    onCheckedChange={(checked) =>
                      setIncludeTimestamps(checked === true)
                    }
                  />
                  <span className="text-sm">Include message timestamps</span>
                </label>
              </div>
            </div>
          )}

          {/* Preview Info */}
          {session && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2">Export Preview</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  <span className="font-medium">Session:</span> {session.title}
                </p>
                <p>
                  <span className="font-medium">Messages:</span> {messages.length}
                </p>
                <p>
                  <span className="font-medium">Format:</span> {selectedFormatData?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !session}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormatData?.name}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
