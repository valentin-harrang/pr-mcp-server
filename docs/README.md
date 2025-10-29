# Documentation

Complete documentation for `pr-mcp-server`.

## 📚 Documentation Index

### Getting Started

- **[Configuration Guide](configuration.md)** - Setup for Cursor, Claude Desktop, and MCP Inspector
  - MCP Inspector setup
  - Cursor configuration
  - Claude Desktop configuration
  - Environment variables

### Core Documentation

- **[Tools Reference](tools.md)** - Detailed description of all available tools
  - `analyze_branch`
  - `generate_pr_title`
  - `generate_pr_description`
  - `generate_pr_complete`
  - `suggest_reviewers`
  - `review`
  - `create_pr`

### Features

- **[GitHub Integration](github-integration.md)** - Creating PRs on GitHub with auto-reviewers
  - Prerequisites and setup
  - Smart PR handling (create, reopen, update)
  - Auto-reviewers feature
  - Testing and troubleshooting

- **[Smart Reviewers](reviewers.md)** - How reviewer detection works and troubleshooting
  - How it works
  - Username detection algorithm
  - Diagnostic messages
  - Common issues and solutions

- **[Smart GIF Selection](gifs.md)** - Automatic GIF selection and rate limit handling
  - GIF categories
  - Rate limit handling
  - Disabling GIFs
  - Troubleshooting

### Resources

- **[Examples](examples.md)** - Real-world usage examples
  - Basic workflows
  - Tool usage examples
  - Advanced scenarios
  - Common patterns

- **[Architecture](architecture.md)** - Project structure and design
  - Project structure
  - Core components
  - Design patterns
  - Data flow
  - Testing strategy

## 🚀 Quick Links

### I want to...

**...set up pr-mcp-server**
→ [Configuration Guide](configuration.md)

**...create a PR on GitHub**
→ [GitHub Integration](github-integration.md)

**...understand why reviewers aren't added**
→ [Smart Reviewers](reviewers.md#troubleshooting)

**...disable GIFs**
→ [Smart GIF Selection](gifs.md#disabling-gifs)

**...see usage examples**
→ [Examples](examples.md)

**...understand the codebase**
→ [Architecture](architecture.md)

**...troubleshoot an error**
→ [GitHub Integration - Troubleshooting](github-integration.md#troubleshooting)

## 📖 Reading Guide

### For New Users

1. Start with [Configuration Guide](configuration.md)
2. Read [Tools Reference](tools.md) overview
3. Try [Examples](examples.md)
4. Explore [GitHub Integration](github-integration.md) when ready

### For Troubleshooting

1. Check [GitHub Integration - Troubleshooting](github-integration.md#troubleshooting)
2. For reviewer issues: [Smart Reviewers](reviewers.md#troubleshooting)
3. For GIF issues: [Smart GIF Selection](gifs.md#troubleshooting)

### For Contributors

1. Read [Architecture](architecture.md)
2. Understand [Core Components](architecture.md#core-components)
3. Review [Testing Strategy](architecture.md#testing-strategy)
4. Check [Design Patterns](architecture.md#design-patterns)

## 🔗 External Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor Documentation](https://cursor.sh/docs)
- [Claude Desktop](https://claude.ai/desktop)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

[← Back to Main README](../README.md)

