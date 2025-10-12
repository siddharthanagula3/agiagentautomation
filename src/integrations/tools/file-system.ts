export interface FileResult {
  name: string;
  content: string;
  size: number;
  type: string;
  lastModified: Date;
}

export interface ToolResult {
  success: boolean;
  data?: FileResult | FileResult[];
  error?: string;
  cost?: number;
}

export interface FileSystemParams {
  path?: string;
  content?: string;
  operation: 'read' | 'write' | 'list' | 'delete';
}

export class FileSystemTool {
  async execute(params: FileSystemParams): Promise<ToolResult> {
    try {
      switch (params.operation) {
        case 'read':
          return await this.readFile(params.path!);
        case 'write':
          return await this.writeFile(params.path!, params.content!);
        case 'list':
          return await this.listFiles(params.path || '.');
        case 'delete':
          return await this.deleteFile(params.path!);
        default:
          return {
            success: false,
            error: 'Invalid operation',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async readFile(path: string): Promise<ToolResult> {
    try {
      // Use browser File System Access API
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Text files',
              accept: {
                'text/plain': [
                  '.txt',
                  '.md',
                  '.js',
                  '.ts',
                  '.json',
                  '.html',
                  '.css',
                ],
              },
            },
          ],
        });

        const file = await fileHandle.getFile();
        const content = await file.text();

        return {
          success: true,
          data: {
            name: file.name,
            content: content,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
          },
          cost: 0.001,
        };
      } else {
        // Fallback for browsers without File System Access API
        return {
          success: false,
          error: 'File System Access API not supported in this browser',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async writeFile(path: string, content: string): Promise<ToolResult> {
    try {
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: path,
          types: [
            {
              description: 'Text files',
              accept: {
                'text/plain': [
                  '.txt',
                  '.md',
                  '.js',
                  '.ts',
                  '.json',
                  '.html',
                  '.css',
                ],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return {
          success: true,
          data: {
            name: fileHandle.name,
            content: content,
            size: content.length,
            type: 'text/plain',
            lastModified: new Date(),
          },
          cost: 0.001,
        };
      } else {
        // Fallback: download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = path;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return {
          success: true,
          data: {
            name: path,
            content: content,
            size: content.length,
            type: 'text/plain',
            lastModified: new Date(),
          },
          cost: 0.001,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async listFiles(directory: string): Promise<ToolResult> {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const files: FileResult[] = [];

        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === 'file') {
            const file = await handle.getFile();
            files.push({
              name: name,
              content: '', // Don't load content for directory listing
              size: file.size,
              type: file.type,
              lastModified: new Date(file.lastModified),
            });
          }
        }

        return {
          success: true,
          data: files,
          cost: 0.001,
        };
      } else {
        return {
          success: false,
          error: 'Directory picker not supported in this browser',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteFile(path: string): Promise<ToolResult> {
    try {
      // Note: Browser File System Access API doesn't support direct file deletion
      // This would need to be implemented through a different approach
      return {
        success: false,
        error: 'File deletion not supported in browser environment',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validatePermissions(): Promise<boolean> {
    try {
      if ('showOpenFilePicker' in window) {
        // Test if we can access the file system
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
