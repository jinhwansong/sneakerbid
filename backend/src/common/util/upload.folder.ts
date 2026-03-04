import fs from 'fs';
import path from 'path';

/** process.cwd() 기준으로 업로드 폴더 생성 후 전체 경로 반환 */
export function getOrCreateUploadDir(folderName = 'uploads'): string {
  const fullPath = path.join(process.cwd(), ...folderName.split('/'));
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}
