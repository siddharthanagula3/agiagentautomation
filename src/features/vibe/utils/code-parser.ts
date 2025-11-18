/**
 * Code Parser Utility
 * Extracts file paths and code blocks from AI responses
 * Supports multiple formats:
 * - ```language:path/to/file.ext
 * - ```language path/to/file.ext
 * - <!-- FILE: path/to/file.ext -->
 */

export interface ParsedCodeBlock {
  filePath: string;
  language: string;
  content: string;
  lineNumber: number;
}

export interface ParseResult {
  codeBlocks: ParsedCodeBlock[];
  hasFiles: boolean;
}

/**
 * Parse AI response for code blocks with file paths
 *
 * @param content - Markdown content from AI response
 * @returns Parsed code blocks with file information
 */
export function parseCodeBlocks(content: string): ParseResult {
  const codeBlocks: ParsedCodeBlock[] = [];

  // Pattern 1: ```language:path/to/file.ext
  // Pattern 2: ```language path/to/file.ext
  // Pattern 3: ```language\npath/to/file.ext
  const codeBlockRegex = /```(\w+)(?::|\s+)?([\w\-./]+)?\n([\s\S]*?)```/g;

  let match;
  let lineNumber = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'plaintext';
    const filePath = match[2];
    const code = match[3].trim();

    // Only include blocks with file paths
    if (filePath && filePath.includes('/') || filePath?.includes('.')) {
      codeBlocks.push({
        filePath: normalizeFilePath(filePath),
        language: normalizeLanguage(language),
        content: code,
        lineNumber: lineNumber++,
      });
    }
  }

  // Pattern 4: HTML comments with file paths
  // <!-- FILE: path/to/file.ext -->
  // ... code ...
  // <!-- END FILE -->
  const htmlCommentRegex = /<!--\s*FILE:\s*([\w\-./]+)\s*-->\s*([\s\S]*?)(?:<!--\s*END FILE\s*-->|(?=<!--\s*FILE:))/gi;

  while ((match = htmlCommentRegex.exec(content)) !== null) {
    const filePath = match[1];
    const code = match[2].trim();

    // Extract language from file extension
    const ext = filePath.split('.').pop()?.toLowerCase() || 'plaintext';

    codeBlocks.push({
      filePath: normalizeFilePath(filePath),
      language: detectLanguageFromExtension(ext),
      content: code,
      lineNumber: lineNumber++,
    });
  }

  return {
    codeBlocks,
    hasFiles: codeBlocks.length > 0,
  };
}

/**
 * Normalize file path (ensure leading slash, remove duplicates)
 */
function normalizeFilePath(path: string): string {
  // Remove leading/trailing whitespace
  path = path.trim();

  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Remove duplicate slashes
  path = path.replace(/\/+/g, '/');

  return path;
}

/**
 * Normalize language identifier
 */
function normalizeLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    sh: 'shell',
    bash: 'shell',
    yml: 'yaml',
  };

  return languageMap[lang.toLowerCase()] || lang.toLowerCase();
}

/**
 * Detect language from file extension
 */
function detectLanguageFromExtension(ext: string): string {
  const extensionMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    txt: 'plaintext',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
  };

  return extensionMap[ext] || 'plaintext';
}

/**
 * Extract file operations from AI response
 * Detects phrases like "I've created", "I've updated", "Here's the file"
 */
export interface FileOperation {
  action: 'create' | 'update' | 'delete';
  filePath: string;
  content?: string;
}

export function extractFileOperations(content: string, codeBlocks: ParsedCodeBlock[]): FileOperation[] {
  const operations: FileOperation[] = [];

  // Map code blocks to create operations
  for (const block of codeBlocks) {
    // Check if this is mentioned as a new file or update
    const lowerContent = content.toLowerCase();
    const fileName = block.filePath.split('/').pop() || '';

    let action: 'create' | 'update' = 'create';

    // Detect update operations
    if (
      lowerContent.includes(`update ${fileName}`) ||
      lowerContent.includes(`updated ${fileName}`) ||
      lowerContent.includes(`modify ${fileName}`) ||
      lowerContent.includes(`modified ${fileName}`)
    ) {
      action = 'update';
    }

    operations.push({
      action,
      filePath: block.filePath,
      content: block.content,
    });
  }

  return operations;
}

/**
 * Generate file tree structure from file paths
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

export function generateFileTree(filePaths: string[]): FileTreeNode[] {
  const root: Map<string, FileTreeNode> = new Map();

  for (const filePath of filePaths) {
    const parts = filePath.split('/').filter(Boolean);
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += '/' + part;
      const isFile = i === parts.length - 1;

      if (!currentLevel.has(part)) {
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };

        currentLevel.set(part, node);
      }

      if (!isFile) {
        const folder = currentLevel.get(part)!;
        if (!folder.children) {
          folder.children = [];
        }

        // Create map for next level
        const childrenMap = new Map<string, FileTreeNode>();
        for (const child of folder.children) {
          childrenMap.set(child.name, child);
        }
        currentLevel = childrenMap;
      }
    }
  }

  return Array.from(root.values());
}

/**
 * Check if content contains code blocks
 */
export function hasCodeBlocks(content: string): boolean {
  return /```[\s\S]*?```/.test(content);
}

/**
 * Extract plain code blocks (without file paths)
 */
export function extractPlainCodeBlocks(content: string): Array<{language: string; content: string}> {
  const blocks: Array<{language: string; content: string}> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'plaintext';
    const code = match[2].trim();

    blocks.push({
      language: normalizeLanguage(language),
      content: code,
    });
  }

  return blocks;
}
