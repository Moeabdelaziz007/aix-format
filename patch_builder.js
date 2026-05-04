const fs = require('fs');
const content = fs.readFileSync('apps/studio/src/app/builder/page.tsx', 'utf8');

const targetStr = `        const manifest = JSON.parse(JSON.stringify(formData));
        manifest.security.checksum.value = liveChecksum;`;

const newStr = `        const manifest = JSON.parse(JSON.stringify(formData));
        manifest.security.checksum.value = liveChecksum;

        // Generate DNA Fingerprint
        try {
          const res = await fetch('/api/dna/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manifest),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.dna_hash) {
              manifest.identity_layer.dna_hash = data.dna_hash;
            }
          }
        } catch (err) {
          console.error("Failed to generate DNA fingerprint", err);
        }`;

const newContent = content.replace(targetStr, newStr);
fs.writeFileSync('apps/studio/src/app/builder/page.tsx', newContent);
