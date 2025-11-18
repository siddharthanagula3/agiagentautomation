/**
 * FileTreeView - Hierarchical file tree component for Vibe editor
 * Displays file system structure with expand/collapse, icons, and context menu
 */

import React, { useState } from 'react';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Download,
  Copy,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@shared/ui/context-menu';
import { toast } from 'sonner';
import type { FileTreeNode as FileNode } from '@features/mission-control/services/vibe-file-system';

interface FileTreeViewProps {
  tree: FileNode[];
  selectedPath: string | null;
  onFileClick: (path: string) => void;
  onFileCreate?: (parentPath: string, type: 'file' | 'folder') => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (path: string, newName: string) => void;
  onFileDownload?: (path: string) => void;
  className?: string;
}

export function FileTreeView({
  tree,
  selectedPath,
  onFileClick,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileDownload,
  className,
}: FileTreeViewProps) {
  return (
    <div className={cn('select-none', className)}>
      {tree.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          level={0}
          selectedPath={selectedPath}
          onFileClick={onFileClick}
          onFileCreate={onFileCreate}
          onFileDelete={onFileDelete}
          onFileRename={onFileRename}
          onFileDownload={onFileDownload}
        />
      ))}
    </div>
  );
}

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  selectedPath: string | null;
  onFileClick: (path: string) => void;
  onFileCreate?: (parentPath: string, type: 'file' | 'folder') => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (path: string, newName: string) => void;
  onFileDownload?: (path: string) => void;
}

function FileTreeItem({
  node,
  level,
  selectedPath,
  onFileClick,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileDownload,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded ?? level === 0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(node.path);
    }
  };

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      onFileRename?.(node.path, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenameValue(node.name);
      setIsRenaming(false);
    }
  };

  const getFileIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? (
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
      ) : (
        <Folder className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
      );
    }

    // File type specific icons
    const ext = node.name.split('.').pop()?.toLowerCase();
    const iconColor = getFileIconColor(ext);

    return <File className={cn('h-3.5 w-3.5 shrink-0', iconColor)} />;
  };

  const getFileIconColor = (ext?: string): string => {
    if (!ext) return 'text-gray-400';

    const colorMap: Record<string, string> = {
      ts: 'text-blue-500',
      tsx: 'text-blue-500',
      js: 'text-yellow-500',
      jsx: 'text-yellow-500',
      html: 'text-orange-500',
      css: 'text-pink-500',
      json: 'text-green-500',
      md: 'text-blue-400',
      py: 'text-blue-600',
      java: 'text-red-500',
      go: 'text-cyan-500',
      rs: 'text-orange-600',
    };

    return colorMap[ext] || 'text-gray-400';
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            onClick={handleClick}
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-muted',
              isSelected && 'bg-primary/10 font-medium text-primary'
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {node.type === 'folder' ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0" />
                )}
              </>
            ) : (
              <div className="w-3" />
            )}

            {getFileIcon()}

            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-xs">{node.name}</span>
            )}
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {node.type === 'folder' && onFileCreate && (
            <>
              <ContextMenuItem
                onClick={() => onFileCreate(node.path, 'file')}
                className="flex items-center gap-2"
              >
                <File className="h-3.5 w-3.5" />
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onFileCreate(node.path, 'folder')}
                className="flex items-center gap-2"
              >
                <Folder className="h-3.5 w-3.5" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          {node.type === 'file' && onFileDownload && (
            <>
              <ContextMenuItem
                onClick={() => onFileDownload(node.path)}
                className="flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(node.path);
                  toast.success('Path copied to clipboard');
                }}
                className="flex items-center gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Path
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          {onFileRename && (
            <ContextMenuItem
              onClick={() => setIsRenaming(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-3.5 w-3.5" />
              Rename
            </ContextMenuItem>
          )}

          {onFileDelete && (
            <ContextMenuItem
              onClick={() => onFileDelete(node.path)}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Children */}
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onFileClick={onFileClick}
              onFileCreate={onFileCreate}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
              onFileDownload={onFileDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
