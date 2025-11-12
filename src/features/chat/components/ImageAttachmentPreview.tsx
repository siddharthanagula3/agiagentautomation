/**
 * Image Attachment Preview Component
 * Displays image attachments in messages with lightbox viewer
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { X, Download, ZoomIn, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageAttachment {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  size: number;
}

interface ImageAttachmentPreviewProps {
  attachments: ImageAttachment[];
  className?: string;
}

export function ImageAttachmentPreview({
  attachments,
  className,
}: ImageAttachmentPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<ImageAttachment | null>(
    null
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (attachment: ImageAttachment) => {
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImageType = (type: string) => {
    return type.startsWith('image/');
  };

  const imageAttachments = attachments.filter((att) => isImageType(att.type));

  if (imageAttachments.length === 0) return null;

  return (
    <>
      <div className={cn('mt-3 space-y-2', className)}>
        {/* Grid layout for multiple images */}
        <div
          className={cn(
            'grid gap-2',
            imageAttachments.length === 1 && 'grid-cols-1',
            imageAttachments.length === 2 && 'grid-cols-2',
            imageAttachments.length >= 3 && 'grid-cols-2 md:grid-cols-3'
          )}
        >
          {imageAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted/30 transition-all hover:border-primary/50"
            >
              {/* Image */}
              <div
                className="relative cursor-pointer overflow-hidden"
                onClick={() => setSelectedImage(attachment)}
              >
                <img
                  src={attachment.thumbnailUrl || attachment.url}
                  alt={attachment.name}
                  className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Image info */}
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" title={attachment.name}>
                    {attachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(attachment);
                    }}
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(attachment.url, '_blank');
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <div className="space-y-4">
              {/* Image */}
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>

              {/* Info and actions */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{selectedImage.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {selectedImage.type}
                    </Badge>
                    <span>{formatFileSize(selectedImage.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedImage.url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
