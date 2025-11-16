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

function FileTreeItem({ item, level, onFileClick, selectedFile }: FileTreeItemProps) {
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
          'w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted transition-colors',
          selectedFile === item.path && 'bg-primary/10 text-primary font-medium'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {item.type === 'folder' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
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
    <div className="h-full flex">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-background">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Project Files</h3>
        </div>
        {fileTree.length === 0 ? (
          <div className="h-[calc(100%-49px)] flex items-center justify-center p-4 text-center text-xs text-muted-foreground">
            <div>
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-60" />
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
      <div className="flex-1 flex flex-col">
        {/* Open Files Tabs */}
        {editorState.openFiles.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-800 bg-muted/30">
            {editorState.openFiles.map((file) => (
              <div
                key={file}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors group',
                  editorState.currentFile === file
                    ? 'bg-background border border-border'
                    : 'hover:bg-background/50'
                )}
              >
                <button
                  onClick={() => setCurrentFile(file)}
                  className="flex items-center gap-2"
                >
                  <File className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">
                    {file.split('/').pop()}
                  </span>
                </button>
                <button
                  onClick={() => closeFileInStore(file)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Editor Toolbar */}
        {editorState.currentFile && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-background">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {editorState.currentFile}
              </span>
              {followingAgent && (
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 text-xs">
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
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
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
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
            </div>
          </div>
        )}

        {loadError && (
          <div className="px-4 py-2 text-xs text-destructive bg-destructive/5">
            {loadError}
          </div>
        )}

        {/* Monaco Editor */}
        {editorState.currentFile ? (
          <div className="flex-1 relative">
            {isFetchingFile && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
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
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <File className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Select a file to view or edit
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Files will appear here as agents work
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
