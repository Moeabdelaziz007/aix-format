import { describe, it, expect } from 'vitest';
import { AIXParser } from '../../core/parser.js';
import * as fs from 'fs';
import * as path from 'path';

describe('AIX Parser Integration Tests', () => {
  const examplesDir = path.resolve(__dirname, '../../examples');
  const parser = new AIXParser();

  // Get all .aix files in examples directory.
  const exampleFiles = fs.readdirSync(examplesDir).filter((file) => file.endsWith('.aix'));

  exampleFiles.forEach((file) => {
    it(`should successfully parse example file: ${file}`, async () => {
      const filePath = path.join(examplesDir, file);
      // parser.parseFile is async — without await, `agent` is a Promise
      // and the next assertions all blow up on `.data` being undefined,
      // which used to surface as Unhandled Rejections in vitest output.
      const agent = await parser.parseFile(filePath);

      expect(agent).toBeDefined();
      expect(agent.data.meta).toBeDefined();
      expect(agent.data.meta.id).toBeDefined();
      expect(agent.data.persona).toBeDefined();
    });
  });
});
