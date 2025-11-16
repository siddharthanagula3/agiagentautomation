/**
 * FileSelector Component
 * File/folder picker triggered by @ in input
 * Features: Browse files, search, keyboard navigation, multi-select
 */

import React, { useState, useMemo } from 'react';
import { Search, File, Folder, FileText, Image, Code, CheckCircle2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  lastModified?: Date;
}

export interface FileSelectorProps {
  files: FileItem[];
  query?: string;
  selectedFiles?: string[];
  multiSelect?: boolean;
  onSelect: (file: FileItem) => void;
  onClose?: () => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  files,
  query = '',
  selectedFiles = [],
  multiSelect = false,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState(query);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return files.filter(
      (file) =>
        file.name.toLowerCase().includes(lowerQuery) ||
        file.path.toLowerCase().includes(lowerQuery)
    );
  }, [files, searchQuery]);

  // Group files by type
  const groupedFiles = useMemo(() => {
    const groups: Record<string, FileItem[]> = {
      folders: [],
      documents: [],
      images: [],
      code: [],
      other: [],
    };

    filteredFiles.forEach((file) => {
      if (file.type === 'folder') {
        groups.folders.push(file);
      } else {
        const category = categorizeFile(file);
        groups[category].push(file);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [filteredFiles]);

  const handleSelect = (file: FileItem) => {
    onSelect(file);
    if (!multiSelect) {
      onClose?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  const isSelected = (fileId: string) => selectedFiles.includes(fileId);

  return (
    <Command
      className="rounded-lg border shadow-md"
      onKeyDown={handleKeyDown}
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search files and folders..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="h-9"
      />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No files found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term
            </p>
          </div>
        </CommandEmpty>

        {groupedFiles.map(([groupName, groupFiles]) => (
          <CommandGroup key={groupName} heading={formatGroupName(groupName)}>
            {groupFiles.map((file) => {
              const FileIcon = getFileIcon(file);
              const selected = isSelected(file.id);

              return (
                <CommandItem
                  key={file.id}
                  value={file.path}
                  onSelect={() => handleSelect(file)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <FileIcon className={cn(
                      'h-5 w-5',
                      file.type === 'folder' ? 'text-amber-500' : 'text-muted-foreground'
                    )} />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm truncate',
                        selected ? 'font-medium' : 'font-normal'
                      )}>
                        {file.name}
                      </span>
                      {selected && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {formatPath(file.path)}
                      </p>
                      {file.size && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File Type Badge */}
                  {file.type === 'file' && file.mimeType && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                      {getFileExtension(file.name)}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>

      {/* Footer with selection count */}
      {multiSelect && selectedFiles.length > 0 && (
        <div className="border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
          </p>
        </div>
      )}
    </Command>
  );
};

/**
 * Get appropriate icon for file type
 */
function getFileIcon(file: FileItem) {
  if (file.type === 'folder') {
    return Folder;
  }

  const ext = getFileExtension(file.name).toLowerCase();

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb'].includes(ext)) {
    return Code;
  }

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
    return Image;
  }

  // Document files
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
    return FileText;
  }

  return File;
}

/**
 * Categorize file for grouping
 */
function categorizeFile(file: FileItem): string {
  const ext = getFileExtension(file.name).toLowerCase();

  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'html', 'css'].includes(ext)) {
    return 'code';
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
    return 'images';
  }

  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
    return 'documents';
  }

  return 'other';
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Format group name
 */
function formatGroupName(groupName: string): string {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1);
}

/**
 * Format file path (shorten if too long)
 */
function formatPath(path: string): string {
  if (path.length <= 40) {
    return path;
  }

  const parts = path.split('/');
  if (parts.length <= 2) {
    return path;
  }

  return `.../${parts.slice(-2).join('/')}`;
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
