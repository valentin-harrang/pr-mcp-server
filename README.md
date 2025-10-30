pr-mcp-server
===============

MCP (Model Context Protocol) server to automate Pull Request creation with AI. Analyzes Git branches, generates descriptions, titles, suggests reviewers, and performs code reviews. Designed to speed up reviews and improve PR quality.

## ✨ Features

- 🚀 **Unified PR Workflow** - Complete PR creation with one command ("Create a PR")
- 🧠 **AI-Powered Code Review** - Context-aware review integrated into PR description
- 🔍 **Project Context Analysis** - Detects TypeScript, i18n, state management, styling, testing frameworks
- 📝 **PR Generation** - Generate PR descriptions (standard, detailed, minimal templates | EN/FR)
- 🏷️ **Conventional Titles** - Generate conventional PR titles (feat, fix, docs, etc.)
- 🎨 **Smart GIFs** - Automatically adds relevant GIFs based on work type
- 👥 **Auto Reviewers** - Suggest and add reviewers based on contribution history
- 🔎 **Code Review** - Automated code review with actionable feedback
- 🤖 **AI-Ready** - Works with MCP Inspector, Cursor, and Claude Desktop

## 📚 Documentation

- **[Configuration Guide](docs/configuration.md)** - Setup for Cursor, Claude Desktop, and MCP Inspector
- **[Tools Reference](docs/tools.md)** - Detailed description of all available tools
- **[GitHub Integration](docs/github-integration.md)** - Creating PRs on GitHub with auto-reviewers
- **[Smart Reviewers](docs/reviewers.md)** - How reviewer detection works and troubleshooting
- **[Smart GIF Selection](docs/gifs.md)** - Automatic GIF selection and rate limit handling
- **[Examples](docs/examples.md)** - Real-world usage examples
- **[Architecture](docs/architecture.md)** - Project structure and design

## 🚀 Quick Start

### Requirements
- Node.js 18+
- A Git repository

### Installation

**Local development:**
```bash
npm install
npm run build
```

**Global installation (recommended):**
```bash
npm link
```

This makes the `pr-mcp-server` command available globally.

### Test with MCP Inspector

After `npm link`, run:
```bash
npx @modelcontextprotocol/inspector pr-mcp-server
```

The Inspector will list all available tools. Run it inside a Git repository for full functionality.

### Use with Cursor

Add to `~/.cursor/mcp.json`:
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

Restart Cursor, then ask:
- **"Create a PR"** - Uses the unified workflow (recommended)
- "Génère le titre de ma PR"
- "Analyse ma branche et génère la description de la PR"
- "Crée une PR sur GitHub avec des reviewers"

See [Configuration Guide](docs/configuration.md) for more details.

## 🎯 Unified PR Creation Workflow (AI-Powered)

When you say **"Create a PR"**, Claude (the AI) orchestrates an intelligent workflow:

### How It Works

1. **Call `review` tool** - Gathers comprehensive project context:
   - Detects language/framework (TypeScript, PHP, Python, Go, Rust, etc.)
   - Identifies technologies (i18n, state management, styling, testing)
   - Extracts full diff and commit history
   - Returns structured prompt with all context

2. **Claude analyzes and generates review** - True AI-powered analysis:
   - Understands project conventions automatically
   - Identifies issues specific to YOUR tech stack
   - Provides intelligent, context-aware suggestions
   - Works for ANY language/framework (not just TypeScript!)

3. **Call `create_pr_complete` with review** - Creates complete PR:
   - Generates conventional commit-style title
   - Creates comprehensive description
   - **Includes Claude's intelligent review**
   - Adds smart GIF based on PR type
   - Creates/updates GitHub PR
   - Assigns reviewers from Git history

### What Makes It Intelligent

Unlike rule-based tools, this uses **Claude's intelligence** to:
- ✅ Adapt to ANY project (PHP Laravel, Python Django, Go, Rust, etc.)
- ✅ Understand complex patterns and context
- ✅ Provide project-specific recommendations
- ✅ Detect violations of YOUR project's conventions

**Example**: In a PHP Laravel project, it will flag SQL injection vulnerabilities and suggest Eloquent ORM. In a React i18n project, it will catch hardcoded strings. All automatically!

### Example Usage

```bash
# In Cursor or Claude Desktop, simply say:
"Create a PR"

# Claude will automatically:
# 1. Call 'review' to get project context
# 2. Analyze the context and generate intelligent review
# 3. Call 'create_pr_complete' with the review
# 4. Return the PR URL

# With specific options:
"Create a PR in English with the detailed template"
"Create a draft PR without reviewers"
```

See [AI_POWERED_REVIEW.md](AI_POWERED_REVIEW.md) for technical details on how the AI review works.

## 🛠️ Available Tools

| Tool | Description | Recommended |
|------|-------------|-------------|
| `create_pr_complete` | 🚀 **Unified workflow** - Complete PR creation with AI review | ⭐ **YES** |
| `create_pr` | Create PR on GitHub with auto-reviewers (no AI review) | |
| `analyze_branch` | Analyze differences between branches | |
| `generate_pr_title` | Generate conventional PR title | |
| `generate_pr_description` | Generate PR description | |
| `generate_pr_complete` | Generate both title and description | |
| `suggest_reviewers` | Suggest reviewers based on Git history | |
| `review` | Automated code review (context-aware) | |

**Recommendation**: Use `create_pr_complete` for the best experience. It combines all features with intelligent, context-aware code review.

See [Tools Reference](docs/tools.md) for detailed documentation.

## 📦 Useful Scripts

```bash
npm run build        # Compile TypeScript to dist/
npm start            # Start the MCP server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run dev          # Run in development mode
```

## 🐛 Troubleshooting

- **"Not a git repository"**: Run the server inside a Git repo
- **ESM import issues**: Use Node 18+ and build the project (`npm run build`)
- **Permission errors**: Ensure your shell has access to the repo
- **"GitHub token is required"**: Set `GITHUB_TOKEN` environment variable
- **"Branch does not exist on remote"**: Push your branch first

See [GitHub Integration](docs/github-integration.md) for more troubleshooting.

## 📄 License

MIT
