import { Client as MinioClient } from 'minio';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

let minioClient: MinioClient | null = null;

export function getMinio(): MinioClient {
  if (!minioClient) {
    minioClient = new MinioClient({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }
  return minioClient;
}

export async function ensureBucket(): Promise<void> {
  const client = getMinio();
  try {
    const exists = await client.bucketExists(config.minio.bucket);
    if (!exists) {
      await client.makeBucket(config.minio.bucket);
      logger.info({ bucket: config.minio.bucket }, 'MinIO bucket created');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to ensure MinIO bucket');
    throw err;
  }
}

export async function uploadSnapshot(
  key: string,
  data: Buffer | string,
  contentType = 'application/json',
): Promise<{ key: string; size: number }> {
  const client = getMinio();
  const buffer = typeof data === 'string' ? Buffer.from(data) : data;
  await client.putObject(config.minio.bucket, key, buffer, buffer.length, {
    'Content-Type': contentType,
  });
  return { key, size: buffer.length };
}

export async function getSnapshot(key: string): Promise<Buffer> {
  const client = getMinio();
  const stream = await client.getObject(config.minio.bucket, key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteSnapshot(key: string): Promise<void> {
  const client = getMinio();
  await client.removeObject(config.minio.bucket, key);
}
