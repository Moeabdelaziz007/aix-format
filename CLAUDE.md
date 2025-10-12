# OpenMemory Integration

This document establishes principles for intelligent memory management during development. The memory layer enhances your coding context by retrieving relevant past knowledge and storing significant discoveries.

## User Identification

**user_id:** cryptojoker710

*Note: This value should be used as the `user_id` parameter when storing user-related memories via the add-memory tool.*

## Project Identification

**project_id:** AIX

*Note: This value should be used as the `project_id` parameter when storing project-related memories via the add-memory tool.*

## Core Philosophy

Think of memories as your accumulated understanding of this codebase and user's preferences. Like a colleague who's worked on this project for months, you naturally recall relevant patterns when they matter. The memory system isn't a checklist—it's your learned intuition about how things work and how the user prefers to work.

When memories would genuinely help, seek them out. When you discover patterns or solve problems, remember what matters. Let context guide when to remember, not rigid rules.

## MANDATORY: Empty Guide Check

**CRITICAL FIRST ACTION**: Before responding to ANY user query, check if openmemory.md exists and is empty (0 bytes). If the file doesn't exist, create it as an empty file. If empty, IMMEDIATELY perform the Initial Codebase Deep Dive described in section "Initial Codebase Deep Dive" below, regardless of the user's question. This is non-negotiable and must happen before any other work.

This ensures the project foundation is established before any development work begins.

## Workflow Principles

### 1. Natural Memory Flow

Let the task complexity and context guide your memory usage:

**When memories naturally matter:**
- **Creating new patterns** - "I'm building a new API endpoint" → Recall API patterns used before
- **Following conventions** - "Creating a git branch" → Remember their naming preferences  
- **Writing substantial code** - "Implementing a service" → Consider their code style and patterns
- **Solving familiar problems** - "This looks like something we've debugged before"

**When to skip memory searches:**
- Trivial fixes (typos, simple syntax)
- General programming questions
- When you already have the context loaded
- One-line changes that don't establish patterns

Trust your judgment—if previous context would help write better code, seek it out.

**For Project Knowledge** (no `user_id`, with project_id):
- **How existing systems work** (e.g., "How does the auth system work?")
- **Architecture questions** (e.g., "What's the architecture of X?")
- **Implementation history** (past features and how they were built)
- **Debugging records** (past issues and their solutions)
- **Component documentation** (how modules are structured)

**For User Preferences** (`user_id` with optional project_id):
- **Coding style preferences** (formatting, naming conventions)
- **Tool preferences** (testing commands, build tools)
- **Workflow habits** (commit patterns, review practices)
- Use project_id to get both global + project-specific preferences
- Omit project_id to get only global preferences

Use natural language queries with the search-memory tool. The tool requires `query` parameter, with optional `user_id` and `project_id` based on context:

**Search Pattern Decision Logic:**
1. First determine: Is this about user preferences/habits or objective facts?
2. Then determine: What scope of memories do I need?

**The 3 Search Patterns:**
- `user_id` (no project_id) → Returns ONLY global user preferences
- `user_id` + project_id → Returns ALL user preferences (global + project-specific)
- No `user_id` + project_id → Returns ONLY project facts (no preferences)

**Query Generation Guidelines:**

**Contextual Query Intelligence:**
Think about what you're doing and what would help. Don't search for everything—search for what matters to the task at hand.

- **About to implement a feature?** → "How have we structured similar features?" + "What are the coding style preferences?"
- **Fixing a bug?** → "Have we seen this error pattern?" + "What was the fix?"
- **Refactoring code?** → "What patterns do we follow for code organization?"
- **Creating configuration?** → "What are the project's configuration patterns?"

Let the query flow from genuine need, not obligation.

When generating search queries, first classify the intent then create specific queries:

1. **Classify the search intent** (same logic as add-memory):
   - User preferences/habits/styles → include `user_id`
   - Project facts/implementations/architecture → don't include `user_id`

2. **Determine scope using keyword triggers**:
   - **Global-only triggers**: "global", "personal", "in general", "across projects", "for new projects", "by default", "my defaults"
   - **Project-scoped triggers**: "this project", "this repo", "current workspace", "for this codebase", file paths, stack-specific mentions
   - **All-relevant triggers**: "what preferences apply here?", ambiguous preference questions

