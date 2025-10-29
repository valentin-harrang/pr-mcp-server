pr-mcp-server
===============

MCP (Model Context Protocol) server to automate Pull Request creation with AI. Analyzes Git branches, generates descriptions, titles, suggests reviewers, and performs code reviews. Designed to speed up reviews and improve PR quality.

## ✨ Features

- 🔍 **Branch Analysis** - Analyze current Git branch vs a base branch
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
- "Génère le titre de ma PR"
- "Analyse ma branche et génère la description de la PR"
- "Crée une PR sur GitHub avec des reviewers"

See [Configuration Guide](docs/configuration.md) for more details.

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `analyze_branch` | Analyze differences between branches |
| `generate_pr_title` | Generate conventional PR title |
| `generate_pr_description` | Generate PR description |
| `generate_pr_complete` | Generate both title and description |
| `create_pr` | Create PR on GitHub with auto-reviewers |
| `suggest_reviewers` | Suggest reviewers based on Git history |
| `review` | Automated code review |

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
