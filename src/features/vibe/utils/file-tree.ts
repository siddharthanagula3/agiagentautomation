import type { FileMetadata, FileTreeItem } from '../stores/vibe-view-store';

// Updated: Jan 15th 2026 - Fixed any type
export interface VibeFileRow {
  id: string;
  name: string;
  url: string;
  metadata?: Record<string, unknown> | null;
  size?: number | null;
  uploaded_at?: string | null;
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  md: 'markdown',
  mdx: 'markdown',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  html: 'html',
  vue: 'vue',
  svelte: 'svelte',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  php: 'php',
  sql: 'sql',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  swift: 'swift',
};

const sanitizePath = (value: string): string =>
  value.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\s+/g, ' ');

export const normalizeFilePath = (
  rawPath: string,
  fallbackName: string
): string => {
  if (!rawPath) {
    return fallbackName;
  }

  const cleaned = sanitizePath(rawPath);
  if (!cleaned) {
    return fallbackName;
  }

  const segments = cleaned.split('/').filter(Boolean);
  if (segments.length <= 2) {
    return cleaned;
  }

  if (segments[0] === 'vibe') {
    return segments.slice(2).join('/') || fallbackName;
  }

  return cleaned;
};

export const inferLanguageFromPath = (path: string): string => {
  const match = path.match(/\.([a-z0-9]+)$/i);
  if (!match) {
    return 'plaintext';
  }
  const ext = match[1].toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] || 'plaintext';
};

export const mapFileRowToMetadata = (row: VibeFileRow): FileMetadata => {
  const metadata = row.metadata || {};
  const rawPath =
    (typeof metadata.original_path === 'string' && metadata.original_path) ||
    (typeof metadata.path === 'string' && metadata.path) ||
    row.name;

  const normalizedPath = normalizeFilePath(rawPath, row.name);

  return {
    id: row.id,
    name: row.name,
    path: normalizedPath,
    url: row.url,
    size: typeof row.size === 'number' ? row.size : undefined,
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at) : undefined,
    language:
      typeof metadata.language === 'string'
        ? metadata.language
        : inferLanguageFromPath(normalizedPath),
    ...metadata,
  };
};

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: Record<string, TreeNode>;
  metadata?: Record<string, unknown>;
}

const sortNodes = (a: TreeNode, b: TreeNode) => {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name);
  }
  return a.type === 'folder' ? -1 : 1;
};

const convertTreeToArray = (nodes: Record<string, TreeNode>): FileTreeItem[] =>
  Object.values(nodes)
    .sort(sortNodes)
    .map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      path: node.path,
      children: node.children ? convertTreeToArray(node.children) : undefined,
      size:
        typeof node.metadata?.size === 'number'
          ? (node.metadata.size as number)
          : undefined,
      modified:
        node.metadata?.uploadedAt instanceof Date
          ? (node.metadata.uploadedAt as Date)
          : undefined,
      metadata: node.metadata,
    }));

export const buildFileTree = (files: FileMetadata[]): FileTreeItem[] => {
  const root: Record<string, TreeNode> = {};

  files.forEach((file) => {
    const parts = sanitizePath(file.path).split('/').filter(Boolean);
    if (parts.length === 0) return;

    let cursor = root;
    let accumulated = '';

    parts.forEach((segment, index) => {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      const isFile = index === parts.length - 1;

      if (!cursor[segment]) {
        cursor[segment] = {
          id: isFile ? file.id : `${accumulated}-folder`,
          name: segment,
          type: isFile ? 'file' : 'folder',
          path: accumulated,
          children: isFile ? undefined : {},
          metadata: isFile
            ? {
                fileId: file.id,
                url: file.url,
                size: file.size,
                uploadedAt: file.uploadedAt,
                language: file.language,
              }
            : undefined,
        };
      } else if (isFile) {
        cursor[segment].id = file.id;
        cursor[segment].metadata = {
          ...cursor[segment].metadata,
          fileId: file.id,
          url: file.url,
          size: file.size,
          uploadedAt: file.uploadedAt,
          language: file.language,
        };
      }

      if (!isFile) {
        if (!cursor[segment].children) {
          cursor[segment].children = {};
        }
        cursor = cursor[segment].children!;
      }
    });
  });

  return convertTreeToArray(root);
};
