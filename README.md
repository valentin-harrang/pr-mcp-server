pr-mcp-server
===============

MCP (Model Context Protocol) server to automate Pull Request creation with AI. Analyzes Git branches, generates descriptions, titles, suggests reviewers, and performs code reviews. Designed to speed up reviews and improve PR quality.

Features
--------
- Analyze current Git branch vs a base branch
- Generate PR descriptions (standard, detailed, minimal templates | EN/FR)
- Generate conventional PR titles (feat, fix, docs, etc.)
- **🎉 Smart GIF selection** - Automatically adds relevant GIFs based on work type
- Suggest reviewers based on contribution history
- Automated code review with actionable feedback
- Ready-to-use with MCP Inspector, Cursor, and Claude Desktop

Requirements
------------
- Node.js 18+
- A Git repository (the server uses `simple-git`)

Install
-------
### Local development
```bash
npm install
npm run build
```

### Global installation (recommended)
```bash
npm link
```
This makes the `pr-mcp-server` command available globally without needing absolute paths.

Quick start with MCP Inspector
------------------------------
After `npm link`, simply run:
```bash
npx @modelcontextprotocol/inspector pr-mcp-server
```

Or for development/debugging with inspector:
```bash
npx @modelcontextprotocol/inspector node --inspect ./dist/core/mcp/server.js
```

- Inspector will open and list the `pr-mcp-server`.
- Click "List Tools" and try:
- `analyze_branch`
- `generate_pr_description`
- `generate_pr_complete`
- `suggest_reviewers`
- `review`
- `generate_pr_title`

Tip: Run Inspector inside a Git repository so `git` commands work (the server uses `process.cwd()`).

Use with Cursor
---------------
After `npm link`, configure your MCP server in `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server",
      "cwd": "{workspaceFolder}"
    }
  }
}
```

**Alternative**: Use `npx` without global installation:
```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "npx",
      "args": ["-y", "pr-mcp-server"],
      "cwd": "{workspaceFolder}"
    }
  }
}
```

**Important**: The `"cwd": "{workspaceFolder}"` parameter ensures the MCP server runs in your project's directory, giving it access to the Git context.

Notes:
- Restart Cursor after saving the file.
- Open a Git repository in Cursor for the tools to work.
- No absolute paths needed!

### Usage in Cursor
Once configured, simply ask Cursor in the chat:
- "Génère le titre de ma PR"
- "Analyse ma branche et génère la description de la PR"
- "Génère le titre et la description complète de ma PR"
- "Suggère des reviewers pour cette PR"
- "Crée une PR sur GitHub" (requires `GITHUB_TOKEN` environment variable)

Cursor will automatically use your MCP tools.

