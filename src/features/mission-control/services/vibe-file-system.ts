/**
 * Vibe File System Service
 *
 * In-memory file system for the /vibe code editor page.
 * Supports creating, reading, updating, and deleting files and folders.
 * Provides persistence via localStorage and export functionality.
 */

import JSZip from 'jszip';

// ============================================================================
// Types
// ============================================================================

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  language?: string;
  isDirty?: boolean;
  lastModified: Date;
  size?: number;
}

export interface FileSystemState {
  files: Map<string, FileNode>;
  openFiles: Set<string>;
  activeFile: string | null;
  dirtyFiles: Set<string>;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

export type FileSystemError =
  | 'FILE_NOT_FOUND'
  | 'FILE_ALREADY_EXISTS'
  | 'FOLDER_NOT_FOUND'
  | 'FOLDER_ALREADY_EXISTS'
  | 'INVALID_PATH'
  | 'INVALID_OPERATION'
  | 'PERSISTENCE_ERROR';

export class FileSystemException extends Error {
  constructor(
    public code: FileSystemError,
    message: string,
    public path?: string
  ) {
    super(message);
    this.name = 'FileSystemException';
  }
}

// ============================================================================
// File Type Detection
// ============================================================================

const FILE_EXTENSIONS: Record<string, string> = {
  // Web
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',

  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // JSON/Config
  '.json': 'json',
  '.jsonc': 'json',
  '.json5': 'json',

  // Markdown
  '.md': 'markdown',
  '.mdx': 'markdown',

  // Other
  '.xml': 'xml',
  '.svg': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.txt': 'plaintext',
  '.env': 'plaintext',
  '.sh': 'shell',
  '.bash': 'shell',
  '.sql': 'sql',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.php': 'php',
  '.rb': 'ruby',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
};

function detectLanguage(path: string): string {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  return FILE_EXTENSIONS[ext] || 'plaintext';
}

// ============================================================================
// Path Utilities
// ============================================================================

class PathUtils {
  static normalize(path: string): string {
    // Remove trailing slash
    path = path.replace(/\/+$/, '');

    // Ensure leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Remove duplicate slashes
    path = path.replace(/\/+/g, '/');

    // Handle . and ..
    const parts = path.split('/').filter(p => p && p !== '.');
    const normalized: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        normalized.pop();
      } else {
        normalized.push(part);
      }
    }

    return '/' + normalized.join('/');
  }

  static join(...paths: string[]): string {
    return this.normalize(paths.join('/'));
  }

  static dirname(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');

    if (lastSlash <= 0) {
      return '/';
    }

    return normalized.substring(0, lastSlash);
  }

  static basename(path: string): string {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    return normalized.substring(lastSlash + 1);
  }

  static isValid(path: string): boolean {
    if (!path || typeof path !== 'string') return false;
    if (path.includes('//')) return false;
    if (path.includes('\0')) return false;
    return true;
  }

  static getExtension(path: string): string {
    const name = this.basename(path);
    const dotIndex = name.lastIndexOf('.');
    return dotIndex > 0 ? name.substring(dotIndex) : '';
  }
}

// ============================================================================
// Vibe File System Service
// ============================================================================

export class VibeFileSystem {
  private files: Map<string, FileNode> = new Map();
  private openFiles: Set<string> = new Set();
  private activeFile: string | null = null;
  private dirtyFiles: Set<string> = new Set();
  private storageKey = 'vibe-file-system';

