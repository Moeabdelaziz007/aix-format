/**
 * Deep Imports Refactoring Tool
 * Transforms relative paths like `../../../packages/aix-core/src/economics` 
 * into clean aliases like `@aix-core/economics`
 */
import fs from 'fs';
import path from 'path';

const TARGET_DIRS = ['apps/studio/src', 'packages', 'core'];

const ALIAS_MAP = [
    { regex: /(?:\.\.\/)+packages\/aix-core\/src\/?(.*)/g, replacement: '@aix-core/$1' },
    { regex: /(?:\.\.\/)+packages\/aix-agency\/pkg\/?(.*)/g, replacement: '@aix-agency/$1' },
    { regex: /(?:\.\.\/)+packages\/aix-zkkyc\/src\/?(.*)/g, replacement: '@aix-zkkyc/$1' },
    { regex: /(?:\.\.\/)+packages\/mcp-gateway\/src\/?(.*)/g, replacement: '@mcp-gateway/$1' },
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            results.push(filePath);
        }
    });
    return results;
}

console.log('🌌 Starting Deep Imports Refactor...');

let updatedFiles = 0;
TARGET_DIRS.forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);
    files.forEach((file) => {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content;
        ALIAS_MAP.forEach(({ regex, replacement }) => {
            newContent = newContent.replace(regex, (match, p1) => `"${replacement.replace('$1', p1)}"`);
        });
        if (content !== newContent) { fs.writeFileSync(file, newContent, 'utf8'); updatedFiles++; }
    });
});
console.log(`✅ Refactored ${updatedFiles} files to use pristine Path Aliases.`);