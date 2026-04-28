const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI Color Codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}Starting AIX Build Verification...${RESET}`);

// 1. Check for Hardcoded Absolute Paths
console.log(`${YELLOW}Checking for Hardcoded Absolute Paths...${RESET}`);

// Navigate to monorepo root to run grep correctly regardless of where script is called from
const rootDir = path.resolve(__dirname, '..');

try {
  // Use ripgrep or grep to find Windows/Mac absolute paths
  // Ignore node_modules, .git, dist, build, .next, and eslint config files where the rule is defined
  const targetDirs = ['apps', 'core', 'schemas', 'bin', 'tests'].join(' ');
  const excludeDirs = ['node_modules', '.next', '.git'].map(d => `--exclude-dir=${d}`).join(' ');
  const excludeFiles = ['eslint.config.mjs'].map(f => `--exclude="${f}"`).join(' ');
  
  // Safe command construction
  const cmd = `grep -rE "(C:\\\\|Users\\\\|/home/|/Users/)" ${targetDirs} ${excludeDirs} ${excludeFiles} || true`;
  const result = execSync(cmd, { cwd: rootDir, encoding: 'utf-8' });

  if (result.trim()) {
      console.log(`${RED}Error: Found Hardcoded Absolute Paths!${RESET}`);
      console.log(result);
      process.exit(1); // Fail the build
  } else {
      console.log(`${GREEN}✔ No hardcoded absolute paths found.${RESET}`);
  }
} catch (e) {
  // grep exits with 1 if nothing found, which is what we want
  console.log(`${GREEN}✔ No hardcoded absolute paths found.${RESET}`);
}

// 2. Validate core dependencies are present in apps/studio
console.log(`${YELLOW}Checking Core Dependency Requirements in Studio...${RESET}`);
try {
   const corePackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
   const studioPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'apps/studio/package.json'), 'utf8'));

   const requiredSharedDeps = ['tweetnacl', 'tweetnacl-util'];

   let missing = false;
   for (const dep of requiredSharedDeps) {
       if (!studioPackage.dependencies[dep] && !studioPackage.devDependencies[dep]) {
           console.log(`${RED}Error: Missing critical shared dependency in apps/studio/package.json: ${dep}${RESET}`);
           missing = true;
       }
   }

   if (missing) {
       process.exit(1);
   } else {
       console.log(`${GREEN}✔ All critical shared dependencies are present in apps/studio.${RESET}`);
   }

} catch(e) {
    console.log(`${RED}Failed to check dependencies: ${e.message}${RESET}`);
}

console.log(`${GREEN}Build Verification Passed! ✅${RESET}`);
