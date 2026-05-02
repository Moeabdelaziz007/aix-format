import { describe, it, expect } from 'vitest';
import { AIXParser } from '../core/parser'; // Adjust path if needed
import * as fs from 'fs';
import * as path from 'path';

describe('AIX Parser Integration Tests', () => {
  const examplesDir = path.resolve(__dirname, '../../examples');
  const parser = new AIXParser();

  // Get all .aix files in examples directory
  const exampleFiles = fs.readdirSync(examplesDir).filter(file => file.endsWith('.aix'));

  exampleFiles.forEach(file => {
    it(`should successfully parse example file: ${file}`, () => {
      const filePath = path.join(examplesDir, file);
      const agent = parser.parseFile(filePath);
      
      expect(agent).toBeDefined();
      expect(agent.data.meta).toBeDefined();
      expect(agent.data.meta.id).toBeDefined();
      expect(agent.data.persona).toBeDefined();
    });
  });
});
