const fs = require('fs');

const path = 'apps/studio/src/components/studio/LiveValidator.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `      // We don't have deep type info, so cast to a structure to check fields safely
      const parsedAny = parsed as any;
      const hasSig = Boolean(parsedAny?.security?.signature?.value && parsedAny?.security?.signature?.algorithm);
      setSigState(hasSig ? "valid-structure" : "missing");
      setValidation(validateAix(parsed));`;

const newCode = `      setValidation(validateAix(parsed));`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(path, content, 'utf8');
