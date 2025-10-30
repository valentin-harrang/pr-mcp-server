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
        "⚠️ IMPORTANT: This tool returns a REVIEW REQUEST PROMPT, not a final review. When you call this tool, you will receive comprehensive context (project info, diff, commits) formatted as a prompt. YOU (Claude) must then analyze this context and provide the actual intelligent review by following the instructions in the returned prompt. This works for ANY language/framework (PHP, Python, Go, TypeScript, Rust, etc.) because it provides full project context. The review will be specific to the project's technologies and conventions. Use this when the user asks to review code or wants feedback on changes.",
      inputSchema: {
        type: "object",
        properties: {
          baseBranch: {
            type: "string",
            description: "Base branch for comparison (auto-detected if not provided)",
          },
        },
      },
    },
    {
      name: "generate_pr_complete",
      description:
        "Generates both a conventional commit-style PR title and a complete Pull Request description in one operation. Combines the functionality of generate_pr_title and generate_pr_description. Automatically analyzes the current Git branch from the working directory. Use this when the user wants both title and description generated together.",
      inputSchema: {
        type: "object",
        properties: {
          template: {
            type: "string",
            enum: ["standard", "detailed", "minimal"],
            description: "Template to use for the description",
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
            description: "Include statistics in the description",
            default: true,
          },
          maxTitleLength: {
            type: "number",
            description: "Maximum length for the title (optional, e.g., 72)",
          },
          baseBranch: {
            type: "string",
            description: "Base branch for comparison (auto-detected if not provided)",
          },
        },
      },
    },
    {
      name: "create_pr",
      description:
        "Creates a Pull Request on GitHub using generate_pr_title for the title and generate_pr_description for the description. Automatically analyzes the current Git branch from the working directory and creates the PR. Can automatically suggest and add reviewers based on Git history. Requires GITHUB_TOKEN environment variable or githubToken parameter. Use this when the user asks to create a PR, open a PR, or submit a PR to GitHub.",
      inputSchema: {
        type: "object",
        properties: {
          template: {
            type: "string",
            enum: ["standard", "detailed", "minimal"],
            description: "Template to use for the description",
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
            description: "Include statistics in the description",
            default: true,
          },
          maxTitleLength: {
            type: "number",
            description: "Maximum length for the title (optional, e.g., 72)",
          },
          baseBranch: {
            type: "string",
            description: "Base branch for comparison (auto-detected if not provided)",
          },
          draft: {
            type: "boolean",
            description: "Create the PR as a draft",
            default: false,
          },
          githubToken: {
            type: "string",
            description: "GitHub token for authentication (optional, defaults to GITHUB_TOKEN env var)",
          },
          addReviewers: {
            type: "boolean",
            description: "Automatically suggest and add reviewers based on Git history",
            default: true,
          },
          maxReviewers: {
            type: "number",
            description: "Maximum number of reviewers to add (1-20)",
            default: 3,
          },
        },
      },
    },
    {
      name: "create_pr_complete",
      description:
        "🚀 UNIFIED PR CREATION WORKFLOW - **RECOMMENDED USAGE WHEN USER SAYS 'Create a PR'**: STEP 1: Call 'review' tool to get comprehensive project context and diff. STEP 2: YOU (Claude) analyze that context and generate an intelligent, project-specific code review following the format in the returned prompt. STEP 3: Call THIS tool with the 'aiReviewText' parameter containing your generated review. This creates a complete PR with: auto-generated title, comprehensive description, YOUR AI review integrated in the description, smart GIF, automatic reviewer assignment. Works for ANY language/framework (PHP, Python, Go, TypeScript, Rust, etc.) because the review adapts to project context. Requires GITHUB_TOKEN environment variable.",
      inputSchema: {
        type: "object",
        properties: {
          aiReviewText: {
            type: "string",
            description: "IMPORTANT: The AI-generated code review text to include in the PR description. You (Claude) should call 'review' tool first, analyze the context, write your review following the format specified, then pass it here.",
          },
          template: {
            type: "string",
            enum: ["standard", "detailed", "minimal"],
            description: "Template to use for the description",
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
            description: "Include statistics in the description",
            default: true,
          },
          maxTitleLength: {
            type: "number",
            description: "Maximum length for the title (optional, e.g., 72)",
          },
          baseBranch: {
            type: "string",
            description: "Base branch for comparison (auto-detected if not provided)",
          },
          draft: {
            type: "boolean",
            description: "Create the PR as a draft",
            default: false,
          },
          githubToken: {
            type: "string",
            description: "GitHub token for authentication (optional, defaults to GITHUB_TOKEN env var)",
          },
          addReviewers: {
            type: "boolean",
            description: "Automatically suggest and add reviewers based on Git history",
            default: true,
          },
          maxReviewers: {
            type: "number",
            description: "Maximum number of reviewers to add (1-20)",
            default: 3,
          },
        },
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
