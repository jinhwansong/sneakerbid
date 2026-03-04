import fs from 'fs';
import path from 'path';

/** process.cwd() 기준으로 업로드 폴더 생성 후 전체 경로 반환 */
export function getOrCreateUploadDir(folderName = 'uploads'): string {
  let safeName = path.basename(folderName) || 'uploads';
  if (safeName === '..' || safeName === '.') {
    safeName = 'uploads';
  }
  const fullPath = path.join(process.cwd(), safeName);
  fs.mkdirSync(fullPath, { recursive: true });
  return fullPath;
}