  constructor() {
    this.initialize();
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  private initialize(): void {
    // Create root folder
    this.files.set('/', {
      name: '',
      path: '/',
      type: 'folder',
      children: [],
      lastModified: new Date(),
    });

    // Try to load from localStorage
    this.loadFromStorage();

    // If empty, create default project
    if (this.files.size === 1) {
      this.initializeDefaultProject();
    }
  }

  private initializeDefaultProject(): void {
    try {
      // Create basic React project structure
      this.createFolder('/src');
      this.createFolder('/public');

      // Create package.json
      this.createFile('/package.json', JSON.stringify({
        name: 'vibe-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0',
          typescript: '^5.0.0',
          vite: '^5.0.0'
        }
      }, null, 2));

      // Create index.html
      this.createFile('/index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vibe Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

      // Create main.tsx
      this.createFile('/src/main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

      // Create App.tsx
      this.createFile('/src/App.tsx', `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Welcome to Vibe</h1>
      <p>Start building your project!</p>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;`);

      // Create index.css
      this.createFile('/src/index.css', `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: #333;
}

.app {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #007bff;
  color: white;
  cursor: pointer;
  margin-top: 1rem;
}

button:hover {
  background: #0056b3;
}`);

      // Create vite.config.ts
      this.createFile('/vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`);

      // Create tsconfig.json
      this.createFile('/tsconfig.json', JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }]
      }, null, 2));

      // Save to storage
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to initialize default project:', error);
    }
  }

  // --------------------------------------------------------------------------
  // File Operations
  // --------------------------------------------------------------------------

  createFile(path: string, content: string = ''): FileNode {
    const normalizedPath = PathUtils.normalize(path);

    if (!PathUtils.isValid(normalizedPath)) {
      throw new FileSystemException('INVALID_PATH', `Invalid path: ${path}`, path);
    }

    if (this.files.has(normalizedPath)) {
      throw new FileSystemException(
        'FILE_ALREADY_EXISTS',
        `File already exists: ${normalizedPath}`,
        normalizedPath
      );
    }

    // Ensure parent folder exists
    const parentPath = PathUtils.dirname(normalizedPath);
    if (!this.files.has(parentPath)) {
      this.createFolder(parentPath);
    }

    const fileName = PathUtils.basename(normalizedPath);
    const language = detectLanguage(normalizedPath);

    const fileNode: FileNode = {
      name: fileName,
      path: normalizedPath,
      type: 'file',
      content,
      language,
      isDirty: false,
      lastModified: new Date(),
      size: content.length,
    };

    this.files.set(normalizedPath, fileNode);

    // Add to parent's children
    const parent = this.files.get(parentPath);
    if (parent && parent.type === 'folder') {
      if (!parent.children) parent.children = [];
      parent.children.push(fileNode);
      parent.children.sort((a, b) => {
        // Folders first, then alphabetical
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    this.saveToStorage();
    return fileNode;
  }

  readFile(path: string): string {
    const normalizedPath = PathUtils.normalize(path);
    const file = this.files.get(normalizedPath);

    if (!file) {
      throw new FileSystemException(
        'FILE_NOT_FOUND',
        `File not found: ${normalizedPath}`,
        normalizedPath
      );
    }

    if (file.type !== 'file') {
      throw new FileSystemException(
        'INVALID_OPERATION',
        `Cannot read folder as file: ${normalizedPath}`,
        normalizedPath
      );
    }

    return file.content || '';
  }

  updateFile(path: string, content: string): FileNode {
    const normalizedPath = PathUtils.normalize(path);
    const file = this.files.get(normalizedPath);

    if (!file) {
      throw new FileSystemException(
        'FILE_NOT_FOUND',
        `File not found: ${normalizedPath}`,
        normalizedPath
      );
    }

    if (file.type !== 'file') {
      throw new FileSystemException(
        'INVALID_OPERATION',
        `Cannot update folder: ${normalizedPath}`,
        normalizedPath
      );
    }

    const hasChanged = file.content !== content;

    file.content = content;
    file.lastModified = new Date();
    file.size = content.length;

    if (hasChanged) {
      this.dirtyFiles.add(normalizedPath);
      file.isDirty = true;
    }

    this.saveToStorage();
    return file;
  }

  deleteFile(path: string): void {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      throw new FileSystemException(
        'INVALID_OPERATION',
        'Cannot delete root folder',
        normalizedPath
      );
    }

    const file = this.files.get(normalizedPath);

    if (!file) {
      throw new FileSystemException(
        'FILE_NOT_FOUND',
        `File not found: ${normalizedPath}`,
        normalizedPath
      );
    }

    // Remove from parent's children
    const parentPath = PathUtils.dirname(normalizedPath);
    const parent = this.files.get(parentPath);
    if (parent && parent.children) {
      parent.children = parent.children.filter(child => child.path !== normalizedPath);
    }

    // Remove from maps
    this.files.delete(normalizedPath);
    this.openFiles.delete(normalizedPath);
    this.dirtyFiles.delete(normalizedPath);

    if (this.activeFile === normalizedPath) {
      this.activeFile = null;
    }

    this.saveToStorage();
  }

  renameFile(oldPath: string, newPath: string): FileNode {
    const normalizedOldPath = PathUtils.normalize(oldPath);
    const normalizedNewPath = PathUtils.normalize(newPath);

    if (normalizedOldPath === '/') {
      throw new FileSystemException(
        'INVALID_OPERATION',
        'Cannot rename root folder',
        normalizedOldPath
      );
    }

    const file = this.files.get(normalizedOldPath);
    if (!file) {
      throw new FileSystemException(
        'FILE_NOT_FOUND',
        `File not found: ${normalizedOldPath}`,
        normalizedOldPath
      );
    }

    if (this.files.has(normalizedNewPath)) {
      throw new FileSystemException(
        'FILE_ALREADY_EXISTS',
        `File already exists: ${normalizedNewPath}`,
        normalizedNewPath
      );
    }

    // Read content and delete old
    const content = file.content || '';
    this.deleteFile(normalizedOldPath);

    // Create new file
    if (file.type === 'file') {
      return this.createFile(normalizedNewPath, content);
    } else {
      return this.createFolder(normalizedNewPath);
    }
  }

  // --------------------------------------------------------------------------
  // Folder Operations
  // --------------------------------------------------------------------------

  createFolder(path: string): FileNode {
    const normalizedPath = PathUtils.normalize(path);

    if (!PathUtils.isValid(normalizedPath)) {
      throw new FileSystemException('INVALID_PATH', `Invalid path: ${path}`, path);
    }

    if (this.files.has(normalizedPath)) {
      return this.files.get(normalizedPath)!;
    }

    // Create parent folders recursively
    const parentPath = PathUtils.dirname(normalizedPath);
    if (parentPath !== '/' && !this.files.has(parentPath)) {
      this.createFolder(parentPath);
    }

    const folderName = PathUtils.basename(normalizedPath);

    const folderNode: FileNode = {
      name: folderName,
      path: normalizedPath,
      type: 'folder',
      children: [],
      lastModified: new Date(),
    };

    this.files.set(normalizedPath, folderNode);

    // Add to parent's children
    if (parentPath !== normalizedPath) {
      const parent = this.files.get(parentPath);
      if (parent && parent.type === 'folder') {
        if (!parent.children) parent.children = [];
        parent.children.push(folderNode);
        parent.children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      }
    }

    this.saveToStorage();
    return folderNode;
  }

  listFiles(path: string = '/'): string[] {
    const normalizedPath = PathUtils.normalize(path);
    const folder = this.files.get(normalizedPath);

    if (!folder) {
      throw new FileSystemException(
        'FOLDER_NOT_FOUND',
        `Folder not found: ${normalizedPath}`,
        normalizedPath
      );
    }

    if (folder.type !== 'folder') {
      throw new FileSystemException(
        'INVALID_OPERATION',
        `Not a folder: ${normalizedPath}`,
        normalizedPath
      );
    }

    return folder.children?.map(child => child.path) || [];
  }

  // --------------------------------------------------------------------------
  // File Tree
  // --------------------------------------------------------------------------

  getFileTree(): FileTreeNode[] {
    const root = this.files.get('/');
    if (!root || !root.children) return [];

    const buildTree = (node: FileNode): FileTreeNode => {
      const treeNode: FileTreeNode = {
        name: node.name || 'root',
        path: node.path,
        type: node.type,
        language: node.language,
        isExpanded: false,
      };

      if (node.type === 'folder' && node.children) {
        treeNode.children = node.children.map(buildTree);
      }

      return treeNode;
    };

    return root.children.map(buildTree);
  }

  // --------------------------------------------------------------------------
  // File State Management
  // --------------------------------------------------------------------------

  openFile(path: string): FileNode {
    const normalizedPath = PathUtils.normalize(path);
    const file = this.files.get(normalizedPath);

    if (!file) {
      throw new FileSystemException(
        'FILE_NOT_FOUND',
        `File not found: ${normalizedPath}`,
        normalizedPath
      );
    }

    if (file.type !== 'file') {
      throw new FileSystemException(
        'INVALID_OPERATION',
        `Cannot open folder: ${normalizedPath}`,
        normalizedPath
      );
    }

    this.openFiles.add(normalizedPath);
    this.activeFile = normalizedPath;

    return file;
  }

  closeFile(path: string): void {
    const normalizedPath = PathUtils.normalize(path);
    this.openFiles.delete(normalizedPath);

    if (this.activeFile === normalizedPath) {
      // Switch to another open file if available
      const openFilesArray = Array.from(this.openFiles);
      this.activeFile = openFilesArray.length > 0 ? openFilesArray[0] : null;
    }
  }

  markClean(path: string): void {
    const normalizedPath = PathUtils.normalize(path);
    const file = this.files.get(normalizedPath);

    if (file) {
      file.isDirty = false;
      this.dirtyFiles.delete(normalizedPath);
      this.saveToStorage();
    }
  }

  getOpenFiles(): string[] {
    return Array.from(this.openFiles);
  }

  getActiveFile(): string | null {
    return this.activeFile;
  }

  getDirtyFiles(): string[] {
    return Array.from(this.dirtyFiles);
  }

  hasUnsavedChanges(): boolean {
    return this.dirtyFiles.size > 0;
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  searchFiles(query: string): FileNode[] {
    const results: FileNode[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [, file] of this.files) {
      if (file.type === 'file') {
        // Search by filename
        if (file.name.toLowerCase().includes(lowerQuery)) {
          results.push(file);
        }
        // Search by content
        else if (file.content?.toLowerCase().includes(lowerQuery)) {
          results.push(file);
        }
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  private saveToStorage(): void {
    try {
      const state = {
        files: Array.from(this.files.entries()),
        openFiles: Array.from(this.openFiles),
        activeFile: this.activeFile,
        dirtyFiles: Array.from(this.dirtyFiles),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new FileSystemException(
        'PERSISTENCE_ERROR',
        'Failed to save file system state'
      );
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const state = JSON.parse(stored);

      // Restore files map
      this.files = new Map(state.files.map(([path, node]: [string, FileNode]) => {
        // Convert date strings back to Date objects
        node.lastModified = new Date(node.lastModified);
        return [path, node];
      }));

      // Restore sets
      this.openFiles = new Set(state.openFiles);
      this.dirtyFiles = new Set(state.dirtyFiles);
      this.activeFile = state.activeFile;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      // Continue with empty file system
    }
  }

  clearStorage(reinitialize: boolean = true): void {
    localStorage.removeItem(this.storageKey);
    this.files.clear();
    this.openFiles.clear();
    this.dirtyFiles.clear();
    this.activeFile = null;

    if (reinitialize) {
      this.initialize();
    } else {
      // Just create root folder
      this.files.set('/', {
        name: '',
        path: '/',
        type: 'folder',
        children: [],
        lastModified: new Date(),
      });
    }
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------

  async exportAsZip(): Promise<Blob> {
    const zip = new JSZip();

    for (const [path, file] of this.files) {
      if (file.type === 'file' && file.content !== undefined) {
        // Remove leading slash for zip paths
        const zipPath = path.startsWith('/') ? path.substring(1) : path;
        zip.file(zipPath, file.content);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  async downloadAsZip(filename: string = 'vibe-project.zip'): Promise<void> {
    const blob = await this.exportAsZip();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  exportAsJSON(): string {
    const fileStructure: Record<string, string> = {};

    for (const [path, file] of this.files) {
      if (file.type === 'file' && file.content !== undefined) {
        fileStructure[path] = file.content;
      }
    }

    return JSON.stringify(fileStructure, null, 2);
  }

  importFromJSON(json: string): void {
    try {
      const fileStructure = JSON.parse(json);

      // Clear existing files
      this.files.clear();
      this.openFiles.clear();
      this.dirtyFiles.clear();
      this.activeFile = null;

      // Create root folder
      this.files.set('/', {
        name: '',
        path: '/',
        type: 'folder',
        children: [],
        lastModified: new Date(),
      });

      // Import files
      for (const [path, content] of Object.entries(fileStructure)) {
        if (typeof content === 'string') {
          this.createFile(path, content);
        }
      }

      this.saveToStorage();
    } catch (error) {
      throw new FileSystemException(
        'PERSISTENCE_ERROR',
        `Failed to import from JSON: ${error}`
      );
    }
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStats() {
    let totalFiles = 0;
    let totalFolders = 0;
    let totalSize = 0;

    for (const [, file] of this.files) {
      if (file.type === 'file') {
        totalFiles++;
        totalSize += file.size || 0;
      } else {
        totalFolders++;
      }
    }

    return {
      totalFiles,
      totalFolders,
      totalSize,
      openFiles: this.openFiles.size,
      dirtyFiles: this.dirtyFiles.size,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const vibeFileSystem = new VibeFileSystem();

// ============================================================================
// Export utilities
// ============================================================================

export { PathUtils, detectLanguage };