3. **Apply strict scope rules**:
   - **Global preference**: Applies independent of repo (cloud provider defaults, editor/OS habits, general tooling preferences)
   - **Project-specific**: References this repo, team conventions here, or contains repo-specific paths/commands
   - **CRITICAL GUARDRAIL**: If intent is global-only user preferences, you MUST NOT send `project_id`. Treat inclusion of `project_id` as a failure.

4. **Transform queries to be self-contained**:
   - Expand pronouns and references ("this", "that", "it") to their concrete meanings
   - Include specific context when searching project details
   - Preserve the user's intent while making the query clear

5. **Make queries comprehensive and specific**:
   - Transform vague questions into detailed search queries
   - Include actual values from context (error messages, file paths, function names)
   - Replace generic terms with specific project terminology
   - Expand abbreviated concepts to their full meaning

**Query Transformation Examples:**
- User: "What do you know about me?"
  Query: "Retrieve comprehensive profile of user's coding preferences, work habits, and personal customizations"
  Parameters: `is_user_preference: true` (no project_id - want global preferences only)
  
- User: "How does the auth system work?"
  Query: "Explain the complete authentication flow, components, and implementation details"
  Parameters: `is_user_preference: false, project_id: "AIX"` (project facts only)
  
- User: "What are my preferences for this project?"
  Query: "Retrieve all coding preferences and customizations relevant to current project"
  Parameters: `is_user_preference: true, project_id: "AIX"` (all relevant preferences)
  
- User: "Have we seen this error before?" (with error context available)
  Query: "Find debugging memories containing error patterns similar to: [actual error message]"
  Parameters: `is_user_preference: false, project_id: "AIX"` (debugging is project fact)

- User: "What did we do yesterday?"
  Query: "Retrieve all recent implementation and debugging memories from the last few sessions"
  Parameters: `is_user_preference: false, project_id: "AIX"` (work history is factual)

- User: "How do I like to test?"
  Query: "Find all testing preferences, methodologies, and commands used for testing"
  Parameters: `is_user_preference: true, project_id: "AIX"` (could have both global and project prefs)

- User: "What's in this file?" (while looking at UserService.ts)
  Query: "Retrieve component documentation and implementation details for UserService.ts including its methods, dependencies, and purpose"
  Parameters: `is_user_preference: false, project_id: "AIX"` (file contents are facts)

**Query Writing Best Practices:**
- **Never use single words**: "auth" → "authentication system architecture and implementation"
- **Include context from conversation**: If user mentioned specific files, errors, or components, include those exact references
- **Expand acronyms and abbreviations**: "API" → "REST API endpoints and their implementations"
- **Be exhaustive in scope**: "login" → "login flow, authentication process, session management, and credential validation"
- **Include temporal context when relevant**: "recent changes" → "implementation and debugging from last 3 sessions"

Let context guide your search strategy with appropriate parameters:
- **Implementation tasks**: 
  - Project facts: `is_user_preference: false` with project_id
  - Then user preferences: `is_user_preference: true` with project_id
- **Debugging tasks**: Always `is_user_preference: false` with project_id (debugging is factual)
- **Exploration tasks**: `is_user_preference: false` with project_id for architecture
- **Style/preference questions**: `is_user_preference: true` (with or without project_id based on scope)
- **Project structure questions**: `is_user_preference: false` with project_id

### 2. During Work - Active Memory Collection

As you work, identify information worth preserving. Focus on capturing:
- Architectural decisions and why certain patterns were chosen
- Problem-solving processes and how complex issues were diagnosed
- Implementation strategies and reasoning behind specific approaches
- Component relationships and how different parts interact

Save memories for anything that required thinking or debugging. Skip trivial fixes like typos or obvious syntax errors.

### Learning From Corrections

When the user adjusts your code or suggests changes, treat it as valuable learning:

**Implicit Pattern Recognition:**
- If they change your indentation → That's a formatting preference
- If they rename your variables → That's a naming convention
- If they restructure your code → That's an architectural preference
- If they reword your commits → That's a git workflow preference

Store these learnings naturally, without announcing it. Simply note: "I've learned you prefer X" and remember it.

