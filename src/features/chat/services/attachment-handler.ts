/**
 * File Attachment Handler
 *
 * Handles file uploads, storage, and retrieval for chat attachments.
 * Uses Supabase Storage for secure file hosting.
 */

import { supabase } from '@shared/lib/supabase-client';
import type { Attachment } from '../types';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  attachment: Attachment;
  url: string;
  publicUrl: string;
}

export class AttachmentHandler {
  private readonly bucketName = 'chat-attachments';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
    // Office documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Code files
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/x-python',
    'text/x-java',
  ];

  /**
   * Initialize the storage bucket if it doesn't exist
   */
  async initializeBucket(): Promise<void> {
    const { data: buckets } = await supabase.storage.listBuckets();

    const bucketExists = buckets?.some((bucket) => bucket.name === this.bucketName);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(this.bucketName, {
        public: false, // Private bucket with signed URLs
        fileSizeLimit: this.maxFileSize,
        allowedMimeTypes: this.allowedTypes,
      });

      if (error) {
        console.error('Failed to create storage bucket:', error);
        throw new Error(`Failed to initialize storage: ${error.message}`);
      }
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`,
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    // Check filename for malicious patterns
    const filename = file.name.toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.app', '.dmg'];

    if (dangerousExtensions.some((ext) => filename.endsWith(ext))) {
      return {
        valid: false,
        error: 'Executable files are not allowed',
      };
    }

    return { valid: true };
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    userId: string,
    sessionId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const safeFilename = `${userId}/${sessionId}/${timestamp}_${randomString}.${extension}`;

    try {
      // Upload file
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(safeFilename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL (signed for private buckets)
      const { data: urlData } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(data.path, 3600 * 24 * 7); // 7 days

      if (!urlData) {
        throw new Error('Failed to generate signed URL');
      }

      // Create thumbnail for images
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        thumbnailUrl = await this.createThumbnail(file, safeFilename, userId, sessionId);
      }

      // Create attachment object
      const attachment: Attachment = {
        id: data.path,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.signedUrl,
        thumbnailUrl,
      };

      return {
        attachment,
        url: data.path,
        publicUrl: urlData.signedUrl,
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create thumbnail for images
   */
  private async createThumbnail(
    file: File,
    originalPath: string,
    userId: string,
    sessionId: string
  ): Promise<string | undefined> {
    try {
      // Create thumbnail using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Calculate thumbnail dimensions (max 200x200)
      const maxSize = 200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      if (!blob) return undefined;

      // Upload thumbnail
      const thumbnailPath = originalPath.replace(/\.[^/.]+$/, '_thumb.jpg');

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(thumbnailPath, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Thumbnail upload error:', error);
        return undefined;
      }

      // Get signed URL for thumbnail
      const { data: urlData } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(data.path, 3600 * 24 * 7);

      URL.revokeObjectURL(imageUrl);

      return urlData?.signedUrl;
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      return undefined;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    userId: string,
    sessionId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadFile(
        file,
        userId,
        sessionId,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage.from(this.bucketName).remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    // Also try to delete thumbnail if it exists
    const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
    await supabase.storage.from(this.bucketName).remove([thumbnailPath]);
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath: string): Promise<{
    name: string;
    size: number;
    type: string;
    url: string;
  } | null> {
    const { data, error } = await supabase.storage.from(this.bucketName).list(filePath);

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data[0];

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, 3600);

    return {
      name: file.name,
      size: file.metadata?.size || 0,
      type: file.metadata?.mimetype || 'application/octet-stream',
      url: urlData?.signedUrl || '',
    };
  }

  /**
   * Refresh signed URL for an attachment
   */
  async refreshSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      throw new Error('Failed to refresh signed URL');
    }

    return data.signedUrl;
  }

  /**
   * Get all attachments for a session
   */
  async getSessionAttachments(userId: string, sessionId: string): Promise<Attachment[]> {
    const folderPath = `${userId}/${sessionId}`;

    const { data, error } = await supabase.storage.from(this.bucketName).list(folderPath);

    if (error) {
      console.error('Failed to list attachments:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const attachments: Attachment[] = [];

    for (const file of data) {
      // Skip thumbnails
      if (file.name.includes('_thumb.')) continue;

      const filePath = `${folderPath}/${file.name}`;

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, 3600 * 24 * 7);

      if (urlData) {
        // Check for thumbnail
        const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
        const { data: thumbData } = await supabase.storage
          .from(this.bucketName)
          .createSignedUrl(thumbnailPath, 3600 * 24 * 7);

        attachments.push({
          id: filePath,
          name: file.name,
          type: file.metadata?.mimetype || 'application/octet-stream',
          size: file.metadata?.size || 0,
          url: urlData.signedUrl,
          thumbnailUrl: thumbData?.signedUrl,
        });
      }
    }

    return attachments;
  }

  /**
   * Download a file
   */
  async downloadFile(filePath: string, filename: string): Promise<void> {
    const { data, error } = await supabase.storage.from(this.bucketName).download(filePath);

    if (error || !data) {
      throw new Error('Failed to download file');
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const attachmentHandler = new AttachmentHandler();
