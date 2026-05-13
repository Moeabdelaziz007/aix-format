# Schema fixtures

Each `.aix.json` file in this directory is a hand-crafted manifest that
exercises a specific schema surface for regression-detection purposes.

| Fixture | Purpose |
|---|---|
| `v0.369.0-optional-fields.aix.json` | Exercises every optional field added in the v0.369.0 schema bump: top-level `aix_version`; `skills[].safety_score`; `identity_layer.zk_proof` (Groth16 shape, mirrors `packages/aix-zkkyc/src/ProofVerifier.ts` `ZKProof`); `identity_layer.pi_uid_anchor` (SHA-256 hex of a Pi UID); and `economics.wallets[].x402_endpoint` (HTTP 402 settlement URL). Must validate against `schemas/aix.schema.json` with zero errors. |

To re-validate manually after schema changes:

```bash
pnpm install
node -e '
const Ajv2020 = require("./node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/2020.js").default;
const addFormats = require("./node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.20.0/node_modules/ajv-formats/dist/index.js").default;
const fs = require("fs");
const ajv = new Ajv2020({strict:false, allErrors:true});
addFormats(ajv);
const validate = ajv.compile(JSON.parse(fs.readFileSync("schemas/aix.schema.json","utf8")));
for (const f of fs.readdirSync("tests/fixtures/schema").filter(x=>x.endsWith(".aix.json"))) {
  const ok = validate(JSON.parse(fs.readFileSync("tests/fixtures/schema/"+f,"utf8")));
  console.log((ok?"PASS":"FAIL")+": "+f);
  if (!ok) console.log(JSON.stringify(validate.errors,null,2));
}'
```
