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
        "⚠️ CRITICAL: This tool returns an ANALYSIS PROMPT for YOU (Claude) to generate a description, NOT a final description. OUTPUT: You receive comprehensive context (project type, commits, files, diff sample) formatted as a detailed prompt with specific instructions. YOUR JOB: Analyze that context and generate an intelligent, well-structured PR description. The prompt includes format requirements (What/Why/How/Impact sections), language preferences (FR/EN), and style guidelines. YOU must read it, understand the changes, and write a clear description ready for GitHub. DO NOT return the prompt - generate YOUR description. Use when creating PR or when user asks for PR description. The generated description should then be passed to create_pr or create_pr_complete tools.",
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
        "⚠️ CRITICAL: This tool returns an ANALYSIS PROMPT for YOU (Claude) to generate a title, NOT a final title. OUTPUT: You receive comprehensive context about the code changes (commits, files, diff patterns) formatted as a prompt. YOUR JOB: Analyze that context and generate an intelligent conventional commit-style PR title (e.g., 'feat(auth): add OAuth support'). The prompt provides all the information you need to understand what changed. YOU must read it and create a concise, descriptive title that accurately reflects the changes. DO NOT return the prompt - generate YOUR title. Use when creating PR or when user asks for a PR title. The generated title should then be passed to create_pr or create_pr_complete tools.",
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
        "⚠️ CRITICAL: This tool ONLY returns an ANALYSIS PROMPT for YOU (Claude), NOT a final review. OUTPUT: You receive comprehensive context (project type, diff, commits, structure) formatted as a detailed prompt with instructions. YOUR JOB: Analyze that context and generate the actual code review following the exact format specified in the prompt. The prompt includes everything you need: project context, full diff, testing framework, architecture details. YOU must read it, analyze the code changes, and write a concise review (max 10-15 lines) with sections: Summary, Critical Issues, Key Suggestions, Decision (APPROVE/REQUEST_CHANGES). DO NOT return the prompt itself - generate YOUR review. Works for ANY language/framework because context is provided. Use when user asks to review code or when creating PR with review.",
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
        "Creates a Pull Request on GitHub WITHOUT AI review. **RECOMMENDED WORKFLOW**: (1) Call 'generate_pr_title' → get prompt, (2) YOU analyze and generate title, (3) Call 'generate_pr_description' → get prompt, (4) YOU analyze and generate description, (5) Call THIS tool with 'title' and 'description' parameters. If not provided, simple versions are auto-generated from commits/templates. NOTE: This tool does NOT include AI code review. For complete PR WITH AI review, use 'create_pr_complete' instead. This tool: analyzes branch, creates/updates PR, adds reviewers automatically. Requires GITHUB_TOKEN. Use when user asks to create a simple PR without code review.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "RECOMMENDED: YOUR (Claude's) generated PR title. Workflow: (1) Call 'generate_pr_title' to get analysis prompt, (2) YOU analyze and create intelligent title, (3) Pass YOUR title here. DO NOT pass the tool's output directly - it's a prompt for YOU, not the final title. If not provided, a simple title is auto-generated from commit messages.",
          },
          description: {
            type: "string",
            description: "RECOMMENDED: YOUR (Claude's) generated PR description. Workflow: (1) Call 'generate_pr_description' to get analysis prompt, (2) YOU analyze and write intelligent description, (3) Pass YOUR description here. DO NOT pass the tool's output directly - it's a prompt for YOU, not the final description. If not provided, a simple template-based description is auto-generated.",
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
    {
      name: "create_pr_complete",
      description:
        "🚀 UNIFIED PR CREATION WORKFLOW - **WHEN USER SAYS 'Create a PR', YOU MUST FOLLOW THESE STEPS IN ORDER**: (1) Call 'generate_pr_title' → get prompt, (2) YOU analyze and generate intelligent title, (3) Call 'generate_pr_description' → get prompt, (4) YOU analyze and generate intelligent description, (5) Call 'review' → get context/diff prompt, (6) YOU analyze and write code review, (7) Call THIS tool with 'title', 'description', and 'aiReviewText' parameters. IMPORTANT: ALL 3 parameters (title, description, aiReviewText) should be YOUR generated content, NOT the tool outputs (which are prompts). If any are omitted, simple fallbacks are auto-generated. This creates a professional PR with: YOUR intelligent title, YOUR comprehensive description, YOUR AI code review, smart GIF, automatic reviewer assignment. Works for ANY language/framework. Requires GITHUB_TOKEN.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "RECOMMENDED: YOUR (Claude's) generated PR title. Workflow: (1) Call 'generate_pr_title' to get analysis prompt, (2) YOU analyze and create intelligent title, (3) Pass YOUR title here. DO NOT pass the tool's output directly - it's a prompt for YOU, not the final title. If not provided, a simple title is auto-generated from commit messages.",
          },
          description: {
            type: "string",
            description: "RECOMMENDED: YOUR (Claude's) generated PR description. Workflow: (1) Call 'generate_pr_description' to get analysis prompt, (2) YOU analyze and write intelligent description, (3) Pass YOUR description here. DO NOT pass the tool's output directly - it's a prompt for YOU, not the final description. If not provided, a simple template-based description is auto-generated.",
          },
          aiReviewText: {
            type: "string",
            description: "REQUIRED for complete PR with review: YOUR (Claude's) generated code review text. Workflow: (1) Call 'review' tool to get analysis prompt with context/diff, (2) YOU analyze and write the review following the format in that prompt, (3) Pass YOUR review text here. DO NOT pass the review tool's output directly - it's a prompt for YOU to analyze, not the final review.",
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
