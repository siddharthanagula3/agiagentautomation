/**
 * Vibe File System Service - Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VibeFileSystem,
  FileSystemException,
  PathUtils,
  detectLanguage,
} from './vibe-file-system';

describe('PathUtils', () => {
  describe('normalize', () => {
    it('should normalize paths correctly', () => {
      expect(PathUtils.normalize('/src/App.tsx')).toBe('/src/App.tsx');
      expect(PathUtils.normalize('src/App.tsx')).toBe('/src/App.tsx');
      expect(PathUtils.normalize('/src//App.tsx')).toBe('/src/App.tsx');
      expect(PathUtils.normalize('/src/./App.tsx')).toBe('/src/App.tsx');
      expect(PathUtils.normalize('/src/components/../App.tsx')).toBe(
        '/src/App.tsx'
      );
      expect(PathUtils.normalize('/src/App.tsx/')).toBe('/src/App.tsx');
    });
  });

  describe('join', () => {
    it('should join paths correctly', () => {
      expect(PathUtils.join('/src', 'App.tsx')).toBe('/src/App.tsx');
      expect(PathUtils.join('/src/', '/App.tsx')).toBe('/src/App.tsx');
      expect(PathUtils.join('/', 'src', 'App.tsx')).toBe('/src/App.tsx');
    });
  });

  describe('dirname', () => {
    it('should get directory name correctly', () => {
      expect(PathUtils.dirname('/src/App.tsx')).toBe('/src');
      expect(PathUtils.dirname('/src/components/Button.tsx')).toBe(
        '/src/components'
      );
      expect(PathUtils.dirname('/App.tsx')).toBe('/');
      expect(PathUtils.dirname('/')).toBe('/');
    });
  });

  describe('basename', () => {
    it('should get base name correctly', () => {
      expect(PathUtils.basename('/src/App.tsx')).toBe('App.tsx');
      expect(PathUtils.basename('/src/components/Button.tsx')).toBe(
        'Button.tsx'
      );
      expect(PathUtils.basename('/App.tsx')).toBe('App.tsx');
    });
  });

  describe('isValid', () => {
    it('should validate paths correctly', () => {
      expect(PathUtils.isValid('/src/App.tsx')).toBe(true);
      expect(PathUtils.isValid('src/App.tsx')).toBe(true);
      expect(PathUtils.isValid('')).toBe(false);
      expect(PathUtils.isValid('/src//App.tsx')).toBe(false);
    });
  });

  describe('getExtension', () => {
    it('should get file extension correctly', () => {
      expect(PathUtils.getExtension('/src/App.tsx')).toBe('.tsx');
      expect(PathUtils.getExtension('/src/style.css')).toBe('.css');
      expect(PathUtils.getExtension('/README.md')).toBe('.md');
      expect(PathUtils.getExtension('/Makefile')).toBe('');
    });
  });
});

describe('detectLanguage', () => {
  it('should detect file languages correctly', () => {
    expect(detectLanguage('/src/App.tsx')).toBe('typescript');
    expect(detectLanguage('/src/App.jsx')).toBe('javascript');
    expect(detectLanguage('/src/style.css')).toBe('css');
    expect(detectLanguage('/src/style.scss')).toBe('scss');
    expect(detectLanguage('/index.html')).toBe('html');
    expect(detectLanguage('/package.json')).toBe('json');
    expect(detectLanguage('/README.md')).toBe('markdown');
    expect(detectLanguage('/script.py')).toBe('python');
    expect(detectLanguage('/main.go')).toBe('go');
    expect(detectLanguage('/app.rs')).toBe('rust');
  });
});

describe('VibeFileSystem', () => {
  let fs: VibeFileSystem;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    fs = new VibeFileSystem();
    // Clear the default project for clean tests (don't reinitialize)
    fs.clearStorage(false);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createFile', () => {
    it('should create a file successfully', () => {
      const file = fs.createFile('/test.txt', 'Hello World');

      expect(file.name).toBe('test.txt');
      expect(file.path).toBe('/test.txt');
      expect(file.type).toBe('file');
      expect(file.content).toBe('Hello World');
      expect(file.language).toBe('plaintext');
      expect(file.size).toBe(11);
    });

    it('should create parent folders automatically', () => {
      const file = fs.createFile(
        '/src/components/Button.tsx',
        'export const Button = () => {}'
      );

      expect(file.path).toBe('/src/components/Button.tsx');
      expect(fs.listFiles('/src/components')).toContain(
        '/src/components/Button.tsx'
      );
    });

    it('should throw error if file already exists', () => {
      fs.createFile('/test.txt', 'Hello');

      expect(() => {
        fs.createFile('/test.txt', 'World');
      }).toThrow(FileSystemException);
    });

    it('should detect language from extension', () => {
      const tsFile = fs.createFile('/App.tsx', 'const x = 1');
      const cssFile = fs.createFile('/style.css', '.app {}');
      const mdFile = fs.createFile('/README.md', '# Title');

      expect(tsFile.language).toBe('typescript');
      expect(cssFile.language).toBe('css');
      expect(mdFile.language).toBe('markdown');
    });
  });

  describe('readFile', () => {
    it('should read file content', () => {
      fs.createFile('/test.txt', 'Hello World');
      const content = fs.readFile('/test.txt');

      expect(content).toBe('Hello World');
    });

    it('should throw error if file does not exist', () => {
      expect(() => {
        fs.readFile('/nonexistent.txt');
      }).toThrow(FileSystemException);
    });

    it('should throw error if trying to read a folder', () => {
      fs.createFolder('/src');

      expect(() => {
        fs.readFile('/src');
      }).toThrow(FileSystemException);
    });
  });

  describe('updateFile', () => {
    it('should update file content', () => {
      fs.createFile('/test.txt', 'Hello');
      const updated = fs.updateFile('/test.txt', 'World');

      expect(updated.content).toBe('World');
      expect(updated.isDirty).toBe(true);
      expect(fs.getDirtyFiles()).toContain('/test.txt');
    });

    it('should update lastModified timestamp', async () => {
      const file = fs.createFile('/test.txt', 'Hello');
      const originalTime = file.lastModified;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = fs.updateFile('/test.txt', 'World');
      expect(updated.lastModified.getTime()).toBeGreaterThan(
        originalTime.getTime()
      );
    });

    it('should throw error if file does not exist', () => {
      expect(() => {
        fs.updateFile('/nonexistent.txt', 'content');
      }).toThrow(FileSystemException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', () => {
      fs.createFile('/test.txt', 'Hello');
      fs.deleteFile('/test.txt');

      expect(() => {
        fs.readFile('/test.txt');
      }).toThrow(FileSystemException);
    });

    it('should remove from parent children', () => {
      fs.createFile('/src/test.txt', 'Hello');
      expect(fs.listFiles('/src')).toContain('/src/test.txt');

      fs.deleteFile('/src/test.txt');
      expect(fs.listFiles('/src')).not.toContain('/src/test.txt');
    });

    it('should close file if it was open', () => {
      fs.createFile('/test.txt', 'Hello');
      fs.openFile('/test.txt');

      expect(fs.getOpenFiles()).toContain('/test.txt');

      fs.deleteFile('/test.txt');
      expect(fs.getOpenFiles()).not.toContain('/test.txt');
    });

    it('should throw error when trying to delete root', () => {
      expect(() => {
        fs.deleteFile('/');
      }).toThrow(FileSystemException);
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', () => {
      fs.createFile('/old.txt', 'Hello');
      const newFile = fs.renameFile('/old.txt', '/new.txt');

      expect(newFile.name).toBe('new.txt');
      expect(newFile.path).toBe('/new.txt');
      expect(newFile.content).toBe('Hello');

      expect(() => {
        fs.readFile('/old.txt');
      }).toThrow(FileSystemException);
    });

    it('should throw error if target already exists', () => {
      fs.createFile('/old.txt', 'Hello');
      fs.createFile('/new.txt', 'World');

      expect(() => {
        fs.renameFile('/old.txt', '/new.txt');
      }).toThrow(FileSystemException);
    });
  });

  describe('createFolder', () => {
    it('should create folder successfully', () => {
      const folder = fs.createFolder('/src');

      expect(folder.name).toBe('src');
      expect(folder.path).toBe('/src');
      expect(folder.type).toBe('folder');
      expect(folder.children).toEqual([]);
    });

    it('should create nested folders recursively', () => {
      const folder = fs.createFolder('/src/components/ui');

      expect(folder.path).toBe('/src/components/ui');
      expect(fs.listFiles('/')).toContain('/src');
      expect(fs.listFiles('/src')).toContain('/src/components');
      expect(fs.listFiles('/src/components')).toContain('/src/components/ui');
    });

    it('should return existing folder if it already exists', () => {
      const folder1 = fs.createFolder('/src');
      const folder2 = fs.createFolder('/src');

      expect(folder1).toBe(folder2);
    });
  });

  describe('listFiles', () => {
    it('should list files in a folder', () => {
      fs.createFile('/src/App.tsx', '');
      fs.createFile('/src/index.tsx', '');
      fs.createFolder('/src/components');

      const files = fs.listFiles('/src');

      expect(files).toContain('/src/components');
      expect(files).toContain('/src/App.tsx');
      expect(files).toContain('/src/index.tsx');
      expect(files).toHaveLength(3);
    });

    it('should return empty array for empty folder', () => {
      fs.createFolder('/empty');
      expect(fs.listFiles('/empty')).toEqual([]);
    });

    it('should throw error if folder does not exist', () => {
      expect(() => {
        fs.listFiles('/nonexistent');
      }).toThrow(FileSystemException);
    });
  });

  describe('getFileTree', () => {
    it('should generate file tree structure', () => {
      fs.createFolder('/src');
      fs.createFile('/src/App.tsx', '');
      fs.createFolder('/src/components');
      fs.createFile('/src/components/Button.tsx', '');
      fs.createFile('/package.json', '');

      const tree = fs.getFileTree();

      expect(tree).toHaveLength(2); // package.json and src
      const srcNode = tree.find((node) => node.name === 'src');
      expect(srcNode?.children).toHaveLength(2); // App.tsx and components
    });
  });

  describe('openFile', () => {
    it('should open file and mark as active', () => {
      fs.createFile('/test.txt', 'Hello');
      const file = fs.openFile('/test.txt');

      expect(file.path).toBe('/test.txt');
      expect(fs.getOpenFiles()).toContain('/test.txt');
      expect(fs.getActiveFile()).toBe('/test.txt');
    });

    it('should throw error if file does not exist', () => {
      expect(() => {
        fs.openFile('/nonexistent.txt');
      }).toThrow(FileSystemException);
    });
  });

  describe('closeFile', () => {
    it('should close file', () => {
      fs.createFile('/test.txt', 'Hello');
      fs.openFile('/test.txt');

      expect(fs.getOpenFiles()).toContain('/test.txt');

      fs.closeFile('/test.txt');
      expect(fs.getOpenFiles()).not.toContain('/test.txt');
    });

    it('should switch active file when closing active file', () => {
      fs.createFile('/test1.txt', 'Hello');
      fs.createFile('/test2.txt', 'World');

      fs.openFile('/test1.txt');
      fs.openFile('/test2.txt');

      expect(fs.getActiveFile()).toBe('/test2.txt');

      fs.closeFile('/test2.txt');
      expect(fs.getActiveFile()).toBe('/test1.txt');
    });
  });

  describe('markClean', () => {
    it('should mark file as clean', () => {
      fs.createFile('/test.txt', 'Hello');
      fs.updateFile('/test.txt', 'World');

      expect(fs.getDirtyFiles()).toContain('/test.txt');

      fs.markClean('/test.txt');
      expect(fs.getDirtyFiles()).not.toContain('/test.txt');
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should return true if there are dirty files', () => {
      fs.createFile('/test.txt', 'Hello');
      expect(fs.hasUnsavedChanges()).toBe(false);

      fs.updateFile('/test.txt', 'World');
      expect(fs.hasUnsavedChanges()).toBe(true);

      fs.markClean('/test.txt');
      expect(fs.hasUnsavedChanges()).toBe(false);
    });
  });

  describe('searchFiles', () => {
    it('should search files by name', () => {
      fs.createFile('/test.txt', 'Hello');
      fs.createFile('/test2.txt', 'World');
      fs.createFile('/other.txt', 'Foo');

      const results = fs.searchFiles('test');
      expect(results).toHaveLength(2);
      expect(results.map((f) => f.name)).toEqual(['test.txt', 'test2.txt']);
    });

    it('should search files by content', () => {
      fs.createFile('/file1.txt', 'Hello World');
      fs.createFile('/file2.txt', 'Goodbye World');
      fs.createFile('/file3.txt', 'Hello There');

      const results = fs.searchFiles('World');
      expect(results).toHaveLength(2);
    });
  });

  describe('persistence', () => {
    it('should save to localStorage', () => {
      fs.createFile('/test.txt', 'Hello');

      const stored = localStorage.getItem('vibe-file-system');
      expect(stored).toBeTruthy();

      const state = JSON.parse(stored!);
      expect(state.files).toBeDefined();
    });

    it('should load from localStorage', () => {
      fs.createFile('/test.txt', 'Hello World');

      // Create new instance - should load from storage
      const fs2 = new VibeFileSystem();
      const content = fs2.readFile('/test.txt');

      expect(content).toBe('Hello World');
    });
  });

  describe('exportAsJSON', () => {
    it('should export files as JSON', () => {
      fs.createFile('/test.txt', 'Hello');
      fs.createFile('/src/App.tsx', 'const x = 1');

      const json = fs.exportAsJSON();
      const parsed = JSON.parse(json);

      expect(parsed['/test.txt']).toBe('Hello');
      expect(parsed['/src/App.tsx']).toBe('const x = 1');
    });
  });

  describe('importFromJSON', () => {
    it('should import files from JSON', () => {
      const json = JSON.stringify({
        '/test.txt': 'Hello',
        '/src/App.tsx': 'const x = 1',
      });

      fs.importFromJSON(json);

      expect(fs.readFile('/test.txt')).toBe('Hello');
      expect(fs.readFile('/src/App.tsx')).toBe('const x = 1');
    });

    it('should clear existing files before import', () => {
      fs.createFile('/existing.txt', 'old');

      const json = JSON.stringify({
        '/new.txt': 'new',
      });

      fs.importFromJSON(json);

      expect(() => {
        fs.readFile('/existing.txt');
      }).toThrow(FileSystemException);

      expect(fs.readFile('/new.txt')).toBe('new');
    });
  });

  describe('getStats', () => {
    it('should return file system statistics', () => {
      fs.createFile('/test1.txt', 'Hello');
      fs.createFile('/test2.txt', 'World');
      fs.createFolder('/src');
      fs.openFile('/test1.txt');
      fs.updateFile('/test1.txt', 'Updated');

      const stats = fs.getStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalFolders).toBeGreaterThan(0);
      expect(stats.openFiles).toBe(1);
      expect(stats.dirtyFiles).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });
});
