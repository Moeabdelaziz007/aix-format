#!/usr/bin/env ts-node
/**
 * Script to wrap remaining pages with ErrorBoundary
 * Wraps: deploy, pricing, playground pages
 */

import fs from 'fs';
import path from 'path';

const pages = [
  'apps/studio/src/app/deploy/page.tsx',
  'apps/studio/src/app/pricing/page.tsx',
  'apps/studio/src/app/playground/page.tsx'
];

pages.forEach(pagePath => {
  const fullPath = path.join(process.cwd(), pagePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Add ErrorBoundary import if not present
  if (!content.includes('ErrorBoundary')) {
    // Find the last import statement
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
    const insertPosition = content.indexOf('\n', lastImportIndex) + 1;
    
    content = content.slice(0, insertPosition) + 
              `import { ErrorBoundary } from "@/components/shared/ErrorBoundary";\n` +
              content.slice(insertPosition);
  }
  
  // Find the return statement and wrap it
  const returnMatch = content.match(/(\s+return\s+\(?\s*\n\s*<)/);
  if (returnMatch) {
    const returnIndex = content.indexOf(returnMatch[0]);
    const beforeReturn = content.slice(0, returnIndex + returnMatch[1].length);
    const afterReturn = content.slice(returnIndex + returnMatch[1].length);
    
    // Find the closing of the return statement
    let depth = 0;
    let closeIndex = 0;
    for (let i = 0; i < afterReturn.length; i++) {
      if (afterReturn[i] === '<') depth++;
      if (afterReturn[i] === '>') depth--;
      if (depth === 0 && afterReturn.slice(i, i + 4) === '\n  )') {
        closeIndex = i;
        break;
      }
    }
    
    const mainContent = afterReturn.slice(0, closeIndex);
    const afterContent = afterReturn.slice(closeIndex);
    
    content = beforeReturn + '\n    <ErrorBoundary>\n    ' + mainContent + '\n    </ErrorBoundary>' + afterContent;
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Wrapped ${pagePath}`);
});

console.log('\n🎉 All pages wrapped with ErrorBoundary!');

// Made with Moe Abdelaziz
