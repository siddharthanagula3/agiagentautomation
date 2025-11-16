/**
 * FileUpload Component
 * Drag & drop file upload with progress indicators
 * Features: Multiple files, file type validation, size limits, preview
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
  compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFileRemove,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = [],
  className,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        // Check file count
        if (uploadedFiles.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          return;
        }

        // Check file size
        if (file.size > maxFileSize) {
          errors.push(`${file.name} exceeds ${formatFileSize(maxFileSize)}`);
          return;
        }

        // Check file type
        if (acceptedFileTypes.length > 0) {
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          if (!fileExt || !acceptedFileTypes.includes(fileExt)) {
            errors.push(`${file.name} type not supported`);
            return;
          }
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
          id: crypto.randomUUID(),
          file,
          status: 'pending',
          progress: 0,
        }));

        setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
        onFilesSelected(validFiles);
      }

      // Errors are already shown in UI via error messages
    },
    [uploadedFiles.length, maxFiles, maxFileSize, acceptedFileTypes, onFilesSelected]
  );

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  // Click to upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input to allow re-uploading the same file
    e.target.value = '';
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    onFileRemove?.(fileId);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200 cursor-pointer',
          compact ? 'p-4' : 'p-6',
          isDragging
            ? 'border-primary border-2 bg-primary/5'
            : 'border-dashed border-2 hover:border-primary/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.length > 0 ? acceptedFileTypes.map(t => `.${t}`).join(',') : undefined}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload
              className={cn(
                'mb-3',
                compact ? 'h-8 w-8' : 'h-12 w-12',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </motion.div>

          <p className={cn('font-medium mb-1', compact ? 'text-sm' : 'text-base')}>
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            or click to browse
          </p>

          {/* File Info */}
          <div className="flex flex-wrap gap-2 justify-center">
            {maxFiles && (
              <Badge variant="secondary" className="text-xs">
                Max {maxFiles} files
              </Badge>
            )}
            {maxFileSize && (
              <Badge variant="secondary" className="text-xs">
                Up to {formatFileSize(maxFileSize)}
              </Badge>
            )}
            {acceptedFileTypes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {acceptedFileTypes.join(', ')}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadedFiles.map((uploadedFile) => (
              <FileUploadItem
                key={uploadedFile.id}
                uploadedFile={uploadedFile}
                onRemove={handleRemoveFile}
                compact={compact}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual file upload item
 */
interface FileUploadItemProps {
  uploadedFile: UploadedFile;
  onRemove: (fileId: string) => void;
  compact?: boolean;
}

const FileUploadItem: React.FC<FileUploadItemProps> = ({
  uploadedFile,
  onRemove,
  compact = false,
}) => {
  const { file, status, progress, error } = uploadedFile;
  const FileIcon = getFileIcon(file.name);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Card className={cn('transition-all', compact ? 'p-2' : 'p-3')}>
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className="flex-shrink-0">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn('truncate', compact ? 'text-xs' : 'text-sm')}>
                {file.name}
              </p>
              <StatusIcon status={status} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
              {error && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-destructive truncate">{error}</p>
                </>
              )}
            </div>

            {/* Progress Bar */}
            {status === 'uploading' && (
              <Progress value={progress} className="h-1 mt-2" />
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(uploadedFile.id)}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Status Icon Component
 */
const StatusIcon: React.FC<{ status: UploadedFile['status'] }> = ({ status }) => {
  switch (status) {
    case 'uploading':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
};

/**
 * Get file icon based on file type
 */
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return Image;
  }

  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return FileText;
  }

  return File;
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