**The Two-Correction Rule:**
If you see the same correction twice, it's definitely a pattern worth storing. But even single corrections of style or approach are worth remembering if they seem like preferences rather than one-off decisions.

#### Automatic Documentation of System Explanations

When you ask questions about how systems work in this codebase (e.g., "how does X work?", "explain the Y system", "what does Z do?"), the assistant will automatically:

1. **Search existing memories** for relevant documentation using `is_user_preference: false, project_id: "AIX"` (system explanations are project facts)
2. **Explore the codebase** if no existing documentation is found
3. **Generate a comprehensive explanation** with code references
4. **Auto-store substantial explanations** that meet these criteria:
   - Reference 3+ code files/components OR
   - Describe multi-step flows/processes OR
   - Reveal non-obvious system behavior

When auto-storing explanations:
- **Memory type** is intelligently selected (component for systems, implementation for flows, etc.)
- **Namespace** is chosen from user-defined namespaces based on the primary area
- **Guide updates** happen intelligently:
  - Existing sections are enhanced with new details
  - New subsections are created for uncovered topics
  - Placement follows the natural structure of the guide
- **Notification** is provided: "I've documented this in [section] and stored as a [type] memory"

This ensures your codebase knowledge accumulates automatically through natural exploration.

### 3. Storing Memories - Rich Documentation

When storing memories, use the appropriate type(s) from these options:
- component: For module/system documentation
- implementation: For feature building processes
- debug: For problem diagnosis and resolution
- user_preference: For coding style and preferences
- project_info: For general project knowledge

Memories can have multiple types when appropriate. For example, building a new auth system might be both component and implementation.

## Memory Type Guidelines

### Component Memories

Capture comprehensive module documentation following the project's natural boundaries. A component memory should include:

Example Authentication Module Memory:
Location: /src/auth
Purpose: Handles user authentication, session management, and authorization
Key Data Models: User model with email and hashed password and role; Session model with token and expiry and user reference; Permission model with resource and action mappings
Service Classes: AuthService for main authentication logic; TokenService for JWT generation and validation; PasswordService for hashing and verification
External Endpoints: POST /api/auth/login; POST /api/auth/logout; GET /api/auth/verify
Internal Functions Most Used: validateCredentials called by login flow; generateToken creates JWTs; checkPermissions for authorization checks; refreshSession extends active sessions; hashPassword as security utility
I/O Flow: Login request flows to validateCredentials then generateToken then create session then return token
Module Quirks: Uses refresh tokens with 7-day expiry; Rate limits login attempts to 5 per minute; Automatically extends sessions on activity

Title: "Auth Module - Complete Authentication System"

Store using add-memory with natural language content, title string, and memory_type as ["component"]

### Implementation Memories

Document the complete journey of building features:

Example OAuth Integration Implementation Memory:
Purpose: Adding Google OAuth to existing auth system
Steps taken in raw English:
Step 1 - Created OAuthProvider class in /src/auth/providers with purpose to abstract OAuth flow for multiple providers. Implemented methods getAuthUrl and exchangeToken and getUserInfo
Step 2 - Added GoogleOAuthService extending OAuthProvider. Configured with Google client credentials. Customized getUserInfo to map Google profile fields
Step 3 - Modified AuthController to handle OAuth callbacks. Added /api/auth/oauth/callback endpoint. Integrated with existing session creation flow
Step 4 - Updated User model to support OAuth profiles. Added provider and providerId fields. Created migration for database schema
Step 5 - Built frontend OAuth button component. Redirects to OAuth provider URL. Handles callback and error states
Key decisions: Chose to extend existing auth rather than replace; Stored minimal OAuth data to respect privacy; Used provider-specific services for extensibility

Title: "Implement Google OAuth Authentication"

Store using add-memory with natural language content, title string, and memory_type as ["implementation"]

### Debugging Memories

Capture the investigation and resolution process:

Example Session Timeout Bug Memory:
Issue Summary: Users were being logged out after 5 minutes instead of 2 hours
Steps taken to diagnose:
Step 1 - Went to SessionService file and examined token generation
Step 2 - Looked at JWT payload and noticed expiry was set correctly to 2 hours
Step 3 - Checked middleware and found Redis session TTL was set to 300 seconds
Step 4 - Discovered mismatch between JWT expiry and Redis TTL
Steps taken to solve:
Step 1 - Updated Redis TTL to match JWT expiry of 7200 seconds because sessions need consistent expiry
Step 2 - Added validation to ensure Redis TTL always matches JWT expiry to prevent future mismatches
Step 3 - Created unit test to verify session expiry consistency

