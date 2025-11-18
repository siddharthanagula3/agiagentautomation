# Vibe File System Usage Guide

This guide demonstrates how to use the Vibe File System service in your components.

## Quick Start

```typescript
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';

// Create a file
vibeFileSystem.createFile('/src/App.tsx', 'const App = () => <div>Hello</div>');

// Read a file
const content = vibeFileSystem.readFile('/src/App.tsx');

// Update a file
vibeFileSystem.updateFile('/src/App.tsx', 'const App = () => <div>Updated</div>');

// Delete a file
vibeFileSystem.deleteFile('/src/App.tsx');
```

## Basic Operations

### Creating Files and Folders

```typescript
// Create a folder
vibeFileSystem.createFolder('/src');

// Create nested folders (automatic parent creation)
vibeFileSystem.createFile('/src/components/Button.tsx', 'export const Button = () => {}');
// This automatically creates /src and /src/components

// Create files with different types
vibeFileSystem.createFile('/src/App.tsx', 'const App = () => {}');
vibeFileSystem.createFile('/src/style.css', '.app { color: red; }');
vibeFileSystem.createFile('/package.json', JSON.stringify({ name: 'app' }, null, 2));
```

### Reading and Updating Files

```typescript
// Read file content
const content = vibeFileSystem.readFile('/src/App.tsx');

// Update file content
vibeFileSystem.updateFile('/src/App.tsx', 'const App = () => <div>New Content</div>');

// Check if file has unsaved changes
if (vibeFileSystem.hasUnsavedChanges()) {
  console.log('You have unsaved changes!');
}

// Mark file as clean (saved)
vibeFileSystem.markClean('/src/App.tsx');
```

### File Management

```typescript
// Rename a file
vibeFileSystem.renameFile('/old-name.txt', '/new-name.txt');

// List files in a folder
const files = vibeFileSystem.listFiles('/src');
// Returns: ['/src/App.tsx', '/src/components', '/src/style.css']

// Get file tree for sidebar
const tree = vibeFileSystem.getFileTree();
// Returns hierarchical structure for rendering
```

## Integration with Monaco Editor

### Basic Editor Integration

```typescript
import Editor from '@monaco-editor/react';
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';
import { useState, useEffect } from 'react';

function CodeEditor() {
  const [activeFile, setActiveFile] = useState('/src/App.tsx');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('typescript');

  useEffect(() => {
    try {
      const file = vibeFileSystem.openFile(activeFile);
      setContent(file.content || '');
      setLanguage(file.language || 'plaintext');
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [activeFile]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      vibeFileSystem.updateFile(activeFile, value);
      setContent(value);
    }
  };

  return (
    <Editor
      height="100vh"
      language={language}
      value={content}
      onChange={handleEditorChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        tabSize: 2,
        automaticLayout: true,
      }}
    />
  );
}
```

### Multi-Tab Editor

```typescript
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';
import { useState } from 'react';

function MultiTabEditor() {
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const openFile = (path: string) => {
    try {
      vibeFileSystem.openFile(path);
      setOpenFiles(vibeFileSystem.getOpenFiles());
      setActiveFile(path);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const closeFile = (path: string) => {
    vibeFileSystem.closeFile(path);
    setOpenFiles(vibeFileSystem.getOpenFiles());
    setActiveFile(vibeFileSystem.getActiveFile());
  };

  const renderTabs = () => {
    return openFiles.map(filePath => {
      const isDirty = vibeFileSystem.getDirtyFiles().includes(filePath);
      const fileName = filePath.split('/').pop();

      return (
        <div
          key={filePath}
          className={activeFile === filePath ? 'active' : ''}
          onClick={() => setActiveFile(filePath)}
        >
          {fileName}
          {isDirty && <span className="dirty-indicator">●</span>}
          <button onClick={() => closeFile(filePath)}>×</button>
        </div>
      );
    });
  };

  return (
    <div>
      <div className="tabs">{renderTabs()}</div>
      {activeFile && (
        <Editor
          key={activeFile}
          value={vibeFileSystem.readFile(activeFile)}
          onChange={(value) => vibeFileSystem.updateFile(activeFile, value || '')}
        />
      )}
    </div>
  );
}
```

### File Explorer Sidebar

```typescript
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';
import { useState } from 'react';
import { FileTreeNode } from '@features/mission-control/services/vibe-file-system';

function FileExplorer({ onFileSelect }: { onFileSelect: (path: string) => void }) {
  const [tree, setTree] = useState<FileTreeNode[]>(vibeFileSystem.getFileTree());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded);
    if (expanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const renderTree = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.path} style={{ paddingLeft: depth * 20 }}>
        {node.type === 'folder' ? (
          <>
            <div onClick={() => toggleFolder(node.path)}>
              {expanded.has(node.path) ? '📂' : '📁'} {node.name}
            </div>
            {expanded.has(node.path) && node.children && renderTree(node.children, depth + 1)}
          </>
        ) : (
          <div onClick={() => onFileSelect(node.path)}>
            📄 {node.name}
          </div>
        )}
      </div>
    ));
  };

  return <div className="file-explorer">{renderTree(tree)}</div>;
}
```

