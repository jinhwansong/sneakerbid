/**
 * E2E 전용 setup. CI에서 env가 없으면 validation 실패 전에 건너뛰기 위해
 * process.env를 채움. GitHub Secrets가 주입되면 실제 값이 사용됨.
 * Secrets가 없으면 빈 문자열 → validation 실패 → 테스트 실패.
 * CI에서 E2E를 건너뛰려면 workflow에서 if 조건 사용.
 */
import * as path from 'path';
import { config } from 'dotenv';

// 로컬: backend/ 또는 repo root에서 .env 로드 (working-directory에 따라 다름)
const cwd = process.cwd();
const envPaths = [
  path.join(cwd, '.env.local'),
  path.join(cwd, '.env'),
  path.join(cwd, '..', '.env.local'),
  path.join(cwd, '..', '.env'),
];
for (const p of envPaths) {
  config({ path: p });
}

// CI에서 PORT가 없으면 기본값 (validation 통과용)
if (!process.env.PORT) {
  process.env.PORT = '4000';
}
