/**
 * FileTreeView - Project file browser and management
 * Shows file structure with actions (view, download, delete)
 */

import React, { useState } from 'react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: Date;
  children?: FileItem[];
}

interface FileTreeItemProps {
  item: FileItem;
  level: number;
  onFileClick: (item: FileItem) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
}

function FileTreeItem({
  item,
  level,
  onFileClick,
  onDownload,
  onDelete,
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const [isHovered, setIsHovered] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted transition-colors rounded-md cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Expand/Collapse & Icon */}
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0"
            onClick={() => {
              if (item.type === 'folder') {
                setIsOpen(!isOpen);
              } else {
                onFileClick(item);
              }
            }}
          >
            {item.type === 'folder' ? (
              <>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                )}
                {isOpen ? (
                  <FolderOpen className="w-4 h-4 shrink-0 text-blue-500" />
                ) : (
                  <Folder className="w-4 h-4 shrink-0 text-blue-500" />
                )}
              </>
            ) : (
              <>
                <div className="w-3.5" />
                <File className="w-4 h-4 shrink-0 text-muted-foreground" />
              </>
            )}

            <span className="text-sm truncate">{item.name}</span>

            {item.type === 'file' && item.size && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(item.size)}
              </span>
            )}
          </div>

          {/* Actions */}
          {item.type === 'file' && isHovered && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClick(item);
                }}
                className="h-6 w-6 p-0"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(item);
                }}
                className="h-6 w-6 p-0"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {item.type === 'folder' && isOpen && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onFileClick={onFileClick}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreeView() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock file tree - will be replaced with real project files
  const mockFileTree: FileItem[] = [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: [
            {
              id: '3',
              name: 'App.tsx',
              type: 'file',
              path: 'src/components/App.tsx',
              size: 2048,
              modified: new Date(),
            },
            {
              id: '4',
              name: 'Header.tsx',
              type: 'file',
              path: 'src/components/Header.tsx',
              size: 1536,
              modified: new Date(),
            },
          ],
        },
        {
          id: '5',
          name: 'utils',
          type: 'folder',
          path: 'src/utils',
          children: [
            {
              id: '6',
              name: 'helpers.ts',
              type: 'file',
              path: 'src/utils/helpers.ts',
              size: 1024,
              modified: new Date(),
            },
          ],
        },
        {
          id: '7',
          name: 'index.tsx',
          type: 'file',
          path: 'src/index.tsx',
          size: 512,
          modified: new Date(),
        },
      ],
    },
    {
      id: '8',
      name: 'public',
      type: 'folder',
      path: 'public',
      children: [
        {
          id: '9',
          name: 'index.html',
          type: 'file',
          path: 'public/index.html',
          size: 768,
          modified: new Date(),
        },
      ],
    },
    {
      id: '10',
      name: 'package.json',
      type: 'file',
      path: 'package.json',
      size: 1280,
      modified: new Date(),
    },
    {
      id: '11',
      name: 'README.md',
      type: 'file',
      path: 'README.md',
      size: 2560,
      modified: new Date(),
    },
  ];

  const handleFileClick = (item: FileItem) => {
    // TODO: Open file in editor view
  };

  const handleDownload = (item: FileItem) => {
    // TODO: Download file
  };

  const handleDelete = (item: FileItem) => {
    // TODO: Confirm and delete file
  };

  const totalFiles = (items: FileItem[]): number => {
    return items.reduce((acc, item) => {
      if (item.type === 'file') return acc + 1;
      if (item.children) return acc + totalFiles(item.children);
      return acc;
    }, 0);
  };

  const fileCount = totalFiles(mockFileTree);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Project Files</h3>
            <Badge variant="secondary" className="text-xs">
              {fileCount} files
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {mockFileTree.map((item) => (
            <FileTreeItem
              key={item.id}
              item={item}
              level={0}
              onFileClick={handleFileClick}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
