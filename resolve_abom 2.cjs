const fs = require('fs');
let content = fs.readFileSync('tests/abom.test.js', 'utf8');

content = content.replace(`<<<<<<< HEAD
// ── 15. abomSummary() counts correctly ───────────────────────────────────────
test('abomSummary returns correct counts', async () => {
=======
test("abomSummary returns correct counts", async () => {
>>>>>>> origin/main`, `// ── 15. abomSummary() counts correctly ───────────────────────────────────────
test('abomSummary returns correct counts', async () => {`);

content = content.replace(`<<<<<<< HEAD
  const module = await import('../core/parser.js');
  const AIXAgent = module.AIXAgent;
=======
  const { AIXAgent } = await import("../core/parser.js");
>>>>>>> origin/main`, `  const module = await import('../core/parser.js');
  const AIXAgent = module.AIXAgent;`);

fs.writeFileSync('tests/abom.test.js', content, 'utf8');
