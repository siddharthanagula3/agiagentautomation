/**
 * Artifact Service - Claude-style Artifacts
 * Create and manage interactive content artifacts
 *
 * Updated: Nov 16th 2025 - Replaced silent failures with descriptive errors for unimplemented features
 */

export type ArtifactType =
  | 'code'
  | 'react'
  | 'html'
  | 'svg'
  | 'markdown'
  | 'mermaid'
  | 'chart'
  | 'document';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    tags?: string[];
    dependencies?: string[];
  };
  preview?: string; // URL or base64 preview
}

export interface ArtifactUpdate {
  id: string;
  content: string;
  title?: string;
}

class ArtifactService {
  private artifacts: Map<string, Artifact> = new Map();
  private callbacks: Map<string, Set<(artifact: Artifact) => void>> = new Map();

  /**
   * Create a new artifact
   */
  createArtifact(
    type: ArtifactType,
    title: string,
    content: string,
    language?: string
  ): Artifact {
    const id = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const artifact: Artifact = {
      id,
      type,
      title,
      content,
      language,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    };

    this.artifacts.set(id, artifact);
    this.notifySubscribers(id, artifact);

    return artifact;
  }

  /**
   * Update an existing artifact
   */
  updateArtifact(update: ArtifactUpdate): Artifact {
    const artifact = this.artifacts.get(update.id);

    if (!artifact) {
      throw new Error(`Artifact ${update.id} not found`);
    }

    const updated: Artifact = {
      ...artifact,
      content: update.content,
      title: update.title || artifact.title,
      metadata: {
        ...artifact.metadata!,
        updatedAt: new Date(),
        version: (artifact.metadata?.version || 1) + 1,
      },
    };

    this.artifacts.set(update.id, updated);
    this.notifySubscribers(update.id, updated);

    return updated;
  }

  /**
   * Get an artifact by ID
   */
  getArtifact(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Delete an artifact
   */
  deleteArtifact(id: string): boolean {
    return this.artifacts.delete(id);
  }

  /**
   * Subscribe to artifact updates
   */
  subscribe(
    artifactId: string,
    callback: (artifact: Artifact) => void
  ): () => void {
    if (!this.callbacks.has(artifactId)) {
      this.callbacks.set(artifactId, new Set());
    }

    this.callbacks.get(artifactId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.callbacks.get(artifactId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.callbacks.delete(artifactId);
        }
      }
    };
  }

  /**
   * Notify subscribers of artifact changes
   */
  private notifySubscribers(id: string, artifact: Artifact) {
    const subscribers = this.callbacks.get(id);
    if (subscribers) {
      subscribers.forEach((callback) => callback(artifact));
    }
  }

  /**
   * Extract artifacts from AI response
   */
  extractArtifactsFromResponse(response: string): Artifact[] {
    const artifacts: Artifact[] = [];

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();

      // Determine artifact type based on language
      let type: ArtifactType = 'code';
      if (language === 'html') type = 'html';
      else if (language === 'jsx' || language === 'tsx') type = 'react';
      else if (language === 'svg') type = 'svg';
      else if (language === 'mermaid') type = 'mermaid';

      const artifact = this.createArtifact(
        type,
        `${language.toUpperCase()} Code`,
        code,
        language
      );

      artifacts.push(artifact);
    }

    return artifacts;
  }

  /**
   * Generate preview for artifact
   */
  async generatePreview(artifact: Artifact): Promise<string> {
    switch (artifact.type) {
      case 'html':
        return this.generateHTMLPreview(artifact.content);

      case 'react':
        return this.generateReactPreview(artifact.content);

      case 'svg':
        return `data:image/svg+xml;base64,${btoa(artifact.content)}`;

      case 'chart':
        return this.generateChartPreview(artifact.content);

      case 'mermaid':
        return this.generateMermaidPreview(artifact.content);

      default:
        return '';
    }
  }

  /**
   * Generate HTML preview
   */
  private generateHTMLPreview(html: string): string {
    // Create a safe sandboxed iframe preview
    const safeHTML = this.sanitizeHTML(html);
    const blob = new Blob([safeHTML], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  /**
   * Generate React component preview
   */
  private generateReactPreview(code: string): string {
    throw new Error(
      'React component preview is not yet implemented. This feature requires a sandboxed rendering environment.'
    );
  }

  /**
   * Generate chart preview
   */
  private generateChartPreview(data: string): string {
    throw new Error(
      'Chart preview is not yet implemented. This feature requires chart rendering library integration.'
    );
  }

  /**
   * Generate Mermaid diagram preview
   */
  private generateMermaidPreview(mermaidCode: string): string {
    throw new Error(
      'Mermaid diagram preview is not yet implemented. This feature requires Mermaid.js integration.'
    );
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHTML(html: string): string {
    // Basic sanitization - in production, use DOMPurify
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Remove script tags
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Remove event handlers
    const elements = doc.querySelectorAll('*');
    elements.forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.documentElement.outerHTML;
  }

  /**
   * Export artifact to file
   */
  exportArtifact(artifact: Artifact): void {
    const filename = `${artifact.title.replace(/\s+/g, '_')}.${this.getFileExtension(artifact)}`;
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Get file extension for artifact type
   */
  private getFileExtension(artifact: Artifact): string {
    switch (artifact.type) {
      case 'code':
        return artifact.language || 'txt';
      case 'react':
        return 'jsx';
      case 'html':
        return 'html';
      case 'svg':
        return 'svg';
      case 'markdown':
        return 'md';
      case 'mermaid':
        return 'mmd';
      default:
        return 'txt';
    }
  }

  /**
   * Get all artifacts
   */
  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  /**
   * Get artifacts by type
   */
  getArtifactsByType(type: ArtifactType): Artifact[] {
    return Array.from(this.artifacts.values()).filter((a) => a.type === type);
  }

  /**
   * Search artifacts
   */
  searchArtifacts(query: string): Artifact[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.artifacts.values()).filter(
      (a) =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.content.toLowerCase().includes(lowerQuery)
    );
  }
}

export const artifactService = new ArtifactService();
