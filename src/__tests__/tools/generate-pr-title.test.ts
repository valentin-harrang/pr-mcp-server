import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeGenerateTitle } from "../../tools/generate-pr-title.tool.js";
import * as analyzer from "../../core/git/analyzer.js";
import * as repository from "../../core/git/repository.js";
import * as projectContext from "../../core/context/project-context.js";

vi.mock("../../core/git/analyzer.js");
vi.mock("../../core/git/repository.js");
vi.mock("../../core/context/project-context.js");

describe("generate-pr-title tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock git.diff to return empty diff
    vi.mocked(repository.git.diff).mockResolvedValue("");

    // Mock project context
    vi.mocked(projectContext.gatherProjectContext).mockResolvedValue({
      hasTypeScript: true,
      hasI18n: false,
      hasLinter: false,
      hasFormatter: false,
      hasADR: false,
      hasDocs: false,
      hasContributing: false,
      hasMonorepo: false,
      dependencies: {},
      devDependencies: {},
      projectStructure: [],
    });
    vi.mocked(projectContext.formatProjectContextForPrompt).mockReturnValue("Mock project context");
  });

  it("should return an AI prompt for title generation with type and scope", async () => {
    const mockAnalysis = {
      currentBranch: "feature/auth",
      baseBranch: "main",
      totalCommits: 2,
      commits: [
        { hash: "abc123", message: "feat(auth): add OAuth support", author: "John", date: "2025-01-01" },
        { hash: "def456", message: "feat(auth): add token refresh", author: "Jane", date: "2025-01-02" },
      ],
      filesChanged: 3,
      insertions: 50,
      deletions: 10,
      filesList: [
        { file: "auth/oauth.ts", changes: 30, insertions: 30, deletions: 0 },
        { file: "auth/token.ts", changes: 20, insertions: 15, deletions: 5 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle();
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("feat");
    expect(result).toContain("auth");
    expect(result).toContain("OAuth support");
  });

  it("should return an AI prompt without scope if files are in src/", async () => {
    const mockAnalysis = {
      currentBranch: "fix-bug",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "fix: resolve memory leak", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 5,
      deletions: 2,
      filesList: [
        { file: "src/utils.ts", changes: 7, insertions: 5, deletions: 2 },
      ],
      commitTypes: ["fix"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle();
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("fix");
    expect(result).toContain("resolve memory leak");
    expect(result).toContain("(no scope)");
  });

  it("should include maxLength in AI prompt when specified", async () => {
    const mockAnalysis = {
      currentBranch: "feature/very-long-feature",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "feat: implement a very long feature description that should be truncated", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 10,
      deletions: 0,
      filesList: [
        { file: "feature.ts", changes: 10, insertions: 10, deletions: 0 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle(50);
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("max 50 characters");
  });

  it("should suggest 'chore' as fallback type in AI prompt", async () => {
    const mockAnalysis = {
      currentBranch: "update-deps",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "update dependencies", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 5,
      deletions: 5,
      filesList: [
        { file: "package.json", changes: 10, insertions: 5, deletions: 5 },
      ],
      commitTypes: ["other"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle();
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("chore");
  });

  it("should suggest child directory as scope in AI prompt for monorepo with packages/", async () => {
    const mockAnalysis = {
      currentBranch: "feature/api-update",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "feat: add new endpoint", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 2,
      insertions: 20,
      deletions: 5,
      filesList: [
        { file: "packages/api/src/routes.ts", changes: 15, insertions: 15, deletions: 0 },
        { file: "packages/api/src/controllers.ts", changes: 10, insertions: 5, deletions: 5 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle();
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("feat");
    expect(result).toContain("api");
  });

  it("should suggest child directory as scope in AI prompt for monorepo with apps/", async () => {
    const mockAnalysis = {
      currentBranch: "fix/frontend-bug",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "fix: resolve rendering issue", author: "Jane", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 10,
      deletions: 5,
      filesList: [
        { file: "apps/frontend/src/components/Button.tsx", changes: 15, insertions: 10, deletions: 5 },
      ],
      commitTypes: ["fix"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle();
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("fix");
    expect(result).toContain("frontend");
  });

  it("should suggest first monorepo package as scope in AI prompt", async () => {
    const mockAnalysis = {
      currentBranch: "feature/shared-lib",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "feat: add utility functions", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 3,
      insertions: 50,
      deletions: 0,
      filesList: [
        { file: "packages/utils/src/helpers.ts", changes: 30, insertions: 30, deletions: 0 },
        { file: "packages/shared/src/types.ts", changes: 20, insertions: 20, deletions: 0 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateTitle();
    expect(result).toContain("PR Title Generation Request");
    expect(result).toContain("feat");
    expect(result).toContain("utils");
  });
});
