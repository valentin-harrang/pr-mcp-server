import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeGeneratePRSimple } from "../../tools/generate-pr-description.tool.js";
import * as analyzer from "../../core/git/analyzer.js";

vi.mock("../../core/git/analyzer.js");

describe("generate-pr-description tool (simple/fallback)", () => {
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

    const result = await executeGeneratePRSimple();

    expect(result).toContain("## Description");
    expect(result).toContain("**Que fait cette PR ou qu'ajoute-t-elle ?**");
    expect(result).toContain("- ajoute OAuth support");
    expect(result).toContain("- ajoute token refresh");
  });

  it("should include custom title in description", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePRSimple("Add authentication feature");

    expect(result).toContain("## Description");
    expect(result).toContain("- ajoute OAuth support");
  });

  it("should generate minimal template", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePRSimple(undefined, "minimal", "fr");

    expect(result).toContain("## feature/auth");
    expect(result).toContain("Add OAuth support");
    expect(result).toContain("**Impact:** 3 files | +50 -10");
    expect(result).not.toContain("### 📊 Statistics");
  });

  it("should generate detailed template with breaking changes", async () => {
    const detailedAnalysis = { ...mockAnalysis, hasBreakingChanges: true };
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(detailedAnalysis);

    const result = await executeGeneratePRSimple(undefined, "detailed", "fr");

    expect(result).toContain("### 🚨 Important notes");
    expect(result).toContain("⚠️ **Breaking Changes detected**");
    expect(result).toContain("✅ Tests included");
  });

  it("should generate English template", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePRSimple(undefined, "standard", "en");

    expect(result).toContain("## Description");
    expect(result).toContain("**What does this PR change or add?**");
    expect(result).toContain("- adds OAuth support");
    expect(result).not.toContain("Cette PR");
  });

  it("should exclude stats when includeStats is false", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    const result = await executeGeneratePRSimple(undefined, "standard", "fr", false);

    expect(result).toContain("## Description");
    expect(result).toContain("**Que fait cette PR ou qu'ajoute-t-elle ?**");
  });

  it("should handle custom baseBranch", async () => {
    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);

    await executeGeneratePRSimple(undefined, "standard", "fr", true, "develop");

    expect(analyzer.analyzeBranch).toHaveBeenCalledWith("develop", true);
  });

  it("should throw error on analysis failure", async () => {
    vi.mocked(analyzer.analyzeBranch).mockRejectedValue(new Error("Git error"));

    await expect(executeGeneratePRSimple()).rejects.toThrow("Error generating PR description: Git error");
  });
});
