import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeGeneratePR } from "../../tools/generate-pr-description.tool.js";
import * as analyzer from "../../core/git/analyzer.js";

vi.mock("../../core/git/analyzer.js");

describe("generate-pr-description tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAnalysis = {
    currentBranch: "feature/auth",
    baseBranch: "main",
    totalCommits: 2,
    commits: [
      { hash: "abc123", message: "Add OAuth support", author: "John", date: "2025-01-01" },
      { hash: "def456", message: "Add token refresh", author: "Jane", date: "2025-01-02" },
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

  it("should generate standard FR template by default", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePR();

    expect(result).toContain("## 🎯");
    expect(result).toContain("### 📋 Description");
    expect(result).toContain("### 🔄 Changes");
    expect(result).toContain("Add OAuth support (abc123)");
    expect(result).toContain("### 📊 Statistics");
    expect(result).toContain("**Modified files:** 3");
  });

  it("should include custom title in description", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePR("Add authentication feature");

    expect(result).toContain("## 🎯 Add authentication feature");
    expect(result).toContain("Cette PR implémente: Add authentication feature");
  });

  it("should generate minimal template", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePR(undefined, "minimal", "fr");

    expect(result).toContain("## feature/auth");
    expect(result).toContain("Add OAuth support");
    expect(result).toContain("**Impact:** 3 files | +50 -10");
    expect(result).not.toContain("### 📊 Statistics");
  });

  it("should generate detailed template with breaking changes", async () => {
    const detailedAnalysis = { ...mockAnalysis, hasBreakingChanges: true };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(detailedAnalysis);

    const result = await executeGeneratePR(undefined, "detailed", "fr");

    expect(result).toContain("### 🚨 Important notes");
    expect(result).toContain("⚠️ **Breaking Changes detected**");
    expect(result).toContain("✅ Tests included");
  });

  it("should generate English template", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePR(undefined, "standard", "en");

    expect(result).toContain("### 📋 Description");
    expect(result).toContain("This PR contains 2 commits");
    expect(result).not.toContain("Cette PR");
  });

  it("should exclude stats when includeStats is false", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePR(undefined, "standard", "fr", false);

    expect(result).not.toContain("### 📊 Statistics");
    expect(result).not.toContain("### 🔍 Impacted files");
  });

  it("should handle custom baseBranch", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    await executeGeneratePR(undefined, "standard", "fr", true, "develop");

    expect(analyzer.analyzeBranch).toHaveBeenCalledWith("develop", true);
  });

  it("should throw error on analysis failure", async () => {
    vi.mocked(analyzer.analyzeBranch).mockRejectedValue(new Error("Git error"));

    await expect(executeGeneratePR()).rejects.toThrow("Error generating PR description: Git error");
  });
});
