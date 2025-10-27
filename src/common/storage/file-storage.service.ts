import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes: string[] = ['application/pdf'];

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>(
      'UPLOAD_DIR',
      './uploads/resumes',
    );
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(file: UploadedFile): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only PDF files are allowed`,
      );
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalFilename: string, prefix?: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalFilename);
    const sanitizedName = path
      .basename(originalFilename, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50);

    return `${prefix || 'file'}-${sanitizedName}-${timestamp}-${randomString}${ext}`;
  }

  /**
   * Save file to local storage
   */
  async saveFile(
    file: UploadedFile,
    filename: string,
  ): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.writeFile(filePath, file.buffer);
      this.logger.log(`File saved: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error('Failed to save file', error);
      throw new BadRequestException('Failed to save file');
    }
  }

  /**
   * Upload resume PDF
   */
  async uploadResumePDF(
    file: UploadedFile,
    resumeId: number,
  ): Promise<string> {
    this.validateFile(file);

    const filename = this.generateFilename(
      file.originalname,
      `resume-${resumeId}`,
    );
    const filePath = await this.saveFile(file, filename);

    return filePath;
  }

  /**
   * Get file from storage
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      const file = await fs.readFile(fullPath);
      return file;
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw new BadRequestException('File not found');
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!filePath) {
      return;
    }

    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${fullPath}`);
    } catch (error) {
      // Don't throw error if file doesn't exist
      this.logger.warn(`Failed to delete file: ${filePath}`, error.message);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
  } | null> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${filePath}`, error);
      return null;
    }
  }
}
