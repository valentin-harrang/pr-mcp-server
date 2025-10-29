# Architecture

Technical architecture and project structure for `pr-mcp-server`.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Module Dependencies](#module-dependencies)
- [Testing Strategy](#testing-strategy)

## Project Structure

```
pr-mcp-server/
├── src/
│   ├── core/                      # Core infrastructure
│   │   ├── git/                   # Git operations
│   │   │   ├── analyzer.ts        # Branch analysis logic
│   │   │   ├── repository.ts      # Git singleton instance
│   │   │   └── types.ts           # Git-related types
│   │   └── mcp/                   # MCP server
│   │       ├── handlers.ts        # Tool request handlers
│   │       └── server.ts          # MCP server entry point
│   │
│   ├── tools/                     # MCP tools (1 file = 1 tool)
│   │   ├── analyze-branch.tool.ts
│   │   ├── create-pr.tool.ts
│   │   ├── generate-pr-complete.tool.ts
│   │   ├── generate-pr-description.tool.ts
│   │   ├── generate-pr-title.tool.ts
│   │   ├── review.tool.ts
│   │   └── suggest-reviewers.tool.ts
│   │
│   ├── templates/                 # PR templates and GIF selection
│   │   ├── gif-selector.ts        # Smart GIF selection logic
│   │   └── pr-templates.ts        # PR description templates
│   │
│   ├── validation/                # Input validation and types
│   │   ├── schemas.ts             # Zod validation schemas
│   │   └── types.ts               # Shared TypeScript types
│   │
│   └── __tests__/                 # Tests (mirrors src structure)
│       ├── core/git/
│       ├── templates/
│       ├── tools/
│       └── validation/
│
├── dist/                          # Compiled JavaScript output
├── node_modules/                  # Dependencies
├── docs/                          # Documentation
│   ├── configuration.md
│   ├── tools.md
│   ├── github-integration.md
│   ├── reviewers.md
│   ├── gifs.md
│   ├── examples.md
│   └── architecture.md
│
├── package.json                   # Project metadata
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Test configuration
├── README.md                      # Main documentation
└── LICENSE                        # MIT license
```

## Core Components

### 1. MCP Server (`core/mcp/`)

**Purpose:** Entry point for Model Context Protocol integration.

**Key files:**
- `server.ts` - Initializes MCP server, registers tools, handles stdio communication
- `handlers.ts` - Routes tool calls to appropriate tool implementations

**Responsibilities:**
- Tool registration and schema definition
- Request/response handling
- Error handling and logging
- Communication with AI clients (Cursor, Claude Desktop)

---

### 2. Git Analyzer (`core/git/`)

**Purpose:** Core Git operations and branch analysis.

**Key files:**
- `analyzer.ts` - Branch comparison, commit parsing, file analysis, reviewer suggestion
- `repository.ts` - Singleton Git instance using `simple-git`
- `types.ts` - Type definitions for Git data

**Responsibilities:**
- Compare branches
- Extract commit history
- Parse conventional commits
- Detect breaking changes
- Suggest reviewers based on Git history
- Convert Git identities to GitHub usernames

---

### 3. Tools (`tools/`)

**Purpose:** Individual MCP tool implementations.

**Architecture:** One file per tool

**Each tool exports:**
- `schema` - Zod validation schema
- `execute` function - Main tool logic

**Available tools:**
- `analyze-branch.tool.ts` - Branch analysis
- `generate-pr-title.tool.ts` - Title generation
- `generate-pr-description.tool.ts` - Description generation
- `generate-pr-complete.tool.ts` - Combined title + description
- `suggest-reviewers.tool.ts` - Reviewer suggestion
- `review.tool.ts` - Code review
- `create-pr.tool.ts` - GitHub PR creation

---

### 4. Templates (`templates/`)

**Purpose:** PR content generation and GIF selection.

**Key files:**
- `pr-templates.ts` - Description templates (standard, detailed, minimal) for EN/FR
- `gif-selector.ts` - Smart GIF selection based on commit types

**Responsibilities:**
- Generate PR descriptions with proper formatting
- Select appropriate GIFs from Giphy API
- Handle rate limits and fallbacks
- Support multiple languages and templates

---

### 5. Validation (`validation/`)

**Purpose:** Input validation and shared types.

**Key files:**
- `schemas.ts` - Zod schemas for all tool inputs
- `types.ts` - Shared TypeScript types

**Responsibilities:**
- Validate tool inputs
- Provide type safety
- Define interfaces for data structures

## Design Patterns

### 1. Singleton Pattern

**Used in:** `core/git/repository.ts`

**Why:** Single Git instance shared across all tools

```typescript
// repository.ts
let gitInstance: SimpleGit | null = null;

export function getGitRepository(): SimpleGit {
  if (!gitInstance) {
    gitInstance = simpleGit();
  }
  return gitInstance;
}
```

### 2. Factory Pattern

**Used in:** Template generation

**Why:** Create different PR templates based on input

```typescript
// pr-templates.ts
export function generatePRDescription(
  template: 'standard' | 'detailed' | 'minimal',
  language: 'fr' | 'en'
): string {
  // Factory logic to select appropriate template
}
```

### 3. Strategy Pattern

**Used in:** GIF selection

**Why:** Different GIF selection strategies based on commit type

```typescript
// gif-selector.ts
function selectCategory(analysis: AnalysisResult): string {
  if (analysis.hasBreakingChanges) return 'breaking';
  if (analysis.commitTypes.includes('feature')) return 'feature';
  // ... more strategies
}
```

### 4. Repository Pattern

**Used in:** Git operations

**Why:** Abstract Git operations behind a clean interface

```typescript
// analyzer.ts
export async function analyzeBranch(baseBranch: string): Promise<AnalysisResult> {
  const git = getGitRepository();
  // Use git operations without exposing simple-git details
}
```

## Data Flow

### Tool Call Flow

```
1. AI Client (Cursor/Claude)
   ↓
2. MCP Server (server.ts)
   ↓ receives tool call request
3. Handler (handlers.ts)
   ↓ validates input with Zod
4. Tool (tools/*.tool.ts)
   ↓ executes logic
5. Core Components (git, templates)
   ↓ perform operations
6. External APIs (GitHub, Giphy)
   ↓ optional integrations
7. Tool (tools/*.tool.ts)
   ↓ formats response
8. Handler (handlers.ts)
   ↓ returns result
9. MCP Server (server.ts)
   ↓ sends response
10. AI Client (Cursor/Claude)
```

### Example: Create PR Flow

```
1. User: "Create a PR on GitHub"
   ↓
2. Cursor calls create_pr tool
   ↓
3. create-pr.tool.ts receives request
   ↓
4. Calls analyze-branch.tool.ts
   ├→ analyzer.ts analyzes branch
   └→ Returns AnalysisResult
   ↓
5. Calls generate-pr-complete.tool.ts
   ├→ analyzer.ts generates title
   ├→ pr-templates.ts generates description
   ├→ gif-selector.ts selects GIF
   └→ Returns {title, description}
   ↓
6. Calls suggest-reviewers.tool.ts
   ├→ analyzer.ts extracts Git history
   ├→ analyzer.ts converts to GitHub usernames
   └→ Returns suggested reviewers
   ↓
7. Uses Octokit to create/update PR on GitHub
   ├→ Create or reopen PR
   ├→ Add reviewers
   └→ Verify reviewers added
   ↓
8. Returns PR details to user
```

## Module Dependencies

### Dependency Graph

```
server.ts
  ↓
handlers.ts
  ↓
tools/*.tool.ts
  ↓
┌─────────┬──────────┬───────────┐
│         │          │           │
analyzer.ts  pr-templates.ts  gif-selector.ts
│         │          │           │
└─────────┴──────────┴───────────┘
        ↓
  repository.ts
        ↓
   simple-git
```

### External Dependencies

- **`@modelcontextprotocol/sdk`** - MCP protocol implementation
- **`simple-git`** - Git operations
- **`@octokit/rest`** - GitHub API client
- **`zod`** - Schema validation
- **`vitest`** - Testing framework

### Internal Dependencies

- Tools depend on `core/` modules
- Templates are independent
- Validation is used by all tools
- Git analyzer is the most depended-upon module

## Testing Strategy

### Test Structure

```
src/__tests__/
├── core/git/
│   └── analyzer.test.ts         # Git analysis tests
├── templates/
│   └── gif-selector.test.ts     # GIF selection tests
├── tools/
│   ├── generate-pr-complete.test.ts
│   ├── generate-pr-description.test.ts
│   ├── generate-pr-title.test.ts
│   └── review.test.ts
└── validation/
    └── schemas.test.ts          # Input validation tests
```

### Test Categories

**1. Unit Tests**
- Test individual functions in isolation
- Mock external dependencies (Git, GitHub API, Giphy)
- Fast execution
- High coverage

**2. Integration Tests**
- Test tool workflows end-to-end
- Use real Git operations (in test repo)
- Mock external APIs only (GitHub, Giphy)
- Verify data flow between components

**3. Validation Tests**
- Test Zod schemas
- Verify error messages
- Test edge cases and invalid inputs

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage
npm test -- --coverage
```

### Mocking Strategy

**Git Operations:**
```typescript
vi.mock('simple-git', () => ({
  simpleGit: () => ({
    log: vi.fn().mockResolvedValue(mockLogData),
    diff: vi.fn().mockResolvedValue(mockDiffData),
    // ... other mocks
  })
}));
```

**External APIs:**
- GitHub API: Mock Octokit responses
- Giphy API: Mock fetch responses
- Environment variables: Mock `process.env`

## ESM Configuration

### Module System

The project uses **ECMAScript Modules (ESM)** with Node.js.

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
```

### Import Conventions

**Local imports must include `.js` extension:**

```typescript
// ✅ Correct
import { analyzeBranch } from './analyzer.js';
import type { AnalysisResult } from '../types.js';

// ❌ Wrong
import { analyzeBranch } from './analyzer';
```

**Why `.js` not `.ts`?**
- TypeScript compiles to `.js` files
- Node.js resolves imports at runtime (after compilation)
- `.js` extension tells Node.js where to find compiled files

### Package.json

```json
{
  "type": "module",
  "bin": {
    "pr-mcp-server": "./dist/core/mcp/server.js"
  }
}
```

**`"type": "module"`** - Enables ESM mode for Node.js

## Build Process

### TypeScript Compilation

```bash
npm run build
```

**What it does:**
1. Reads `src/**/*.ts` files
2. Type checks
3. Compiles to `dist/**/*.js` files
4. Generates `.d.ts` type definitions
5. Creates source maps (`.js.map`, `.d.ts.map`)

### Output Structure

```
dist/
├── core/
│   ├── git/
│   │   ├── analyzer.js
│   │   ├── analyzer.d.ts
│   │   └── analyzer.js.map
│   └── mcp/
│       ├── server.js
│       └── server.d.ts
└── ...
```

### Global Installation

```bash
npm link
```

**What it does:**
1. Creates symlink: `/usr/local/bin/pr-mcp-server` → `./dist/core/mcp/server.js`
2. Makes `pr-mcp-server` command globally available
3. Allows `npx pr-mcp-server` without installation

## Error Handling

### Strategy

1. **Validate inputs** - Use Zod schemas
2. **Graceful degradation** - Fallbacks for non-critical features (GIFs, reviewers)
3. **Detailed errors** - Provide actionable error messages
4. **Never block** - Critical operations (PR creation) always succeed even if optional features fail

### Error Levels

**Critical (throw):**
- Invalid GitHub token
- Branch not pushed
- No Git repository

**Warning (log + continue):**
- Giphy API rate limit
- Reviewer detection failed
- GitHub API permission errors

**Silent (fallback):**
- GIF selection failed
- Optional stats not available

## Performance Considerations

### Optimizations

1. **Singleton Git instance** - Reuse across tools
2. **Parallel API calls** - Fetch reviewers while generating description
3. **Rate limit caching** - Don't retry Giphy for 1 hour after 429
4. **Lazy loading** - Only import needed modules

### Bottlenecks

1. **Git operations** - Limited by Git performance
2. **GitHub API** - Rate limited (5000 req/hour)
3. **Giphy API** - Rate limited (varies by key)

### Monitoring

- `console.error` for detailed logs (`[REVIEWERS]`, `[GIF]`)
- `console.warn` for degraded functionality
- Structured output for debugging

---

[← Back to README](../README.md)

