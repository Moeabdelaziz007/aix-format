# AIX Project Guidelines

## Project Structure
- `packages/aix-core`: The heart of the AIX system, containing core logic, security, and swarm routing.
- `apps/studio`: A frontend application for interacting with the AIX system.
- `apps/aix-detective`: Specialized application for detection and analysis.
- `core/`: Legacy or shared core components.
- `schemas/`: Centralized schema definitions.

## Technical Standards
- **TypeScript**: Mandatory for all new code.
- **Validation**: Use `Zod` for all external inputs and API boundaries.
- **Security**: Focus on trust and safety (refer to AIX Constitution).
- **Style**: Functional, elegant, and minimal code.

## Workflow
- Always refer to the AIX Agent Constitution v0.369.
- Use `prompts/` directory for living documentation of agent behavior and rules.
- Run tests (Vitest) before submitting significant changes.
- Build the project to ensure type safety and compilation.
