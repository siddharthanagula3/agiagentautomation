/**
 * EditorView - Monaco code editor with file tree sidebar
 * Real-time code display as agents write code
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Monaco from 'monaco-editor';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Download,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { inferLanguageFromPath } from '../../utils/file-tree';

interface FileTreeItemProps {
  item: {
    id: string;
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: any[];
  };
  level: number;
  onFileClick: (path: string) => void;
  selectedFile: string | null;
}

function FileTreeItem({
  item,
  level,
  onFileClick,
  selectedFile,
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(level === 0);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileClick(item.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted',
          selectedFile === item.path && 'bg-primary/10 font-medium text-primary'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {item.type === 'folder' ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <div className="w-3.5" />
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{item.name}</span>
      </button>

      {item.type === 'folder' && isOpen && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onFileClick={onFileClick}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorView() {
  const editorState = useVibeViewStore((state) => state.editorState);
  const openFileInStore = useVibeViewStore((state) => state.openFile);
  const closeFileInStore = useVibeViewStore((state) => state.closeFile);
  const setCurrentFile = useVibeViewStore((state) => state.setCurrentFile);
  const followingAgent = useVibeViewStore((state) => state.followingAgent);
  const fileTree = useVibeViewStore((state) => state.fileTree);
  const getFileMetadata = useVibeViewStore((state) => state.getFileMetadata);

  const [editorInstance, setEditorInstance] =
    useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleFileClick = useCallback(
    async (path: string) => {
      const metadata = getFileMetadata(path);
      if (!metadata?.url) {
        setLoadError('Unable to locate file contents for the selected path.');
        return;
      }

      setLoadError(null);
      setIsFetchingFile(true);
      try {
        const response = await fetch(metadata.url);
        if (!response.ok) {
          throw new Error(`Unable to load file (${response.status})`);
        }
        const content = await response.text();
        const language =
          metadata.language || inferLanguageFromPath(metadata.path || path);
        openFileInStore(path, content, language);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to open file';
        setLoadError(message);
        console.error('[VIBE] Failed to open file', error);
      } finally {
        setIsFetchingFile(false);
      }
    },
    [getFileMetadata, openFileInStore]
  );

  const handleCopyCode = async () => {
    if (editorState.content) {
      await navigator.clipboard.writeText(editorState.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (editorState.currentFile && editorState.content) {
      const blob = new Blob([editorState.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = editorState.currentFile.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-full">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-background dark:border-gray-800">
        <div className="border-b border-gray-200 p-3 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Project Files</h3>
        </div>
        {fileTree.length === 0 ? (
          <div className="flex h-[calc(100%-49px)] items-center justify-center p-4 text-center text-xs text-muted-foreground">
            <div>
              <Folder className="mx-auto mb-2 h-8 w-8 opacity-60" />
              <p>No files yet.</p>
              <p className="mt-1 opacity-75">
                Agent-created files will appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-49px)]">
            <div className="py-2">
              {fileTree.map((item) => (
                <FileTreeItem
                  key={item.id}
                  item={item}
                  level={0}
                  onFileClick={handleFileClick}
                  selectedFile={editorState.currentFile}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 flex-col">
        {/* Open Files Tabs */}
        {editorState.openFiles.length > 0 && (
          <div className="flex items-center gap-1 border-b border-gray-200 bg-muted/30 px-2 py-1 dark:border-gray-800">
            {editorState.openFiles.map((file) => (
              <div
                key={file}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
                  editorState.currentFile === file
                    ? 'border border-border bg-background'
                    : 'hover:bg-background/50'
                )}
              >
                <button
                  onClick={() => setCurrentFile(file)}
                  className="flex items-center gap-2"
                >
                  <File className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">
                    {file.split('/').pop()}
                  </span>
                </button>
                <button
                  onClick={() => closeFileInStore(file)}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Editor Toolbar */}
        {editorState.currentFile && (
          <div className="flex items-center justify-between border-b border-gray-200 bg-background px-4 py-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {editorState.currentFile}
              </span>
              {followingAgent && (
                <Badge
                  variant="secondary"
                  className="bg-purple-500/10 text-xs text-purple-600"
                >
                  Following Agent
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
        )}

        {loadError && (
          <div className="bg-destructive/5 px-4 py-2 text-xs text-destructive">
            {loadError}
          </div>
        )}

        {/* Monaco Editor */}
        {editorState.currentFile ? (
          <div className="relative flex-1">
            {isFetchingFile && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading file…</span>
                </div>
              </div>
            )}
            <Editor
              height="100%"
              language={editorState.language}
              value={editorState.content}
              theme="vs-dark"
              onMount={setEditorInstance}
              options={{
                readOnly: followingAgent,
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
              }}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <File className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Select a file to view or edit
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Files will appear here as agents work
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
