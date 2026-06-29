import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { imageSize } from 'image-size';
import { config } from '../config.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const mimeExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function uploadRoot() {
  return path.resolve(config.uploadDir);
}

function publicPath(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`;
}

function assertValidImage(file: Express.Multer.File) {
  const extension = mimeExtensions[file.mimetype];
  if (!extension) {
    throw new Error('unsupported image type');
  }

  let dimensions: { width?: number; height?: number };
  try {
    dimensions = imageSize(file.buffer);
  } catch {
    throw new Error('invalid image');
  }
  if (!dimensions.width || !dimensions.height) {
    throw new Error('invalid image');
  }

  return { extension, width: dimensions.width, height: dimensions.height };
}

export async function saveUploadedImage(
  file: Express.Multer.File,
  subdir: 'garden-backgrounds' | 'garden-assets',
  requiredSize?: { width: number; height: number },
) {
  const image = assertValidImage(file);
  if (requiredSize && (image.width !== requiredSize.width || image.height !== requiredSize.height)) {
    throw new Error('invalid image dimensions');
  }

  const directory = path.join(uploadRoot(), subdir);
  await fs.mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${image.extension}`;
  const absolutePath = path.join(directory, filename);
  await fs.writeFile(absolutePath, file.buffer);

  return {
    path: publicPath(subdir, filename),
    absolutePath,
    width: image.width,
    height: image.height,
  };
}

export async function deleteUploadedImageIfManaged(imagePath?: string | null) {
  if (!imagePath?.startsWith('/uploads/')) return;
  const relativePath = imagePath.replace(/^\/uploads\//, '');
  const absolutePath = path.resolve(uploadRoot(), relativePath);
  if (!absolutePath.startsWith(uploadRoot())) return;
  await fs.rm(absolutePath, { force: true }).catch(() => undefined);
}
