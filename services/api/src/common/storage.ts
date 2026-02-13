import { Client } from 'minio';
import { config } from '@config/index';
import { logger } from '@common/logger';

const minioClient = new Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

const BUCKET_NAME = config.MINIO_BUCKET_NAME;

export const initializeStorage = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME);
      logger.info(`Created bucket: ${BUCKET_NAME}`);
      
      // Set bucket policy to allow public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    logger.error('Failed to initialize MinIO storage:', error);
    throw error;
  }
};

export const uploadToMinio = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = ''
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = folder 
      ? `${folder}/${timestamp}-${sanitizedName}`
      : `${timestamp}-${sanitizedName}`;

    await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    const protocol = config.MINIO_USE_SSL ? 'https' : 'http';
    const url = `${protocol}://${config.MINIO_ENDPOINT}:${config.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;
    
    logger.info(`File uploaded: ${fileName}`);
    return url;
  } catch (error) {
    logger.error('Failed to upload file to MinIO:', error);
    throw error;
  }
};

export const deleteFromMinio = async (fileName: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
    logger.info(`File deleted: ${fileName}`);
  } catch (error) {
    logger.error('Failed to delete file from MinIO:', error);
    throw error;
  }
};

export const getPresignedUrl = async (
  fileName: string,
  expirySeconds: number = 3600
): Promise<string> => {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, fileName, expirySeconds);
  } catch (error) {
    logger.error('Failed to generate presigned URL:', error);
    throw error;
  }
};
