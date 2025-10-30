import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeGenerateComplete } from "../../tools/generate-pr-complete.tool.js";
import * as analyzer from "../../core/git/analyzer.js";

vi.mock("../../core/git/analyzer.js");

describe("generate-pr-complete tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      { file: "tests/auth.test.ts", changes: 10, insertions: 5, deletions: 5 },
    ],
    commitTypes: ["feature"],
    diffStats: "stats here",
    hasBreakingChanges: false,
    hasTests: true,
  };

  it("should generate both title and description with default parameters", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateComplete();

    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("description");
    expect(result.title).toBe("feat(auth): add OAuth support");
    expect(result.description).toContain("## Description");
    expect(result.description).toContain("**What does this PR change or add?**");
    expect(result.description).toContain("- adds s add OAuth support");
  });

  it("should generate title and description with custom template", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateComplete("minimal", "fr", true);

    expect(result.title).toBe("feat(auth): add OAuth support");
    expect(result.description).toContain("## feat(auth): add OAuth support");
    expect(result.description).toContain("feat(auth): add OAuth support");
    expect(result.description).toContain("**Impact:** 3 files | +50 -10");
  });

  it("should generate English description", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateComplete("standard", "en", true);

    expect(result.title).toBe("feat(auth): add OAuth support");
    expect(result.description).toContain("**What does this PR change or add?**");
    expect(result.description).toContain("- adds s add OAuth support");
    expect(result.description).not.toContain("Cette PR");
  });

  it("should truncate title when maxTitleLength is specified", async () => {
    const longTitleAnalysis = {
      ...mockAnalysis,
      commits: [
        { hash: "abc123", message: "feat(auth): implement a very long feature description that should be truncated", author: "John", date: "2025-01-01" },
      ],
    };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(longTitleAnalysis);

    const result = await executeGenerateComplete("standard", "fr", true, 30);

    expect(result.title.length).toBeLessThanOrEqual(30);
    expect(result.title).toMatch(/\.{3}$/); // ends with ...
    expect(result.description).toContain("**Que fait cette PR ou qu'ajoute-t-elle ?**");
  });

  it("should exclude stats when includeStats is false", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateComplete("standard", "fr", false);

    expect(result.title).toBe("feat(auth): add OAuth support");
    expect(result.description).not.toContain("### 📊 Statistics");
    expect(result.description).not.toContain("### 🔍 Impacted files");
  });

  it("should handle detailed template with breaking changes", async () => {
    const detailedAnalysis = { ...mockAnalysis, hasBreakingChanges: true };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(detailedAnalysis);

    const result = await executeGenerateComplete("detailed", "fr", true);

    expect(result.title).toBe("feat(auth): add OAuth support");
    expect(result.description).toContain("### 🚨 Important notes");
    expect(result.description).toContain("⚠️ **Breaking Changes detected**");
    expect(result.description).toContain("✅ Tests included");
  });

  it("should handle custom baseBranch", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    await executeGenerateComplete("standard", "fr", true, undefined, "develop");

    expect(analyzer.analyzeBranch).toHaveBeenCalledWith("develop", true);
  });

  it("should use auto-detected baseBranch when not provided", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    await executeGenerateComplete();

    expect(analyzer.analyzeBranch).toHaveBeenCalledWith(undefined, true);
  });

  it("should infer 'chore' as fallback type for title", async () => {
    const choreAnalysis = {
      ...mockAnalysis,
      commits: [
        { hash: "abc123", message: "update dependencies", author: "John", date: "2025-01-01" },
      ],
      filesList: [
        { file: "package.json", changes: 10, insertions: 5, deletions: 5 },
      ],
      commitTypes: ["other"],
    };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(choreAnalysis);

    const result = await executeGenerateComplete();

    expect(result.title).toMatch(/^chore:/);
    expect(result.description).toContain("**What does this PR change or add?**");
  });

  it("should handle title without scope when files are in src/", async () => {
    const srcAnalysis = {
      ...mockAnalysis,
      filesList: [
        { file: "src/utils.ts", changes: 7, insertions: 5, deletions: 2 },
      ],
    };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(srcAnalysis);

    const result = await executeGenerateComplete();

    expect(result.title).toBe("feat: add OAuth support");
    expect(result.description).toContain("**What does this PR change or add?**");
  });

  it("should throw error on analysis failure", async () => {
    vi.mocked(analyzer.analyzeBranch).mockRejectedValue(new Error("Git error"));

    await expect(executeGenerateComplete()).rejects.toThrow("Error generating complete PR: Git error");
  });

  it("should return structured result with both title and description", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGenerateComplete();

    expect(result).toEqual({
      title: "feat(auth): add OAuth support",
      description: expect.stringContaining("## Description"),
    });
    expect(typeof result.title).toBe("string");
    expect(typeof result.description).toBe("string");
  });

  it("should use child directory as scope in monorepo with packages/", async () => {
    const monorepoAnalysis = {
      ...mockAnalysis,
      commits: [
        { hash: "abc123", message: "feat: add new API endpoint", author: "John", date: "2025-01-01" },
      ],
      filesList: [
        { file: "packages/api/src/routes.ts", changes: 30, insertions: 30, deletions: 0 },
        { file: "packages/api/src/controllers.ts", changes: 20, insertions: 15, deletions: 5 },
      ],
    };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(monorepoAnalysis);

    const result = await executeGenerateComplete();

    expect(result.title).toBe("feat(api): add new API endpoint");
    expect(result.description).toContain("**What does this PR change or add?**");
    expect(result.description).toContain("- adds s add new API endpoint");
  });

  it("should use child directory as scope in monorepo with apps/", async () => {
    const monorepoAnalysis = {
      ...mockAnalysis,
      commits: [
        { hash: "abc123", message: "fix: resolve rendering bug", author: "Jane", date: "2025-01-01" },
      ],
      filesList: [
        { file: "apps/frontend/src/components/Button.tsx", changes: 15, insertions: 10, deletions: 5 },
      ],
    };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(monorepoAnalysis);

    const result = await executeGenerateComplete();

    expect(result.title).toBe("fix(frontend): resolve rendering bug");
    expect(result.description).toContain("**What does this PR change or add?**");
    expect(result.description).toContain("- fixes resolve rendering bug");
  });

  it("should handle libs/ monorepo structure", async () => {
    const monorepoAnalysis = {
      ...mockAnalysis,
      commits: [
        { hash: "abc123", message: "feat: add shared utilities", author: "John", date: "2025-01-01" },
      ],
      filesList: [
        { file: "libs/utils/src/helpers.ts", changes: 30, insertions: 30, deletions: 0 },
      ],
    };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(monorepoAnalysis);

    const result = await executeGenerateComplete();

    expect(result.title).toBe("feat(utils): add shared utilities");
  });
});
