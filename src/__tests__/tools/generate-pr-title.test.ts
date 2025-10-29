import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeGenerateTitle } from "../../tools/generate-pr-title.tool.js";
import * as analyzer from "../../core/git/analyzer.js";

vi.mock("../../core/git/analyzer.js");

describe("generate-pr-title tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a conventional title with type and scope", async () => {
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
    expect(result).toBe("feat(auth): add OAuth support");
  });

  it("should generate title without scope if files are in src/", async () => {
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
    expect(result).toBe("fix: resolve memory leak");
  });

  it("should truncate title if maxLength is specified", async () => {
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
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toMatch(/\.{3}$/); // ends with ...
  });

  it("should infer 'chore' as fallback type", async () => {
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
    expect(result).toMatch(/^chore:/);
  });

  it("should use child directory as scope in monorepo with packages/", async () => {
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
    expect(result).toBe("feat(api): add new endpoint");
  });

  it("should use child directory as scope in monorepo with apps/", async () => {
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
    expect(result).toBe("fix(frontend): resolve rendering issue");
  });

  it("should handle multiple monorepo packages and use the first one", async () => {
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
    expect(result).toBe("feat(utils): add utility functions");
  });
});
