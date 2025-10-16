#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleToolRequest } from "./handlers.js";

/**
 * MCP Server for PR automation
 */
const server = new Server(
  {
    name: "pr-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler to list available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_branch",
      description:
        "Analyzes the differences between the current Git branch and a base branch. Automatically detects the main branch (dev/main/master) and current Git repository from the working directory. Use this when the user asks to analyze a branch, check changes, or understand what's in the current branch.",
      inputSchema: {
        type: "object",
        properties: {
          baseBranch: {
            type: "string",
            description: "Base branch for comparison (auto-detected if not provided)",
          },
          detailed: {
            type: "boolean",
            description: "Include detailed analysis",
            default: true,
          },
        },
      },
    },
    {
      name: "generate_pr_description",
      description:
        "Generates a complete Pull Request description based on the current Git branch changes. Automatically analyzes commits, files, and diffs from the working directory. Use this when the user asks to create/generate/write a PR description or Pull Request content.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "PR title (optional)",
          },
          template: {
            type: "string",
            enum: ["standard", "detailed", "minimal"],
            description: "Template to use",
            default: "standard",
          },
          language: {
            type: "string",
            enum: ["en", "fr"],
            description: "Description language",
            default: "fr",
          },
          includeStats: {
            type: "boolean",
            description: "Include statistics",
            default: true,
          },
        },
      },
    },
    {
      name: "suggest_reviewers",
      description:
        "Suggests code reviewers based on Git contribution history of modified files in the current branch. Automatically analyzes the working directory's Git repository. Use this when the user asks who should review the PR or to suggest reviewers.",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of reviewers to suggest",
            default: 3,
          },
        },
      },
    },
    {
      name: "generate_pr_title",
      description:
        "Generates a conventional commit-style PR title (e.g., 'feat(auth): add OAuth support') by analyzing the current Git branch's commits and changed files. Automatically works from the current working directory. Use this when the user asks to generate/create/write a PR title or needs a title for their Pull Request.",
      inputSchema: {
        type: "object",
        properties: {
          maxLength: {
            type: "number",
            description: "Maximum length for the title (optional, e.g., 72)",
          },
        },
      },
    },
    {
      name: "review",
      description:
        "Performs a code review of the current Git branch changes and provides a concise, structured PR review in markdown format (10-15 lines). Automatically analyzes the working directory's Git repository. Use this when the user asks to review the code, provide feedback, or check the changes.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

// Handler to execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolRequest(name, args as Record<string, unknown> | undefined);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PR MCP Server started and ready!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
