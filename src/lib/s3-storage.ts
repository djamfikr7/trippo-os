import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'trippo-uploads';

// Types
export interface UploadedFile {
  url: string;
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FileUploadOptions {
  folder: 'documents' | 'avatars' | 'vehicle-images' | 'trip-photos';
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  requireAuth?: boolean;
}

/**
 * Upload file to S3
 */
export async function uploadFile(
  file: File | Buffer,
  options: FileUploadOptions = {}
): Promise<UploadedFile> {
  const {
    folder = 'documents',
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSize = 10 * 1024 * 1024, // 10MB default
    requireAuth = true,
  } = options;

  // Generate unique key
  const key = `${folder}/${uuidv4()}-${file instanceof File ? file.name : 'file'}`;

  // Get file content
  const fileContent = file instanceof File ? await file.arrayBuffer() : file;
  const fileMime = file instanceof File ? file.type : 'application/octet-stream';
  const fileSize = file instanceof File ? file.size : fileContent.length;

  // Validate file type
  if (file instanceof File && !allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate file size
  if (fileSize > maxSize) {
    throw new Error(`File size ${fileSize} exceeds maximum ${maxSize} bytes`);
  }

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: fileMime,
    ACL: 'public-read', // Make files publicly accessible
  });

  await s3Client.send(command);

  // Generate public URL
  const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    url,
    key,
    fileName: file instanceof File ? file.name : 'file',
    size: fileSize,
    mimeType: fileMime,
    uploadedAt: new Date(),
  };
}

/**
 * Generate signed URL for private files
 */
export async function generateSignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(command, s3Client, { expiresIn });
  return signedUrl;
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get file info from S3
 */
export async function getFileInfo(key: string): Promise<{
  size: number;
  lastModified: Date;
}> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return {
      size: 0,
      lastModified: new Date(),
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options: FileUploadOptions = {}
): Promise<UploadedFile[]> {
  const uploads = files.map((file) => uploadFile(file, options));
  return Promise.all(uploads);
}

/**
 * Validate file
 */
export function validateFile(
  file: File,
  options: FileUploadOptions = {}
): { valid: boolean; error?: string } {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSize = 10 * 1024 * 1024,
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${file.size} bytes exceeds maximum ${maxSize} bytes`,
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: 'File name is required',
    };
  }

  return { valid: true };
}

/**
 * Generate thumbnail URL
 */
export function generateThumbnailUrl(originalKey: string): string {
  const originalExt = path.extname(originalKey);
  const originalBaseName = path.basename(originalKey, originalExt);
  const thumbnailKey = `${originalBaseName}_thumb${originalExt}`;
  
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;
}

/**
 * Get folder contents
 */
export async function listFilesInFolder(
  folder: string,
  maxKeys: number = 100
): Promise<UploadedFile[]> {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: `${folder}/`,
    MaxKeys: maxKeys,
  });

  const response = await s3Client.send(command);
  const files = (response.Contents || []).map((obj) => ({
    url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
    key: obj.Key || '',
    fileName: path.basename(obj.Key || ''),
    size: obj.Size || 0,
    mimeType: 'application/octet-stream',
    uploadedAt: obj.LastModified || new Date(),
  }));

  return files;
}
