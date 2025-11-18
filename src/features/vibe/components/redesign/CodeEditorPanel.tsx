/**
 * CodeEditorPanel - Monaco code editor with file tabs
 * Inspired by Bolt.new and Lovable.dev editor experiences
 * Integrated with vibeFileSystem for real file management
 */

import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as Monaco from 'monaco-editor';
import { Button } from '@shared/ui/button';
import { ScrollArea } from '@shared/ui/scroll-area';
import {
  File,
  Folder,
  X,
  Copy,
  Check,
  Download,
  Plus,
  Save,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';
import { FileTreeView } from './FileTreeView';

interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export function CodeEditorPanel() {
  const [editorInstance, setEditorInstance] =
    useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState(vibeFileSystem.getFileTree());

  // Refresh file tree when files change
  const refreshFileTree = useCallback(() => {
    setFileTree(vibeFileSystem.getFileTree());
  }, []);

  // Load file tree on mount
  useEffect(() => {
    refreshFileTree();
  }, [refreshFileTree]);

  const currentFile = currentFilePath ? openFiles.get(currentFilePath) : null;

  const handleFileClick = useCallback((path: string) => {
    try {
      // Check if already open
      if (openFiles.has(path)) {
        setCurrentFilePath(path);
        return;
      }

      // Load file content from file system
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
  }, [openFiles]);

  const handleCloseFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });

    vibeFileSystem.closeFile(path);

    // Switch to another open file if available
    if (currentFilePath === path) {
      const remaining = Array.from(openFiles.keys()).filter((p) => p !== path);
      setCurrentFilePath(remaining.length > 0 ? remaining[0] : null);
    }
  }, [currentFilePath, openFiles]);

  const handleSaveFile = useCallback((path: string) => {
    const file = openFiles.get(path);
    if (!file) return;

    try {
      vibeFileSystem.updateFile(path, file.content);
      vibeFileSystem.markClean(path);

      // Update dirty flag
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
  }, [openFiles]);

  const handleCopyCode = async () => {
    if (currentFile?.content) {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      toast.success('Code copied to clipboard');
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

  const handleEditorChange = useCallback((value: string | undefined) => {
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
  }, [currentFilePath]);

  const handleFileCreate = useCallback((parentPath: string, type: 'file' | 'folder') => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    try {
      const newPath = `${parentPath === '/' ? '' : parentPath}/${name}`;

      if (type === 'file') {
        vibeFileSystem.createFile(newPath, '');
        handleFileClick(newPath);
      } else {
        vibeFileSystem.createFolder(newPath);
      }

      refreshFileTree();
      toast.success(`${type} created`);
    } catch (error) {
      toast.error(`Failed to create ${type}`);
      console.error('[VIBE] Failed to create', error);
    }
  }, [handleFileClick, refreshFileTree]);

  const handleFileDelete = useCallback((path: string) => {
    if (!confirm(`Delete ${path}?`)) return;

    try {
      vibeFileSystem.deleteFile(path);
      handleCloseFile(path);
      refreshFileTree();
      toast.success('File deleted');
    } catch (error) {
      toast.error('Failed to delete file');
      console.error('[VIBE] Failed to delete file', error);
    }
  }, [handleCloseFile, refreshFileTree]);

  const handleFileRename = useCallback((path: string, newName: string) => {
    try {
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const newPath = `${parentPath === '/' ? '' : parentPath}/${newName}`;

      vibeFileSystem.renameFile(path, newPath);

      // Update open files
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
      toast.success('File renamed');
    } catch (error) {
      toast.error('Failed to rename file');
      console.error('[VIBE] Failed to rename file', error);
    }
  }, [currentFilePath, openFiles, refreshFileTree]);

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
      toast.success('File downloaded');
    } catch (error) {
      toast.error('Failed to download file');
      console.error('[VIBE] Failed to download file', error);
    }
  }, []);

  return (
    <div className="flex h-full bg-background">
      {/* File Tree Sidebar - Collapsible */}
      {showFileTree && (
        <div className="w-56 border-r border-border bg-muted/30">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold">FILES</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleFileCreate('/', 'file')}
                title="New File"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowFileTree(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {fileTree.length === 0 ? (
            <div className="flex h-[calc(100%-41px)] items-center justify-center p-4 text-center">
              <div>
                <Folder className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-xs text-muted-foreground">No files yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Files will appear as agents create them
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100%-41px)]">
              <div className="space-y-0.5 p-2">
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
          <div className="flex items-center gap-1 border-b border-border bg-muted/50 px-2 py-1">
            {!showFileTree && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowFileTree(true)}
              >
                <Folder className="h-3.5 w-3.5" />
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
                >
                  <File className="h-3 w-3" />
                  <span className="max-w-[100px] truncate">
                    {path.split('/').pop()}
                  </span>
                  {file.isDirty && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Unsaved changes" />
                  )}
                </button>
                <button
                  onClick={() => handleCloseFile(path)}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
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
              <span className="text-xs text-muted-foreground/60">
                {currentFile.language}
              </span>
              {currentFile.isDirty && (
                <span className="text-xs text-orange-500">● Modified</span>
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
                  <Save className="mr-1 h-3 w-3" />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                Download
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
                lineNumbers: 'on',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
              }}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/20">
            <div className="text-center">
              <File className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                No file selected
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Select a file from the sidebar or ask the agent to create one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
