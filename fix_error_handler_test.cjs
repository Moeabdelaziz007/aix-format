const fs = require('fs');
let content = fs.readFileSync('tests/error_handler.test.js', 'utf8');

// The file has a dangling token bucket test section after CircuitBreaker describe block
const searchStr = `  it('should initialize with full capacity', () => {`;
const idx = content.indexOf(searchStr);
if (idx !== -1) {
    const endIdx = content.indexOf(`describe('AIXErrorHandler Integration', () => {`);
    content = content.substring(0, idx) + content.substring(endIdx);
    fs.writeFileSync('tests/error_handler.test.js', content);
}
