# W3C Agent Identity Registry Protocol CG Submission Draft
# AIX (Artificial Intelligence eXchange) Format

**Date:** April 24, 2026
**Author:** Mohamed H Abdelaziz / AMRIKYY AI Solutions

## Abstract
The Artificial Intelligence eXchange (AIX) format is proposed to the W3C Agent Identity Registry Protocol CG. AIX is a comprehensive standard for sovereign agent identity and behavior, acting as a portable agent bundle rather than a simple manifest.

## 1. Portable Agent Bundle vs Manifest
Unlike traditional manifest formats (such as AgentCard), AIX serves as a complete, portable agent bundle. This means it encapsulates not just metadata, but the entire configuration, capabilities, identity, economics, and distribution references needed for an agent to operate autonomously across environments.

## 2. KYC-Signed Identity Layer
AIX incorporates a robust identity layer designed for Sybil resistance in agent marketplaces.
* Proof-of-Personhood: Backed by the PIon network with 18M verified users.
* Signatures: Supports detached, KYC-verified signatures via providers like `pi-network` or `axiomid`.

## 3. Economics and Policy
AIX is unique in embedding comprehensive economic models and data policies directly into the specification. It defines:
* Pricing models (e.g., pay-per-execution, subscription).
* Data access and retention policies, ensuring agent fiscal autonomy and data sovereignty.

## 4. Model-Agnostic Execution
The AIX format is entirely independent of underlying LLM architectures. It prevents vendor lock-in by defining interactions and capabilities in an abstract layer, allowing the agent to seamlessly switch or utilize any foundational model or runtime.

## 5. Compatibility with A2A AgentCard
AIX is designed as a bridge, not a competitor. It can seamlessly ingest and represent A2A AgentCard formats as a subset of its wider schema.
* Converters map existing AgentCard fields to AIX domains (`name -> meta.name`, `skills -> capabilities.tools`, etc.).
* AgentCards can be executed natively by an AIX engine.

## Conclusion
The AIX format provides a necessary foundation for the next generation of sovereign agents, bridging identity, economics, and compatibility into a single, cohesive standard.
