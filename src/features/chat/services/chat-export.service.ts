// Export service - handles exporting and sharing chat sessions
import type { ChatSession, ChatMessage } from '../types';

export class ChatExportService {
  /**
   * Export chat as markdown
   */
  exportAsMarkdown(session: ChatSession, messages: ChatMessage[]): string {
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
    markdown += `**Last Updated:** ${session.updatedAt.toLocaleString()}\n`;
    markdown += `**Messages:** ${messages.length}\n\n`;
    markdown += `---\n\n`;

    for (const message of messages) {
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      markdown += `## ${role}\n`;
      markdown += `*${message.createdAt.toLocaleString()}*\n\n`;
      markdown += `${message.content}\n\n`;

      if (message.attachments && message.attachments.length > 0) {
        markdown += `**Attachments:**\n`;
        for (const attachment of message.attachments) {
          markdown += `- ${attachment.name} (${this.formatFileSize(attachment.size)})\n`;
        }
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    }

    return markdown;
  }

  /**
   * Export chat as JSON
   */
  exportAsJSON(session: ChatSession, messages: ChatMessage[]): string {
    const data = {
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messageCount: session.messageCount,
        tags: session.tags,
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        attachments: msg.attachments,
        metadata: msg.metadata,
      })),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export chat as HTML
   */
  exportAsHTML(session: ChatSession, messages: ChatMessage[]): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${session.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .message {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .message.user {
      background: #e3f2fd;
    }
    .role {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .timestamp {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
    }
    .content {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .attachments {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${session.title}</h1>
    <p><strong>Created:</strong> ${session.createdAt.toLocaleString()}</p>
    <p><strong>Messages:</strong> ${messages.length}</p>
  </div>
`;

    for (const message of messages) {
      const roleClass = message.role === 'user' ? 'user' : 'assistant';
      const roleLabel = message.role === 'user' ? '👤 User' : '🤖 Assistant';

      html += `  <div class="message ${roleClass}">
    <div class="role">${roleLabel}</div>
    <div class="timestamp">${message.createdAt.toLocaleString()}</div>
    <div class="content">${this.escapeHtml(message.content)}</div>
`;

      if (message.attachments && message.attachments.length > 0) {
        html += `    <div class="attachments">
      <strong>Attachments:</strong>
      <ul>
`;
        for (const attachment of message.attachments) {
          html += `        <li>${this.escapeHtml(attachment.name)} (${this.formatFileSize(attachment.size)})</li>\n`;
        }
        html += `      </ul>
    </div>
`;
      }

      html += `  </div>\n`;
    }

    html += `  <div class="header">
    <p><small>Exported on ${new Date().toLocaleString()}</small></p>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Export chat as plain text
   */
  exportAsText(session: ChatSession, messages: ChatMessage[]): string {
    let text = `${session.title}\n`;
    text += `${'='.repeat(session.title.length)}\n\n`;
    text += `Created: ${session.createdAt.toLocaleString()}\n`;
    text += `Last Updated: ${session.updatedAt.toLocaleString()}\n`;
    text += `Messages: ${messages.length}\n\n`;
    text += `${'-'.repeat(50)}\n\n`;

    for (const message of messages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      text += `[${role}] ${message.createdAt.toLocaleString()}\n`;
      text += `${message.content}\n`;

      if (message.attachments && message.attachments.length > 0) {
        text += `\nAttachments:\n`;
        for (const attachment of message.attachments) {
          text += `- ${attachment.name} (${this.formatFileSize(attachment.size)})\n`;
        }
      }

      text += `\n${'-'.repeat(50)}\n\n`;
    }

    return text;
  }

  /**
   * Download exported content as a file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download chat in specified format
   */
  async exportChat(
    session: ChatSession,
    messages: ChatMessage[],
    format: 'markdown' | 'json' | 'html' | 'text'
  ): Promise<void> {
    let content: string;
    let extension: string;
    let mimeType: string;

    switch (format) {
      case 'markdown':
        content = this.exportAsMarkdown(session, messages);
        extension = 'md';
        mimeType = 'text/markdown';
        break;

      case 'json':
        content = this.exportAsJSON(session, messages);
        extension = 'json';
        mimeType = 'application/json';
        break;

      case 'html':
        content = this.exportAsHTML(session, messages);
        extension = 'html';
        mimeType = 'text/html';
        break;

      case 'text':
        content = this.exportAsText(session, messages);
        extension = 'txt';
        mimeType = 'text/plain';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const filename = `${this.sanitizeFilename(session.title)}_${Date.now()}.${extension}`;
    this.downloadFile(content, filename, mimeType);
  }

  /**
   * Generate shareable link for a chat session
   */
  async generateShareLink(sessionId: string): Promise<string> {
    // TODO: Implement actual share link generation with backend
    // This would typically:
    // 1. Create a public share token
    // 2. Store it in the database
    // 3. Return a public URL
    const shareToken = this.generateShareToken();
    return `${window.location.origin}/share/${shareToken}`;
  }

  /**
   * Copy chat to clipboard
   */
  async copyToClipboard(
    session: ChatSession,
    messages: ChatMessage[],
    format: 'markdown' | 'text' = 'markdown'
  ): Promise<void> {
    const content =
      format === 'markdown'
        ? this.exportAsMarkdown(session, messages)
        : this.exportAsText(session, messages);

    await navigator.clipboard.writeText(content);
  }

  // Helper methods
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private generateShareToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const chatExportService = new ChatExportService();