Use with Claude Desktop
-----------------------
After `npm link`, configure Claude Desktop (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server"
    }
  }
}
```

**Alternative**: Use `npx` without global installation:
```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "npx",
      "args": ["-y", "pr-mcp-server"]
    }
  }
}
```

**Note**: Claude Desktop doesn't support `{workspaceFolder}`. The MCP server will run in Claude's default directory, so you'll need to specify the repository path when calling tools, or use the MCP server from within a specific project context.

Restart Claude Desktop. In a new conversation, the `pr-mcp-server` tools will be available.

Notes:
- Ensure `dist/core/mcp/server.js` exists (run `npm run build`).
- The server uses `process.cwd()`, so context depends on where Claude Desktop executes the command.

Available tools
---------------
### 1) analyze_branch
- Description: Analyze differences between the current branch and a base branch.
- Input:
```
{
  "baseBranch": "main",   // string, default: "main"
  "detailed": true         // boolean, default: true
}
```
- Output: AnalysisResult with `currentBranch`, `baseBranch`, `totalCommits`, `commits[]`, `filesChanged`, `insertions`, `deletions`, `filesList[]`, `commitTypes[]`, `diffStats`, `hasBreakingChanges?`, `hasTests?`.

### 2) generate_pr_description
- Description: Generate a PR description from the analysis.
- Input:
```
{
  "title": "My awesome PR",         // string | optional
  "template": "standard",           // "standard" | "detailed" | "minimal" (default: "standard")
  "language": "fr",                 // "fr" | "en" (default: "fr")
  "includeStats": true               // boolean (default: true)
}
```
- Output: string (markdown ready to paste into your PR).

### 3) generate_pr_complete
- Description: Generate both a conventional PR title and a complete PR description in one operation.
- Input:
```
{
  "template": "standard",           // "standard" | "detailed" | "minimal" (default: "standard")
  "language": "fr",                 // "fr" | "en" (default: "fr")
  "includeStats": true,             // boolean (default: true)
  "maxTitleLength": 72,             // number | optional, caps title length
  "baseBranch": "main"              // string | optional, base branch for comparison
}
```
- Output: `{ title: string, description: string }` - Both title and description ready to use.

### 4) suggest_reviewers
- Description: Suggest reviewers based on contribution history on modified files.
- Input:
```
{
  "limit": 3    // number, 1..20 (default: 3)
}
```
- Output: `{ suggestedReviewers: { author, contributions, reason }[], basedOn: string, error?: string }`.

### 5) generate_pr_title
- Description: Generate a conventional PR title based on recent commits and changed files.
- Input:
```
{
  "maxLength": 72   // optional, number, caps title length (e.g., 72)
}
```
- Output: A string like `feat(auth): add refresh token rotation`.

### 6) review
- Description: Produce a concise, structured PR code review (markdown, 10–15 lines).
- Input:
```
{}
```
- Output: Raw markdown using exactly this structure (copy/paste-ready):
```
## Summary
[one-line summary]

## Critical Issues  
- [issue with `code` references]

## Key Suggestions
- [suggestion 1]
- [suggestion 2]

## Decision
REQUEST_CHANGES - [brief reason]
```

### 7) create_pr
- Description: Creates a Pull Request on GitHub using `generate_pr_title` for the title and `generate_pr_description` for the description. Automatically analyzes the current Git branch and creates the PR on GitHub.
- **Prerequisites:**
  - Set `GITHUB_TOKEN` environment variable with a GitHub token (or pass `githubToken` parameter)
    - Supports **Personal Access Tokens** (starts with `ghp_`)
    - Supports **Enterprise Tokens** (starts with `github_pat_`)
  - Your branch must be pushed to the remote repository (`git push -u origin <branch-name>`)
  - Repository must have a remote named `origin` pointing to GitHub
- Input:
```
{
  "template": "standard",           // "standard" | "detailed" | "minimal" (default: "standard")
  "language": "fr",                 // "fr" | "en" (default: "fr")
  "includeStats": true,             // boolean (default: true)
  "maxTitleLength": 72,             // number | optional, caps title length
  "baseBranch": "main",             // string | optional, base branch for comparison
  "draft": false,                   // boolean (default: false) - create PR as draft
  "githubToken": "ghp_..."          // string | optional, defaults to GITHUB_TOKEN env var
                                      // Can be personal token (ghp_...) or enterprise token (github_pat_...)
}
```
- Output: `{ url: string, number: number, title: string, state: string }` - PR details with link to the created PR.

**Example:**
```json
{
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "title": "feat(auth): add OAuth support",
  "state": "open"
}
```

Smart GIF Selection
-------------------
The PR templates now include **smart GIF selection** that automatically chooses appropriate GIFs based on the type of work performed:

### 🎯 **GIF Categories**
- **Feature development** → Building/coding GIFs
- **Bug fixes** → Problem-solving GIFs  
- **Testing** → Quality assurance GIFs
- **Refactoring** → Code improvement GIFs
- **Documentation** → Writing/learning GIFs
- **Performance** → Speed/optimization GIFs
- **Breaking changes** → Major update GIFs
- **Default** → General development GIFs

### 🎲 **How it works**
1. **Analyzes commit types** from your branch
2. **Detects breaking changes** and test additions
3. **Selects appropriate category** based on work patterns
4. **Randomly picks a GIF** from the relevant category
5. **Adds GIF to PR description** automatically

### ✨ **Example**
```markdown
![GIF](https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif)

