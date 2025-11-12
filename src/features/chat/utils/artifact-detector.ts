import type { ArtifactData } from '../components/ArtifactPreview';

/**
 * Artifact Detector Utility
 *
 * Automatically detects code blocks that should be rendered as interactive artifacts.
 * This enables Claude Artifacts-like functionality where code is live-rendered.
 *
 * Detection Rules:
 * - HTML: Complete HTML documents or fragments with tags
 * - React/JSX: Code containing JSX syntax
 * - SVG: SVG markup
 * - Mermaid: Mermaid diagram syntax
 * - Interactive code: Code marked with special comments
 */

interface CodeBlock {
  language: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract all code blocks from markdown content
 */
export function extractCodeBlocks(markdown: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      content: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return codeBlocks;
}

/**
 * Detect if a code block should be rendered as an artifact
 */
export function shouldRenderAsArtifact(
  language: string,
  content: string
): boolean {
  const lang = language.toLowerCase();

  // HTML - check for HTML tags
  if (lang === 'html' || lang === 'htm') {
    return true;
  }

  // React/JSX
  if (lang === 'jsx' || lang === 'tsx' || lang === 'react') {
    return true;
  }

  // SVG
  if (lang === 'svg' || content.trim().startsWith('<svg')) {
    return true;
  }

  // Mermaid diagrams
  if (lang === 'mermaid') {
    return true;
  }

  // Check for HTML-like content in other languages
  if (
    content.includes('<!DOCTYPE') ||
    content.includes('<html') ||
    (content.includes('<div') && content.includes('</div>'))
  ) {
    return true;
  }

  // Check for special artifact markers in comments
  if (
    content.includes('// @artifact') ||
    content.includes('<!-- @artifact -->') ||
    content.includes('# @artifact')
  ) {
    return true;
  }

  return false;
}

/**
 * Extract title from code block (from comments or tags)
 */
export function extractArtifactTitle(content: string): string | undefined {
  // Try HTML title tag
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Try comment-based title
  const commentMatch = content.match(
    /(?:\/\/|<!--|#)\s*@title:?\s*(.+?)(?:\n|-->)/i
  );
  if (commentMatch) {
    return commentMatch[1].trim();
  }

  // Try first heading
  const headingMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (headingMatch) {
    return headingMatch[1].replace(/<[^>]*>/g, '').trim();
  }

  return undefined;
}

/**
 * Detect artifact type from language and content
 */
export function detectArtifactType(
  language: string,
  content: string
): ArtifactData['type'] {
  const lang = language.toLowerCase();

  if (lang === 'mermaid') return 'mermaid';
  if (lang === 'svg' || content.trim().startsWith('<svg')) return 'svg';
  if (lang === 'jsx' || lang === 'tsx' || lang === 'react') return 'react';
  if (lang === 'html' || lang === 'htm') return 'html';

  // Check content for HTML-like structure
  if (
    content.includes('<!DOCTYPE') ||
    content.includes('<html') ||
    (content.includes('<div') && content.includes('</div>'))
  ) {
    return 'html';
  }

  return 'code';
}

/**
 * Convert markdown message to artifacts
 */
export function extractArtifacts(markdown: string): ArtifactData[] {
  const codeBlocks = extractCodeBlocks(markdown);
  const artifacts: ArtifactData[] = [];

  for (const block of codeBlocks) {
    if (shouldRenderAsArtifact(block.language, block.content)) {
      const type = detectArtifactType(block.language, block.content);
      const title = extractArtifactTitle(block.content);

      artifacts.push({
        id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        language: block.language,
        title,
        content: block.content,
        versions: [
          {
            id: `v1-${Date.now()}`,
            content: block.content,
            timestamp: new Date(),
            description: 'Initial version',
          },
        ],
        currentVersion: 0,
      });
    }
  }

  return artifacts;
}

/**
 * Remove artifact code blocks from markdown to avoid duplication
 */
export function removeArtifactBlocks(
  markdown: string,
  artifacts: ArtifactData[]
): string {
  let cleaned = markdown;

  // Remove code blocks that are rendered as artifacts
  for (const artifact of artifacts) {
    // Create regex to match the specific code block
    const escapedContent = artifact.content.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
    const regex = new RegExp(
      `\`\`\`${artifact.language || '\\w*'}\\s*\\n${escapedContent}\\s*\`\`\``,
      'g'
    );
    cleaned = cleaned.replace(regex, '');
  }

  return cleaned.trim();
}

/**
 * Check if message has any artifacts
 */
export function hasArtifacts(markdown: string): boolean {
  const codeBlocks = extractCodeBlocks(markdown);
  return codeBlocks.some((block) =>
    shouldRenderAsArtifact(block.language, block.content)
  );
}

/**
 * Get artifact statistics for analytics
 */
export function getArtifactStats(artifacts: ArtifactData[]) {
  const stats = {
    total: artifacts.length,
    byType: {} as Record<string, number>,
    totalVersions: 0,
  };

  for (const artifact of artifacts) {
    stats.byType[artifact.type] = (stats.byType[artifact.type] || 0) + 1;
    stats.totalVersions += artifact.versions?.length || 1;
  }

  return stats;
}
