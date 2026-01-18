/**
 * CodeEditorPanel - Monaco code editor with file tabs
 *
 * Redesigned with:
 * - Proper dialogs instead of browser prompt/confirm
 * - Clean file tree sidebar
 * - Tab-based file editing
 */

import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as Monaco from 'monaco-editor';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/alert-dialog';
import {
  File,
  Folder,
  X,
  Copy,
  Check,
  Download,
  Plus,
  Save,
  LayoutTemplate,
  FilePlus,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { vibeFileSystem } from '@features/vibe/services/vibe-file-system';
import { FileTreeView } from './FileTreeView';
import { VibeTemplateSelector } from '../VibeTemplateSelector';
import JSZip from 'jszip';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface CreateDialogState {
  open: boolean;
  type: 'file' | 'folder';
  parentPath: string;
  name: string;
}

interface DeleteDialogState {
  open: boolean;
  path: string;
  name: string;
}

function CodeEditorPanelContent() {
  const [editorInstance, setEditorInstance] =
    useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState(vibeFileSystem.getFileTree());
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Dialog states
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    open: false,
    type: 'file',
    parentPath: '/',
    name: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    path: '',
    name: '',
  });

  const refreshFileTree = useCallback(() => {
    setFileTree(vibeFileSystem.getFileTree());
  }, []);

  useEffect(() => {
    refreshFileTree();
  }, [refreshFileTree]);

  const currentFile = currentFilePath ? openFiles.get(currentFilePath) : null;

  const handleFileClick = useCallback(
    (path: string) => {
      try {
        if (openFiles.has(path)) {
          setCurrentFilePath(path);
          return;
        }

        const content = vibeFileSystem.readFile(path);
        const file = vibeFileSystem.openFile(path);

        const openFile: OpenFile = {
          path,
          content,
          language: file.language || 'plaintext',
          isDirty: false,
        };

        setOpenFiles((prev) => new Map(prev).set(path, openFile));
        setCurrentFilePath(path);
      } catch (error) {
        toast.error('Failed to open file');
        console.error('[VIBE] Failed to open file', error);
      }
    },
    [openFiles]
  );

  const handleCloseFile = useCallback(
    (path: string) => {
      setOpenFiles((prev) => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });

      vibeFileSystem.closeFile(path);

      if (currentFilePath === path) {
        const remaining = Array.from(openFiles.keys()).filter(
          (p) => p !== path
        );
        setCurrentFilePath(remaining.length > 0 ? remaining[0] : null);
      }
    },
    [currentFilePath, openFiles]
  );

  const handleSaveFile = useCallback(
    (path: string) => {
      const file = openFiles.get(path);
      if (!file) return;

      try {
        vibeFileSystem.updateFile(path, file.content);
        vibeFileSystem.markClean(path);

        setOpenFiles((prev) => {
          const next = new Map(prev);
          const updated = next.get(path);
          if (updated) {
            updated.isDirty = false;
          }
          return next;
        });

        toast.success('File saved');
      } catch (error) {
        toast.error('Failed to save file');
        console.error('[VIBE] Failed to save file', error);
      }
    },
    [openFiles]
  );

  const handleCopyCode = async () => {
    if (currentFile?.content) {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (currentFilePath && currentFile) {
      const blob = new Blob([currentFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFilePath.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && currentFilePath) {
        setOpenFiles((prev) => {
          const next = new Map(prev);
          const file = next.get(currentFilePath);
          if (file) {
            file.content = value;
            file.isDirty = true;
          }
          return next;
        });
      }
    },
    [currentFilePath]
  );

  // Open create dialog
  const handleFileCreate = useCallback(
    (parentPath: string, type: 'file' | 'folder') => {
      setCreateDialog({
        open: true,
        type,
        parentPath,
        name: '',
      });
    },
    []
  );

  // Confirm create
  const handleCreateConfirm = useCallback(() => {
    const { type, parentPath, name } = createDialog;
    if (!name.trim()) return;

    try {
      const newPath = `${parentPath === '/' ? '' : parentPath}/${name.trim()}`;

      if (type === 'file') {
        vibeFileSystem.createFile(newPath, '');
        handleFileClick(newPath);
      } else {
        vibeFileSystem.createFolder(newPath);
      }

      refreshFileTree();
      toast.success(`${type === 'file' ? 'File' : 'Folder'} created`);
      setCreateDialog((prev) => ({ ...prev, open: false, name: '' }));
    } catch (error) {
      toast.error(`Failed to create ${type}`);
      console.error('[VIBE] Failed to create', error);
    }
  }, [createDialog, handleFileClick, refreshFileTree]);

  // Open delete dialog
  const handleFileDelete = useCallback((path: string) => {
    const name = path.split('/').pop() || path;
    setDeleteDialog({ open: true, path, name });
  }, []);

  // Confirm delete
  const handleDeleteConfirm = useCallback(() => {
    const { path } = deleteDialog;
    try {
      vibeFileSystem.deleteFile(path);
      handleCloseFile(path);
      refreshFileTree();
      toast.success('Deleted');
      setDeleteDialog({ open: false, path: '', name: '' });
    } catch (error) {
      toast.error('Failed to delete');
      console.error('[VIBE] Failed to delete file', error);
    }
  }, [deleteDialog, handleCloseFile, refreshFileTree]);

  const handleFileRename = useCallback(
    (path: string, newName: string) => {
      try {
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const newPath = `${parentPath === '/' ? '' : parentPath}/${newName}`;

        vibeFileSystem.renameFile(path, newPath);

        if (openFiles.has(path)) {
          const file = openFiles.get(path)!;
          setOpenFiles((prev) => {
            const next = new Map(prev);
            next.delete(path);
            next.set(newPath, { ...file, path: newPath });
            return next;
          });

          if (currentFilePath === path) {
            setCurrentFilePath(newPath);
          }
        }

        refreshFileTree();
        toast.success('Renamed');
      } catch (error) {
        toast.error('Failed to rename');
        console.error('[VIBE] Failed to rename file', error);
      }
    },
    [currentFilePath, openFiles, refreshFileTree]
  );

  const handleFileDownload = useCallback((path: string) => {
    try {
      const content = vibeFileSystem.readFile(path);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download');
      console.error('[VIBE] Failed to download file', error);
    }
  }, []);

  const handleExportAllAsZip = useCallback(async () => {
    try {
      const zip = new JSZip();
      const allFiles = vibeFileSystem.searchFiles('');

      if (allFiles.length === 0) {
        toast.info('No files to export');
        return;
      }

      for (const file of allFiles) {
        try {
          const content = vibeFileSystem.readFile(file.path);
          const zipPath = file.path.startsWith('/')
            ? file.path.slice(1)
            : file.path;
          zip.file(zipPath, content);
        } catch (error) {
          console.error(`Failed to add ${file.path} to ZIP:`, error);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibe-project-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allFiles.length} files`);
    } catch (error) {
      toast.error('Failed to export');
      console.error('[VIBE] Failed to export files as ZIP', error);
    }
  }, []);

  return (
    <div className="flex h-full bg-background">
      {/* File Tree Sidebar */}
      {showFileTree && (
        <div className="w-56 border-r border-border bg-muted/20">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              FILES
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowTemplateSelector(true)}
                aria-label="New from template"
              >
                <LayoutTemplate className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleExportAllAsZip}
                aria-label="Export as ZIP"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleFileCreate('/', 'file')}
                aria-label="New file"
              >
                <FilePlus className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleFileCreate('/', 'folder')}
                aria-label="New folder"
              >
                <FolderPlus className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {fileTree.length === 0 ? (
            <div className="flex h-[calc(100%-41px)] flex-col items-center justify-center p-4 text-center">
              <Folder
                className="mb-2 h-8 w-8 text-muted-foreground/40"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">No files yet</p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Create a file or use a template
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100%-41px)]">
              <div className="p-2">
                <FileTreeView
                  tree={fileTree}
                  selectedPath={currentFilePath}
                  onFileClick={handleFileClick}
                  onFileCreate={handleFileCreate}
                  onFileDelete={handleFileDelete}
                  onFileRename={handleFileRename}
                  onFileDownload={handleFileDownload}
                />
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Editor Area */}
      <div className="flex flex-1 flex-col">
        {/* File Tabs */}
        {openFiles.size > 0 && (
          <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 py-1">
            {!showFileTree && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowFileTree(true)}
                aria-label="Show file tree"
              >
                <Folder className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
            {Array.from(openFiles.entries()).map(([path, file]) => (
              <div
                key={path}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2.5 py-1 text-xs transition-colors',
                  currentFilePath === path
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50'
                )}
              >
                <button
                  onClick={() => setCurrentFilePath(path)}
                  className="flex items-center gap-1.5"
                  aria-label={`Open ${path.split('/').pop()}${file.isDirty ? ' (unsaved changes)' : ''}`}
                  aria-current={currentFilePath === path ? 'true' : undefined}
                >
                  <File className="h-3 w-3" aria-hidden="true" />
                  <span className="max-w-[100px] truncate">
                    {path.split('/').pop()}
                  </span>
                  {file.isDirty && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      aria-label="Unsaved changes"
                    />
                  )}
                </button>
                <button
                  onClick={() => handleCloseFile(path)}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={`Close ${path.split('/').pop()}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        {currentFilePath && currentFile && (
          <div className="flex items-center justify-between border-b border-border bg-background px-3 py-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{currentFilePath}</span>
              <span className="text-muted-foreground/50">
                {currentFile.language}
              </span>
              {currentFile.isDirty && (
                <span className="text-orange-500">● Modified</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {currentFile.isDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSaveFile(currentFilePath)}
                  className="h-7 text-xs"
                >
                  <Save className="mr-1 h-3 w-3" aria-hidden="true" />
                  Save
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-7 text-xs"
              >
                {copied ? (
                  <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                ) : (
                  <Copy className="mr-1 h-3 w-3" aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 text-xs"
              >
                <Download className="mr-1 h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* Monaco Editor */}
        {currentFilePath && currentFile ? (
          <div className="flex-1">
            <Editor
              height="100%"
              language={currentFile.language}
              value={currentFile.content}
              onChange={handleEditorChange}
              theme="vs-dark"
              onMount={setEditorInstance}
              options={{
                fontSize: 13,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                lineNumbers: 'on',
                minimap: { enabled: true, maxColumn: 80 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                folding: true,
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/10">
            <div className="text-center">
              <File
                className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">No file selected</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Select a file from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog
        open={createDialog.open}
        onOpenChange={(open) =>
          setCreateDialog((prev) => ({ ...prev, open, name: '' }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create {createDialog.type === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
            <DialogDescription>
              Enter a name for the new {createDialog.type}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={createDialog.name}
              onChange={(e) =>
                setCreateDialog((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={
                createDialog.type === 'file' ? 'filename.tsx' : 'folder-name'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateConfirm();
                if (e.key === 'Escape')
                  setCreateDialog((prev) => ({ ...prev, open: false }));
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCreateDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConfirm}
              disabled={!createDialog.name.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteDialog.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Selector */}
      <VibeTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onTemplateSelected={(templateId) => {
          console.log('[VIBE] Template selected:', templateId);
          refreshFileTree();
        }}
      />
    </div>
  );
}

/**
 * CodeEditorPanel - Monaco code editor with error boundary protection
 */
export function CodeEditorPanel() {
  return (
    <ErrorBoundary compact componentName="Code Editor">
      <CodeEditorPanelContent />
    </ErrorBoundary>
  );
}