## 🎯 feat(auth): add OAuth support
...
```

The GIF selection is **intelligent** and **contextual** - feature commits get building GIFs, bug fixes get problem-solving GIFs, etc. This makes your PRs more engaging and fun! 🚀

Architecture
------------
```
src/
├── core/                           # Core infrastructure
│   ├── git/
│   │   ├── analyzer.ts            # Git branch analysis
│   │   ├── repository.ts          # Git singleton instance
│   │   └── types.ts               # Git-related types
│   └── mcp/
│       ├── handlers.ts            # MCP tool handlers
│       └── server.ts              # MCP server (entry point)
├── tools/                          # MCP tools (1 file = 1 tool)
│   ├── analyze-branch.tool.ts
│   ├── create-pr.tool.ts
│   ├── generate-pr-complete.tool.ts
│   ├── generate-pr-description.tool.ts
│   ├── generate-pr-title.tool.ts
│   ├── review.tool.ts
│   └── suggest-reviewers.tool.ts
├── templates/                      # PR templates
│   ├── gif-selector.ts            # Smart GIF selection
│   └── pr-templates.ts
├── validation/                     # Validation and types
│   ├── schemas.ts                 # Zod validation schemas
│   └── types.ts                   # Shared types
└── __tests__/                      # Tests (mirrors src structure)
```

The project uses ESM (Node16) — local imports use `.js` extensions after TypeScript compilation.

Examples (MCP Inspector)
------------------------
- `analyze_branch` (defaults) → returns analysis JSON.
- `generate_pr_description` with `{ "title": "Add feature X", "template": "detailed", "language": "fr" }` → returns a full markdown description.
- `generate_pr_complete` with `{ "template": "standard", "language": "fr" }` → returns `{ "title": "feat(auth): add OAuth support", "description": "## 🎯 feat(auth): add OAuth support..." }`.
- `suggest_reviewers` with `{ "limit": 5 }` → returns a sorted list of suggested reviewers.

Testing create_pr tool
-----------------------
To test the `create_pr` tool, you need:

1. **Get a GitHub Token:**
   - **Personal Access Token** (starts with `ghp_`):
     - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
     - Generate a new token with `repo` scope
   - **Enterprise Token** (starts with `github_pat_`):
     - Use your organization's enterprise token with `repo` scope
   - Copy the token

2. **Set the token as environment variable:**
   ```bash
   # For personal access token
   export GITHUB_TOKEN=ghp_your_token_here
   
   # For enterprise token
   export GITHUB_TOKEN=github_pat_your_token_here
   ```

3. **Ensure your branch is pushed:**
   ```bash
   git push -u origin your-branch-name
   ```

4. **Test with MCP Inspector:**
   ```bash
   # In a Git repository directory
   GITHUB_TOKEN=ghp_your_token_here npx @modelcontextprotocol/inspector pr-mcp-server
   ```
   Then call `create_pr` with:
   ```json
   {
     "template": "standard",
     "language": "fr",
     "draft": false
   }
   ```

5. **Test with Cursor:**
   - Set `GITHUB_TOKEN` in your environment
   - In Cursor chat, ask: "Crée une PR sur GitHub"
   - The tool will automatically generate title and description, then create the PR

**Common errors:**
- `GitHub token is required`: Set `GITHUB_TOKEN` environment variable
- `Branch does not exist on remote`: Push your branch first with `git push -u origin <branch>`
- `No remote URL found for 'origin'`: Ensure your Git repo has a GitHub remote configured

Troubleshooting
---------------
- "Not a git repository": run the server inside a Git repo.
- ESM import issues: use Node 18+ and build the project (`dist/`).
- Permission errors: ensure your shell has access to the repo.
- "GitHub token is required": Set `GITHUB_TOKEN` environment variable for `create_pr` tool.
- "Branch does not exist on remote": Push your branch before creating a PR.

Useful scripts
--------------
```
npm run build        # compile TypeScript to dist/
npm start            # start the MCP server
npm test             # run tests
npm run test:watch   # run tests in watch mode
npm run test:ui      # run tests with UI
npm run dev          # run in development mode
```

License
-------
MIT


