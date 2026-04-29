const fs = require('fs');

const path = 'apps/studio/src/components/studio/LiveValidator.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    try {
      const content = await file.text();
      let parsed: Record<string, unknown> | null = null;
      if (file.name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        const [{ load }] = await Promise.all([import("js-yaml")]);
        parsed = load(content) as Record<string, unknown>;
      let parsed: Record<string, unknown>;

      if (name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        parsed = parseYamlLight(content);
      }`;

const newCode = `    try {
      let parsed: Record<string, unknown>;

      if (name.endsWith(".json") || content.trim().startsWith("{")) {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } else {
        parsed = parseYamlLight(content);
      }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(path, content, 'utf8');
