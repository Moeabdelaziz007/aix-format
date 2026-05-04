const fs = require('fs');
const content = fs.readFileSync('packages/aix-types/index.d.ts', 'utf8');
const newContent = content.replace(
  '  signature?: Signature;\n}',
  '  signature?: Signature;\n  dna_hash?: string;\n}'
);
fs.writeFileSync('packages/aix-types/index.d.ts', newContent);
