# aix-detective — CLI Scanner

## Usage
  node apps/aix-detective/index.js scan ./my-agent.aix

## Checks
  - Schema v1.3 compliance
  - DID format (did:aix: prefix)
  - integrity_hash (valid SHA-256)
  - capabilities not empty
  - format_version === "1.3"

## Exit codes: 0=clean, 1=warnings, 2=errors

## CI Usage
  for file in examples/*.aix; do
    node apps/aix-detective/index.js scan "$file"
  done
