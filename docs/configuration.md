# Configuration Guide

This guide shows how to configure `pr-mcp-server` with different tools.

## 📋 Table of Contents

- [MCP Inspector](#mcp-inspector)
- [Cursor](#cursor)
- [Claude Desktop](#claude-desktop)
- [Environment Variables](#environment-variables)

## MCP Inspector

### After Global Installation

If you've run `npm link`:

```bash
npx @modelcontextprotocol/inspector pr-mcp-server
```

### Development/Debugging

With Node Inspector for debugging:

```bash
npx @modelcontextprotocol/inspector node --inspect ./dist/core/mcp/server.js
```

### Usage

- Inspector will open and list the `pr-mcp-server`
- Click "List Tools" to see available tools
- Run it inside a Git repository so `git` commands work (the server uses `process.cwd()`)

## Cursor

### Configuration

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

### Alternative: Using npx

Without global installation:

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

### Important Notes

- **`"cwd": "{workspaceFolder}"`** ensures the MCP server runs in your project's directory, giving it access to the Git context
- Restart Cursor after saving the configuration file
- Open a Git repository in Cursor for the tools to work
- No absolute paths needed!

### Usage in Cursor

Once configured, simply ask Cursor in the chat:

- "Génère le titre de ma PR"
- "Analyse ma branche et génère la description de la PR"
- "Génère le titre et la description complète de ma PR"
- "Suggère des reviewers pour cette PR"
- "Crée une PR sur GitHub" (requires `GITHUB_TOKEN` environment variable)

Cursor will automatically use your MCP tools.

## Claude Desktop

### Configuration

After `npm link`, configure Claude Desktop.

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server"
    }
  }
}
```

### Alternative: Using npx

Without global installation:

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

### Important Notes

- Claude Desktop doesn't support `{workspaceFolder}`
- The MCP server will run in Claude's default directory
- You may need to specify the repository path when calling tools, or use the MCP server from within a specific project context
- Restart Claude Desktop after configuration
- Ensure `dist/core/mcp/server.js` exists (run `npm run build`)

## Environment Variables

### GITHUB_TOKEN

Required for `create_pr` tool to create Pull Requests on GitHub.

**Set it:**
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

**Get a token:**
- Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate a new token with `repo` scope
- Copy the token

**Supported formats:**
- Personal Access Token: `ghp_...`
- Enterprise Token: `github_pat_...`

### DISABLE_GIFS

Disable GIF selection to avoid Giphy API calls.

**Set it:**
```bash
export DISABLE_GIFS=true
# or
export DISABLE_GIFS=1
```

When enabled, a fallback GIF will always be used.

See [Smart GIF Selection](gifs.md) for more details.

### Setting Environment Variables in MCP Config

For Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server",
      "cwd": "{workspaceFolder}",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "DISABLE_GIFS": "true"
      }
    }
  }
}
```

For Claude Desktop:

```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "DISABLE_GIFS": "true"
      }
    }
  }
}
```

---

[← Back to README](../README.md)

