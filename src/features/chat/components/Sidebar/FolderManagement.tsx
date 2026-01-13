/**
 * FolderManagement - Organize chat sessions into folders
 * Displays folder tree with create/rename/delete capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Badge } from '@shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shared/ui/dropdown-menu';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  folderManagementService,
  type ChatFolder,
} from '../../services/folder-management-service';
import { useAuthStore } from '@shared/stores/authentication-store';

interface FolderManagementProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onMoveSession: (sessionId: string, folderId: string | null) => void;
  className?: string;
}

const FOLDER_COLORS = [
  { value: 'gray', label: 'Gray', class: 'text-gray-500' },
  { value: 'blue', label: 'Blue', class: 'text-blue-500' },
  { value: 'green', label: 'Green', class: 'text-green-500' },
  { value: 'red', label: 'Red', class: 'text-red-500' },
  { value: 'purple', label: 'Purple', class: 'text-purple-500' },
  { value: 'yellow', label: 'Yellow', class: 'text-yellow-500' },
  { value: 'pink', label: 'Pink', class: 'text-pink-500' },
  { value: 'orange', label: 'Orange', class: 'text-orange-500' },
];

export function FolderManagement({
  selectedFolderId,
  onFolderSelect,
  onMoveSession,
  className,
}: FolderManagementProps) {
  const { user } = useAuthStore();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ChatFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<ChatFolder | null>(null);

  // Form state
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('gray');
  const [folderDescription, setFolderDescription] = useState('');

  const loadFolders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userFolders = await folderManagementService.getUserFolders(user.id);

      // Get session counts for each folder
      const foldersWithCounts = await Promise.all(
        userFolders.map(async (folder) => {
          const count = await folderManagementService.getFolderSessionCount(folder.id);
          return { ...folder, sessionCount: count };
        })
      );

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('[FolderManagement] Failed to load folders:', error);
      toast.error('Failed to load folders');
    }
  }, [user?.id]);

  // Load folders
  useEffect(() => {
    if (user?.id) {
      loadFolders();
    }
  }, [user?.id, loadFolders]);

  const handleCreateFolder = async () => {
    if (!user?.id || !folderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      await folderManagementService.createFolder(user.id, {
        name: folderName.trim(),
        color: folderColor,
        description: folderDescription.trim() || undefined,
      });

      toast.success('Folder created');
      setCreateDialogOpen(false);
      setFolderName('');
      setFolderColor('gray');
      setFolderDescription('');
      await loadFolders();
    } catch (error) {
      console.error('[FolderManagement] Failed to create folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !folderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      await folderManagementService.updateFolder(
        editingFolder.id,
        {
          name: folderName.trim(),
          color: folderColor,
          description: folderDescription.trim() || undefined,
        },
        user?.id
      );

      toast.success('Folder updated');
      setEditingFolder(null);
      setFolderName('');
      setFolderColor('gray');
      setFolderDescription('');
      await loadFolders();
    } catch (error) {
      console.error('[FolderManagement] Failed to update folder:', error);
      toast.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;

    try {
      await folderManagementService.deleteFolder(deletingFolder.id, user?.id);

      toast.success('Folder deleted');
      setDeletingFolder(null);
      await loadFolders();

      // If deleted folder was selected, reset selection
      if (selectedFolderId === deletingFolder.id) {
        onFolderSelect(null);
      }
    } catch (error) {
      console.error('[FolderManagement] Failed to delete folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const openEditDialog = (folder: ChatFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderDescription(folder.description || '');
  };

  const openCreateDialog = () => {
    setFolderName('');
    setFolderColor('gray');
    setFolderDescription('');
    setCreateDialogOpen(true);
  };

  const getFolderColorClass = (color: string) => {
    const colorDef = FOLDER_COLORS.find((c) => c.value === color);
    return colorDef?.class || 'text-gray-500';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
          Folders
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={openCreateDialog}
          title="Create folder"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* All Chats (Default View) */}
      <button
        onClick={() => onFolderSelect(null)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
          selectedFolderId === null && 'bg-accent font-medium'
        )}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">All Chats</span>
      </button>

      {/* Folder List */}
      <ScrollArea className="h-auto max-h-[300px]">
        <div className="space-y-1">
          {folders.map((folder) => (
            <div key={folder.id} className="space-y-1">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent group',
                  selectedFolderId === folder.id && 'bg-accent font-medium'
                )}
              >
                {/* Expand/Collapse (if has subfolders - future enhancement) */}
                {/* <button
                  className="flex-shrink-0"
                  onClick={() => toggleFolderExpand(folder.id)}
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button> */}

                {/* Folder Icon and Name */}
                <button
                  onClick={() => onFolderSelect(folder.id)}
                  className="flex flex-1 items-center gap-2 min-w-0"
                >
                  {selectedFolderId === folder.id ? (
                    <FolderOpen
                      className={cn('h-4 w-4 flex-shrink-0', getFolderColorClass(folder.color))}
                    />
                  ) : (
                    <Folder
                      className={cn('h-4 w-4 flex-shrink-0', getFolderColorClass(folder.color))}
                    />
                  )}
                  <span className="truncate">{folder.name}</span>
                  {folder.sessionCount !== undefined && folder.sessionCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0 flex-shrink-0"
                    >
                      {folder.sessionCount}
                    </Badge>
                  )}
                </button>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                      <Edit className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingFolder(folder)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {folders.length === 0 && (
        <div className="px-3 py-6 text-center">
          <Folder className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-30" />
          <p className="text-xs text-muted-foreground">No folders yet</p>
          <Button
            variant="link"
            size="sm"
            onClick={openCreateDialog}
            className="mt-2 text-xs"
          >
            Create your first folder
          </Button>
        </div>
      )}

      {/* Create/Edit Folder Dialog */}
      <Dialog
        open={createDialogOpen || !!editingFolder}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingFolder(null);
            setFolderName('');
            setFolderColor('gray');
            setFolderDescription('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Edit Folder' : 'Create Folder'}
            </DialogTitle>
            <DialogDescription>
              Organize your chat sessions by creating folders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Work, Personal, Projects..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-color">Color</Label>
              <Select value={folderColor} onValueChange={setFolderColor}>
                <SelectTrigger id="folder-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <Folder className={cn('h-4 w-4', color.class)} />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Input
                id="folder-description"
                placeholder="Brief description..."
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingFolder(null);
                setFolderName('');
                setFolderColor('gray');
                setFolderDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingFolder ? handleRenameFolder : handleCreateFolder}
              disabled={!folderName.trim()}
            >
              {editingFolder ? 'Save Changes' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingFolder?.name}"?
              {deletingFolder?.sessionCount && deletingFolder.sessionCount > 0 ? (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-500">
                  This folder contains {deletingFolder.sessionCount} chat session
                  {deletingFolder.sessionCount !== 1 ? 's' : ''}. They will be moved to
                  "All Chats".
                </span>
              ) : (
                <span className="block mt-2">This folder is empty.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFolder(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder}>
              Delete Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