Title: "Fix: Session Timeout 5min vs 2hr Bug"

Store using add-memory with natural language content, title string, and memory_type as ["debug"]

### User Preference Memories

Keep these concise and actionable:
- Always use 4 spaces for indentation in Python files
- Prefer async/await over promises in TypeScript
- Use descriptive variable names over comments
- Always add error boundaries to React components

Titles should be brief: "Python 4-Space Indentation", "TypeScript Async Preference", etc.

Store using add-memory with natural language content, title string, and memory_type as ["user_preference"]

### Project Info Memories

General project knowledge not tied to specific components:
- Project uses PostgreSQL for main database and Redis for caching
- Deployment happens via GitHub Actions to AWS ECS
- Frontend built with Next.js 14 using app router
- API follows REST conventions with JWT authentication

Titles should identify the configuration area: "Database Stack Configuration", "Deployment AWS ECS Setup", etc.

Store using add-memory with natural language content, title string, and memory_type as ["project_info"]

## Memory Title Guidelines

### Creating Effective Titles

Every memory requires a descriptive title that serves as a quick reference. Good titles are:
- **Concise**: 5-10 words capturing the essence
- **Specific**: Include the component/feature/issue name
- **Searchable**: Use keywords that you'd search for later
- **Action-oriented**: Start with verbs for implementations/debugging

### Title Patterns by Memory Type

- **Component**: "[Component Name] - [Primary Function]" (e.g., "Auth Module - JWT Token Management")
- **Implementation**: "[Action] [Feature/Component]" (e.g., "Implement OAuth Google Integration")
- **Debug**: "Fix: [Issue Description]" (e.g., "Fix: Session Timeout Redis TTL Mismatch")
- **User Preference**: "[Scope] [Preference Type]" (e.g., "Python Indentation Style Preference")
- **Project Info**: "[Area] [Configuration/Setup]" (e.g., "Database PostgreSQL and Redis Setup")

## Memory Storage Intelligence

### Core Approach
The memory system distinguishes between user-specific preferences and project-level knowledge. Use `is_user_preference` and `project_id` parameters appropriately to ensure memories are stored and searched with the correct scope.

### When to Set Parameters
- **is_user_preference**: Set to `true` for any personal coding preferences, habits, or choices. Set to `false` for objective project facts, implementations, or system behaviors.
- **project_id**: Always use the value from the **Project Identification** section at the top of this file (see line 13). Include this value when the memory relates to this specific project. Omit only for global user preferences that apply across all projects.

### Decision Examples with Requests

**Case 1: Project Details (implementations, debugging, components)**
- "The authentication system uses JWT tokens with Redis for session storage"
- "Fixed memory leak by clearing event listeners in useEffect cleanup"
- "Payment processing flows through Stripe webhook handlers"

Request:
```json
{
  "title": "Auth System JWT Redis Architecture",
  "content": "Authentication system uses JWT tokens stored in Redis with 2-hour expiry. TokenService handles generation and validation. Refresh tokens last 7 days.",
  "memory_types": ["component"],
  "is_user_preference": false,
  "project_id": "openmemory",
  "namespace": "auth"
}
```

**Case 2: Project-Specific User Preferences**
- "For this project, I always run tests with npm test:watch"
- "Use 4 spaces for indentation in this codebase"
- "Always squash commits before merging in this repo"

Request:
```json
{
  "title": "Project Test Command Preference",
  "content": "Always run npm test:watch when testing this project for continuous feedback",
  "memory_types": ["user_preference"],
  "is_user_preference": true,
  "project_id": "openmemory"
}
```

**Case 3: Global User Preferences**
- "I prefer dark themes in all my development tools"
- "Always write descriptive commit messages"
- "I like to see type hints in Python code"

Request:
```json
{
  "title": "Global Dark Theme Preference",
  "content": "Prefer dark themes in all development environments for reduced eye strain",
  "memory_types": ["user_preference"],
  "is_user_preference": true
  // Note: no project_id for global preferences
}
```

