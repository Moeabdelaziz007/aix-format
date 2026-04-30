const fs = require('fs');
const content = fs.readFileSync('schemas/aix.schema.json', 'utf8');
const lines = content.split('\n');
const result = [];
let keeping = true;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<<<<<<< HEAD')) {
        // Keep everything until =======
        continue;
    } else if (line.includes('=======')) {
        keeping = false;
        continue;
    } else if (line.includes('>>>>>>>')) {
        keeping = true;
        continue;
    }
    
    if (keeping) {
        result.push(line);
    }
}
fs.writeFileSync('schemas/aix.schema.json', result.join('\n'));
console.log('Resolved aix.schema.json');
