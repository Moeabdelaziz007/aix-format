import fs from 'fs';
import path from 'path';

// Support running from root or apps/studio
const cwd = process.cwd();
const isStudioDir = cwd.endsWith('apps/studio');
const MANIFEST_PATH = isStudioDir
  ? path.join(cwd, '.next/routes-manifest.json')
  : path.join(cwd, 'apps/studio/.next/routes-manifest.json');

const EXPECTED_ROUTES = [
  '/',
  '/analytics',
  '/settings',
  '/my-agents',
  '/builder',
  '/identity',
  '/marketplace',
  '/spec',
  '/network-status'
];

async function validate() {
  console.log('🔍 Validating routes...');
  console.log('📂 Checking:', MANIFEST_PATH);

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Build manifest not found at:', MANIFEST_PATH);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const staticRoutes = manifest.staticRoutes.map((r: any) => r.page);

  const missing = EXPECTED_ROUTES.filter(route => !staticRoutes.includes(route));

  if (missing.length > 0) {
    console.error('❌ Missing expected routes:');
    missing.forEach(m => console.error(`  - ${m}`));
    process.exit(1);
  }

  console.log('✅ All expected routes are present in the build.');
}

validate();