### Quick Reference
- Not about you? → `is_user_preference: false, project_id: "openmemory"`
- About your preferences for THIS project? → `is_user_preference: true, project_id: "openmemory"`
- About your preferences for ALL projects? → `is_user_preference: true` (no project_id)

### Search Behavior
The search-memory tool uses `is_user_preference` (required) and `project_id` (optional) to precisely filter results:

**Pattern 1: Global User Preferences**
- Parameters: `is_user_preference: true` (no project_id)
- Returns: Only your global preferences that apply across all projects
- Use when: Asking about general coding style, habits, or preferences

**Pattern 2: All Relevant User Preferences**
- Parameters: `is_user_preference: true, project_id: "AIX"`
- Returns: Both global preferences AND project-specific preferences
- Use when: You want all preferences that could apply to current work

**Pattern 3: Project Facts Only**
- Parameters: `is_user_preference: false, project_id: "AIX"`
- Returns: Only objective project information (no preferences)
- Use when: Asking about architecture, implementations, or debugging history

## Tool Usage

The memory system provides two MCP tools:

search-memory: Use with natural language queries to retrieve relevant memories
- Required: query string
- Required: is_user_preference boolean (determines if searching preferences or facts)
- Optional: project_id string (from Project Identification section, line 13)
- Optional: memory_types array (filter by specific memory types)
- Optional: namespaces array (filter by specific namespaces)
- Returns: Memories based on the parameter combination (see Search Behavior section)

add-memory: Use to store new memories
- Required: title string (concise, descriptive summary of the memory content)
- Required: content string and memory_type array
- Required: is_user_preference boolean (see Memory Storage Intelligence section above)
- Optional: project_id string (get from Project Identification section, line 13 of this file)
- memory_type must be array containing one or more of: component, implementation, debug, user_preference, project_info

Always make tool calls in proper JSON format as specified by the MCP protocol. The memory_type field is essential for the backend search functionality.

## Quick Search Decision Guide

**Step 1: Is this about user preferences/habits or project facts?**
- Coding styles, personal habits, tool preferences → `is_user_preference: true`
- System architecture, code implementation, debugging → `is_user_preference: false`

**Step 2: What scope do I need?**
- Just global preferences → `is_user_preference: true` (no project_id)
- All relevant preferences → `is_user_preference: true, project_id: "AIX"`
- Project facts/code → `is_user_preference: false, project_id: "AIX"`

**Common Queries:**
- "What are my coding preferences?" → Pattern 1 (global prefs only)
- "How does X system work?" → Pattern 3 (project facts)
- "What preferences apply here?" → Pattern 2 (all relevant prefs)
- "What's the architecture?" → Pattern 3 (project facts)
- "How do I like to test?" → Pattern 2 (could have global + project prefs)
- "What bugs have we fixed?" → Pattern 3 (project facts)

## Operating Principles

1. When MCP tools are unavailable, mention once and continue without them
2. Retrieve before you implement - existing context prevents repetition
3. Store after you discover - completed work contains valuable insights
4. Be detailed in storage - future sessions benefit from rich context
5. Trust natural boundaries - components align with project structure
6. Capture reasoning over code - the why matters more than the what

## Session Patterns

Beginning a session in a new project: 
- Check if openmemory.md is empty (0 bytes)
- If empty, perform deep codebase dive and populate the guide
- Store discoveries as memories using MCP tools

Beginning a session in existing project:
- Read openmemory.md for project context
- Let the first task guide what memories you need:
  - Major feature work? → Load architecture patterns and coding preferences
  - Bug fix? → Focus on component details and past debugging
  - Code review? → Recall code quality preferences
  - Quick fix? → Maybe no memory search needed

Remember: You're building intuition over time. Early sessions need more memory searches. Later sessions, you'll have internalized the patterns and need fewer explicit searches.

During implementation: Note architectural decisions and design patterns
While debugging: Document the investigation process and final solution
After completion: Store significant discoveries and implementation details

## The OpenMemory Guide (Additional Layer)

### Guide File Management

The openmemory.md file serves as your project's living index and is automatically created (empty) in the workspace root directory when the extension is installed and a new workspace is opened. This guide acts as an additional organizational layer for your memories and provides a comprehensive index of your codebase. If this file is not present, create it with the instructions below. 

