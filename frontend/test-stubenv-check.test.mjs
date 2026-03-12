import { vi } from 'vitest';
console.log('stubEnv' in vi ? 'stubEnv exists' : 'stubEnv missing');
console.log('unstubAllEnvs' in vi ? 'unstubAllEnvs exists' : 'unstubAllEnvs missing');
if ('stubEnv' in vi) {
  console.log('stubEnv type:', typeof vi.stubEnv);
}
process.exit(0);
