import path from 'path';
import fs from 'fs';

// Resolve documents directory (works in Docker container or locally)
export function getDocumentsDir(): string {
  if (process.env.STORAGE_DOCUMENTS_DIR && fs.existsSync(process.env.STORAGE_DOCUMENTS_DIR)) {
    return process.env.STORAGE_DOCUMENTS_DIR;
  }
  // Local fallback: repo_root/storage/documents
  const localDir = path.resolve(__dirname, '../../../storage/documents');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}

// Resolve uploads directory (works in Docker container or locally)
export function getUploadsDir(): string {
  if (process.env.STORAGE_UPLOADS_DIR && fs.existsSync(process.env.STORAGE_UPLOADS_DIR)) {
    return process.env.STORAGE_UPLOADS_DIR;
  }
  // Local fallback: repo_root/storage/uploads
  const localDir = path.resolve(__dirname, '../../../storage/uploads');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}
