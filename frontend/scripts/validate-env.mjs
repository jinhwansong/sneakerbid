#!/usr/bin/env node
/**
 * 프론트엔드 환경변수 검증
 * NEXT_PUBLIC_SITE_URL 등 필수 변수 확인
 * 사용: npm run env:validate (frontend 디렉토리에서)
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const envFiles = ['.env.local', '.env.development', '.env'];
let env = {};
for (const f of envFiles) {
  const p = join(root, f);
  env = { ...env, ...parseEnvFile(p) };
}

const required = ['NEXT_PUBLIC_SITE_URL'];
const missing = required.filter((key) => {
  const val = process.env[key] ?? env[key];
  return !val || String(val).trim() === '';
});

if (missing.length > 0) {
  console.error('✗ 환경변수 검증 실패. 다음 변수가 필요합니다:', missing.join(', '));
  console.error('  .env.local 또는 .env에 NEXT_PUBLIC_SITE_URL을 설정하세요.');
  process.exit(1);
}

console.log('✓ 프론트엔드 환경변수 검증 완료');
process.exit(0);