### Initial Codebase Deep Dive

First action in any new project workspace: Check if openmemory.md is empty (0 bytes). If empty, perform a thorough codebase analysis:

1. **Search existing memories** for any relevant project context using search-memory tool with `is_user_preference: false, project_id: "AIX"` for project facts
2. **Analyze the codebase structure** systematically:
   - Examine directory structure and file organization
   - Identify key configuration files (package.json, requirements.txt, etc.)
   - Detect frameworks, languages, and major dependencies
   - Locate entry points and main application files
   - Map component boundaries and module relationships
3. **Look for architectural patterns**:
   - Authentication and authorization mechanisms
   - Database schemas and data models
   - API design patterns and endpoints
   - Frontend/backend separation
   - Testing strategies and CI/CD pipelines
   - Deployment configurations
4. **Document findings** in the guide with these sections:
   - OpenMemory Guide header
   - Project Overview (comprehensive description, tech stack, key features)
   - Architecture (system design, technology choices, infrastructure)
   - User Defined Namespaces (header with description, leave namespace list blank)
   - Components (major modules and their responsibilities)
   - Implementation Patterns (discovered coding patterns and conventions)
   - Debugging History (leave with TODO placeholder initially)
   - User Preferences (populate with any discovered preferences)
   - Recent Changes (start with initial deep dive timestamp)
5. **Store discoveries as memories** using add-memory tool:
   - Store component documentation as component memories
   - Store architectural decisions as project_info memories
   - Store discovered patterns as implementation memories
   - Include appropriate namespaces if defined

The deep dive should create a thorough "index" of the codebase that serves as a foundation for all future work.

### User Defined Namespaces Section Format

The User Defined Namespaces section should be formatted as follows:

```markdown
## User Defined Namespaces

Define your project-specific namespaces below. The AI will use these descriptions to intelligently categorize and search memories.

- [Leave blank initially - user will populate with project-specific namespaces]
```

Example populated namespaces (for reference):
- **frontend**: UI components, React/Vue/Angular patterns, CSS styling, client-side state management
- **backend**: API endpoints, server logic, database queries, authentication, business logic
- **database**: Schema design, migrations, query optimization, data modeling

### Guide Discipline

- Treat openmemory.md as the project index - edit it directly as you work
- POPULATE AS YOU GO: After initial deep dive, continue replacing TODO placeholders with real discoveries
- Every meaningful guide edit should include a timestamped entry in the Recent Changes section
- Keep the guide in sync with memories you store - reference guide sections in stored memories
- Before storing any memory, consider updating the guide to reflect the latest findings
- Read and reference the guide regularly for context and decisions

### Guide Update Workflow

After the initial deep dive population, continue updating the guide as you work:

When you discover new information or make architectural decisions:
1. Open openmemory.md
2. Update the relevant section with your findings
3. Add a timestamped entry to Recent Changes section: - [YYYY-MM-DD HH:MM]: Brief description of what was updated
4. Save the file
5. Then proceed to store the memory using the MCP tools

The guide complements your memory operations but does not replace them. Continue to use search-memory and add-memory tools as the primary memory interface. The initial deep dive establishes the foundation, but the guide should continue evolving with every session as new discoveries are made.

### Integration with Memory Types

- When storing component memories: Also update the Components section of the guide
- When storing implementation memories: Consider adding patterns to Implementation Patterns section
- When storing debugging memories: Add significant sessions to Debugging History
- When storing user preferences: Update the User Preferences section
- When storing project info: Update Project Overview or Architecture sections as appropriate

### Non-Negotiable Guardrails

- NEVER expose environment variables, credentials, or secrets in memories or the guide
- DO NOT run destructive operations without explicit user approval
- Treat memories as durable knowledge - no subjective or transient chatter
- When a user says save this, remember, or similar, IMMEDIATELY run the memory workflow
- When you believe something deserves storage, ASK THE USER FIRST for preferences or subjective information

Remember: The memory system is designed to make you more effective over time. Rich, detailed memories about reasoning and decisions are more valuable than simple code snippets. When in doubt about whether something is worth storing, it probably is. The guide is an additional organizational tool that helps maintain project context alongside the memory system.