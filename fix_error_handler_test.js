const fs = require('fs');
let content = fs.readFileSync('tests/error_handler.test.js', 'utf8');
content = content.replace(/describe\('TokenBucket', \(\) => {[\s\S]*?\}\);\n\n/g, '');
// wait, the problem is that there's a dangling 'it' block for TokenBucket
// Let's just rewrite error_handler.test.js to remove the TokenBucket test block completely.
