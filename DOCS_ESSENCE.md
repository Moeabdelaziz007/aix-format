# AIX Essence: Unified Capability Specification
> This document defines the standard for "AIX Essences" and "AIX Packs" — the successor to fragmented skills, plugins, and MCP servers.

## 1. The Core Concept
An **AIX Essence** is an atomic unit of capability. It encapsulates everything an agent needs to perform a specific set of actions, from high-level "Skills" to low-level "MCP" configurations and binary "DNA" (Rust/WASM).

### Why the shift?
- **Fragmentation**: Juggling separate skill repos, plugin stores, and MCP registries is a 2024 problem.
- **Portability**: An Essence is a self-contained folder that can be verified and injected into any AIX-compliant runtime (Avatar).
- **Security**: Boundaries are defined at the Essence level, not just at the process level.

## 2. Directory Structure (The AIX Pack)
An **AIX Pack** is a collection of Essences. The recommended structure for the `aix-agent-skills` repository is:

```
/packs
  /[pack-name]
    essence.json          <-- The Manifest (schemas/modules/essence.schema.json)
    /skills               <-- Procedural logic (Hermes pattern)
      *.hermes
      *.skill.md
    /mcp                  <-- MCP Server configurations
      server.json
    /dna                  <-- High-performance / Secure logic
      src/*.rs            (Source)
      pkg/*.wasm          (Compiled DNA)
    /assets               <-- Icons, local data, models
```

## 3. The One-File Essence (Symphony Pattern)
For simpler capabilities, an Essence can be defined in a **single Markdown file** (e.g., `essence.md` or `WORKFLOW.md`) using YAML frontmatter for configuration and Markdown for the prompt/instructions.

### Example:
```markdown
---
essence_id: "social-twitter"
kind: "toolset"
capabilities:
  mcp: { server: "twitter-mcp" }
---
# Twitter Essence Instructions
Always use professional tone. Never share secrets...
```

## 4. Quantum Topology Integration
In the `aix.topology.json`, these Essences are represented as **Nodes**.

- **Nodes**: Instances of an Essence.
- **Edges**: Neural paths (state handoffs).
- **Boundaries**: Permission wrappers around nodes.

## 5. Implementation (Triple Threat)
- **TS (Forge)**: Used to build the `essence.json` and visual tools in the Studio.
- **Rust (DNA)**: The compiled logic inside the `/dna` folder for security-critical tasks.
- **Go (Agency)**: The runtime that loads and orchestrates the topology of Essences.
