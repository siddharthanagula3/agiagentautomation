/**
 * Vibe File Manager
 * File upload and reference system for VIBE interface
 */

import { supabase } from '@shared/lib/supabase-client';

/**
 * File metadata and reference
 */
export interface VibeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: Date;
  uploaded_by: string;
  session_id: string;
  // Updated: Nov 16th 2025 - Fixed any type
  metadata?: Record<string, unknown>;
}

/**
 * File upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * VibeFileManager
 * Manages file uploads, storage, and retrieval for VIBE sessions
 *
 * Features:
 * - Upload files to Supabase Storage
 * - Track file metadata in database
 * - Retrieve file content for agents
 * - Support for @ syntax file references
 * - Automatic cleanup of old files
 */
export class VibeFileManager {
  private readonly STORAGE_BUCKET = 'vibe-files';
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Upload a file to Supabase Storage
   *
   * @param file - File to upload
   * @param userId - User ID uploading the file
   * @param sessionId - VIBE session ID
   * @param onProgress - Optional progress callback
   * @returns Uploaded file metadata
   */
  async uploadFile(
    file: File,
    userId: string,
    sessionId: string,
    onProgress?: UploadProgressCallback
  ): Promise<VibeFile> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const sanitizedName = this.sanitizeFileName(file.name);
    const filePath = `${userId}/${sessionId}/${timestamp}-${sanitizedName}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // Create file metadata
      const vibeFile: VibeFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        uploaded_at: new Date(),
        uploaded_by: userId,
        session_id: sessionId,
        metadata: {
          original_path: filePath,
        },
      };

      // Save metadata to database
      const { error: dbError } = await supabase.from('vibe_files').insert({
        id: vibeFile.id,
        name: vibeFile.name,
        type: vibeFile.type,
        size: vibeFile.size,
        url: vibeFile.url,
        uploaded_at: vibeFile.uploaded_at.toISOString(),
        uploaded_by: vibeFile.uploaded_by,
        session_id: vibeFile.session_id,
        metadata: vibeFile.metadata || {},
      });

      if (dbError) throw dbError;

      return vibeFile;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload multiple files
   *
   * @param files - Files to upload
   * @param userId - User ID uploading the files
   * @param sessionId - VIBE session ID
   * @param onProgress - Optional progress callback for each file
   * @returns Array of uploaded file metadata
   */
  async uploadFiles(
    files: File[],
    userId: string,
    sessionId: string,
    onProgress?: UploadProgressCallback
  ): Promise<VibeFile[]> {
    const uploadedFiles: VibeFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const vibeFile = await this.uploadFile(
          file,
          userId,
          sessionId,
          (progress) => {
            if (onProgress) {
              // Calculate overall progress
              const fileProgress = progress / files.length;
              const totalProgress = (i / files.length) * 100 + fileProgress;
              onProgress(totalProgress);
            }
          }
        );

        uploadedFiles.push(vibeFile);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        // Continue with other files
      }
    }

    return uploadedFiles;
  }

  /**
   * Get files for a session
   *
   * @param sessionId - VIBE session ID
   * @returns Array of files for the session
   */
  async getFiles(sessionId: string): Promise<VibeFile[]> {
    try {
      const { data, error } = await supabase
        .from('vibe_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (!data) return [];

      return data.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        size: row.size,
        url: row.url,
        uploaded_at: new Date(row.uploaded_at),
        uploaded_by: row.uploaded_by,
        session_id: row.session_id,
        metadata: row.metadata,
      }));
    } catch (error) {
      console.error('Failed to get files:', error);
      return [];
    }
  }

  /**
   * Get file by ID
   *
   * @param fileId - File ID
   * @returns File metadata or null
   */
  async getFile(fileId: string): Promise<VibeFile | null> {
    try {
      const { data, error } = await supabase
        .from('vibe_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        url: data.url,
        uploaded_at: new Date(data.uploaded_at),
        uploaded_by: data.uploaded_by,
        session_id: data.session_id,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Failed to get file:', error);
      return null;
    }
  }

  /**
   * Download file content for agent use
   *
   * @param fileId - File ID
   * @returns File content as string or Buffer
   */
  async getFileContent(fileId: string): Promise<string | Buffer> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const filePath = file.metadata?.original_path;
      if (!filePath) {
        throw new Error('File path not found in metadata');
      }

      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .download(filePath);

      if (error) throw error;

      // For text files, convert to string
      if (file.type.startsWith('text/') || this.isTextFile(file.name)) {
        return await data.text();
      }

      // For binary files, return as buffer
      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw new Error(
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete file
   *
   * @param fileId - File ID to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const file = await this.getFile(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const filePath = file.metadata?.original_path;
      if (!filePath) {
        throw new Error('File path not found in metadata');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('vibe_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete all files for a session
   *
   * @param sessionId - VIBE session ID
   */
  async deleteSessionFiles(sessionId: string): Promise<void> {
    try {
      const files = await this.getFiles(sessionId);

      for (const file of files) {
        await this.deleteFile(file.id);
      }
    } catch (error) {
      console.error('Failed to delete session files:', error);
    }
  }

  /**
   * Cleanup old files
   *
   * @param olderThan - Delete files older than this date
   */
  async cleanup(olderThan: Date): Promise<void> {
    try {
      // Get files to delete
      const { data: files, error: selectError } = await supabase
        .from('vibe_files')
        .select('*')
        .lt('uploaded_at', olderThan.toISOString());

      if (selectError) throw selectError;
      if (!files || files.length === 0) return;

      // Delete from storage
      const filePaths = files
        .map((f) => f.metadata?.original_path)
        .filter((path): path is string => !!path);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .remove(filePaths);

        if (storageError) {
          console.error('Failed to delete files from storage:', storageError);
        }
      }

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('vibe_files')
        .delete()
        .lt('uploaded_at', olderThan.toISOString());

      if (dbError) throw dbError;

      // Cleaned up old files
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
    }
  }

  /**
   * Search files by name
   *
   * @param sessionId - VIBE session ID
   * @param query - Search query
   * @returns Array of matching files
   */
  async searchFiles(sessionId: string, query: string): Promise<VibeFile[]> {
    try {
      const files = await this.getFiles(sessionId);
      const normalizedQuery = query.toLowerCase();

      return files.filter((file) =>
        file.name.toLowerCase().includes(normalizedQuery)
      );
    } catch (error) {
      console.error('Failed to search files:', error);
      return [];
    }
  }

  /**
   * Get total storage used by user
   *
   * @param userId - User ID
   * @returns Total bytes used
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('vibe_files')
        .select('size')
        .eq('uploaded_by', userId);

      if (error) throw error;
      if (!data) return 0;

      return data.reduce((total, file) => total + file.size, 0);
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return 0;
    }
  }

  /**
   * Sanitize file name for storage
   *
   * @private
   */
  private sanitizeFileName(fileName: string): string {
    // Remove special characters and spaces
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_{2,}/g, '_');
  }

  /**
   * Check if file is a text file based on extension
   *
   * @private
   */
  private isTextFile(fileName: string): boolean {
    const textExtensions = [
      '.txt',
      '.md',
      '.json',
      '.xml',
      '.html',
      '.css',
      '.js',
      '.ts',
      '.tsx',
      '.jsx',
      '.py',
      '.java',
      '.c',
      '.cpp',
      '.h',
      '.cs',
      '.go',
      '.rs',
      '.rb',
      '.php',
      '.sh',
      '.yaml',
      '.yml',
      '.toml',
      '.ini',
      '.conf',
      '.log',
      '.csv',
      '.sql',
    ];

    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return textExtensions.includes(ext);
  }
}

// Export singleton instance
export const vibeFileManager = new VibeFileManager();