## Advanced Features

### Search Functionality

```typescript
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';

function SearchFiles() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    const searchResults = vibeFileSystem.searchFiles(searchQuery);
    setResults(searchResults);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search files..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="results">
        {results.map(file => (
          <div key={file.path}>
            {file.path}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Export/Import

```typescript
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';

// Export as ZIP
async function exportProject() {
  await vibeFileSystem.downloadAsZip('my-project.zip');
}

// Export as JSON
function exportAsJSON() {
  const json = vibeFileSystem.exportAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'project.json';
  a.click();
}

// Import from JSON
function importProject(jsonString: string) {
  try {
    vibeFileSystem.importFromJSON(jsonString);
    console.log('Project imported successfully!');
  } catch (error) {
    console.error('Failed to import:', error);
  }
}
```

### File System Statistics

```typescript
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';

function FileSystemStats() {
  const stats = vibeFileSystem.getStats();

  return (
    <div>
      <p>Total Files: {stats.totalFiles}</p>
      <p>Total Folders: {stats.totalFolders}</p>
      <p>Total Size: {(stats.totalSize / 1024).toFixed(2)} KB</p>
      <p>Open Files: {stats.openFiles}</p>
      <p>Unsaved Changes: {stats.dirtyFiles}</p>
    </div>
  );
}
```

### Autosave Hook

```typescript
import { useEffect } from 'react';
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';

function useAutosave(activeFile: string, content: string, delay = 1000) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeFile && content) {
        vibeFileSystem.updateFile(activeFile, content);
        vibeFileSystem.markClean(activeFile);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [activeFile, content, delay]);
}

// Usage in component
function Editor() {
  const [content, setContent] = useState('');
  const [activeFile, setActiveFile] = useState('/src/App.tsx');

  useAutosave(activeFile, content);

  return (
    <MonacoEditor
      value={content}
      onChange={setContent}
    />
  );
}
```

### Keyboard Shortcuts

```typescript
import { useEffect } from 'react';
import { vibeFileSystem } from '@features/mission-control/services/vibe-file-system';

function useKeyboardShortcuts(activeFile: string) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFile) {
          vibeFileSystem.markClean(activeFile);
          console.log('File saved!');
        }
      }

      // Ctrl+W or Cmd+W to close file
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeFile) {
          vibeFileSystem.closeFile(activeFile);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);
}
```

## Error Handling

```typescript
import { vibeFileSystem, FileSystemException } from '@features/mission-control/services/vibe-file-system';

function handleFileOperation() {
  try {
    vibeFileSystem.createFile('/src/App.tsx', 'content');
  } catch (error) {
    if (error instanceof FileSystemException) {
      switch (error.code) {
        case 'FILE_ALREADY_EXISTS':
          console.error('File already exists:', error.path);
          break;
        case 'FILE_NOT_FOUND':
          console.error('File not found:', error.path);
          break;
        case 'INVALID_PATH':
          console.error('Invalid path:', error.path);
          break;
        case 'PERSISTENCE_ERROR':
          console.error('Failed to save to storage');
          break;
        default:
          console.error('Unknown error:', error.message);
      }
    }
  }
}
```

## Best Practices

1. **Always use normalized paths**: The file system automatically normalizes paths, but it's good practice to use absolute paths starting with `/`.

2. **Handle errors gracefully**: Wrap file operations in try-catch blocks and handle `FileSystemException` appropriately.

3. **Track dirty files**: Use the dirty file tracking to warn users about unsaved changes before navigation.

4. **Use the singleton instance**: Import `vibeFileSystem` directly rather than creating new instances.

5. **Leverage autosave**: Implement autosave to prevent data loss.

6. **Clean up on unmount**: Close files and clean up resources when components unmount.

7. **Persist important changes**: The file system auto-saves to localStorage, but consider implementing manual save points for critical operations.

## Performance Considerations

- The file system stores everything in memory, so be mindful of large files
- Search operations scan all files, so debounce search inputs
- File tree generation is relatively expensive, so cache results when possible
- Use lazy loading for large projects with many files

## Future Enhancements

Potential features for future versions:

- GitHub integration for import/export
- Real-time collaboration support
- Version control (git-like history)
- File watching and hot reload
- Compression for large files
- Cloud sync capabilities
- Code formatting integration
- Linting integration
- Multi-cursor support
- Diff viewer for changes
