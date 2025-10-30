import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeReview } from "../../tools/review.tool.js";
import * as analyzer from "../../core/git/analyzer.js";
import * as repository from "../../core/git/repository.js";

vi.mock("../../core/git/analyzer.js");
vi.mock("../../core/git/repository.js", () => ({
  git: {
    diff: vi.fn(),
  },
}));

describe("review tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate review prompt with proper context", async () => {
    const mockAnalysis = {
      currentBranch: "feature/auth",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "Add feature", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 2,
      insertions: 20,
      deletions: 5,
      filesList: [
        { file: "src/auth.ts", changes: 15, insertions: 15, deletions: 0 },
        { file: "src/auth.test.ts", changes: 10, insertions: 5, deletions: 5 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasBreakingChanges: false,
      hasTests: true,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue("clean diff without issues");

    const result = await executeReview();

    // Verify it returns a prompt for AI review
    expect(result).toContain("# Code Review Request");
    expect(result).toContain("## Changes Summary");
    expect(result).toContain("**Has Tests**: Yes");
    expect(result).toContain("**Breaking Changes**: No");
    expect(result).toContain("## Full Diff");
    expect(result).toContain("IMPORTANT INSTRUCTIONS FOR AI REVIEW");
  });

  it("should indicate when tests are missing in the prompt", async () => {
    const mockAnalysis = {
      currentBranch: "feature/auth",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "Add feature", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 50,
      deletions: 0,
      filesList: [
        { file: "src/auth.ts", changes: 50, insertions: 50, deletions: 0 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasBreakingChanges: false,
      hasTests: false,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue("some clean diff");

    const result = await executeReview();

    // Verify the prompt indicates missing tests for AI to review
    expect(result).toContain("**Has Tests**: No");
    expect(result).toContain("Testing Coverage");
  });

  it("should include diff with console.log for AI to detect", async () => {
    const mockAnalysis = {
      currentBranch: "feature/debug",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "Add debugging", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 10,
      deletions: 0,
      filesList: [
        { file: "src/debug.ts", changes: 10, insertions: 10, deletions: 0 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasTests: true,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue(
      "function test() { console.log('debug'); }"
    );

    const result = await executeReview();

    // Verify the prompt includes the diff with console.log for AI to analyze
    expect(result).toContain("console.log");
    expect(result).toContain("## Full Diff");
  });

  it("should indicate breaking changes in the prompt", async () => {
    const mockAnalysis = {
      currentBranch: "feature/breaking",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "BREAKING CHANGE: remove old API", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 5,
      deletions: 20,
      filesList: [
        { file: "src/api.ts", changes: 25, insertions: 5, deletions: 20 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasBreakingChanges: true,
      hasTests: true,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue("BREAKING CHANGE: API removed");

    const result = await executeReview();

    // Verify the prompt indicates breaking changes for AI to review
    expect(result).toContain("**Breaking Changes**: Yes");
    expect(result).toContain("BREAKING CHANGE");
  });

  it("should include TODO/FIXME comments in diff for AI to detect", async () => {
    const mockAnalysis = {
      currentBranch: "feature/incomplete",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "Add WIP feature", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 10,
      deletions: 0,
      filesList: [
        { file: "src/feature.ts", changes: 10, insertions: 10, deletions: 0 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasTests: true,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue(
      "// TODO: implement this later\nfunction incomplete() {}"
    );

    const result = await executeReview();

    // Verify the prompt includes TODO for AI to detect
    expect(result).toContain("TODO");
    expect(result).toContain("## Full Diff");
  });

  it("should indicate large changes without tests in the prompt", async () => {
    const mockAnalysis = {
      currentBranch: "feature/large",
      baseBranch: "main",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "Add large feature", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 400,
      deletions: 50,
      filesList: [
        { file: "src/feature.ts", changes: 450, insertions: 400, deletions: 50 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasTests: false,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue("large diff content");

    const result = await executeReview();

    // Verify the prompt shows large changes without tests for AI to flag
    expect(result).toContain("**Has Tests**: No");
    expect(result).toContain("**Insertions**: +400");
    expect(result).toContain("**Deletions**: -50");
  });

  it("should respect baseBranch parameter", async () => {
    const mockAnalysis = {
      currentBranch: "feature/auth",
      baseBranch: "develop",
      totalCommits: 1,
      commits: [
        { hash: "abc123", message: "Add feature", author: "John", date: "2025-01-01" },
      ],
      filesChanged: 1,
      insertions: 10,
      deletions: 0,
      filesList: [
        { file: "src/auth.ts", changes: 10, insertions: 10, deletions: 0 },
      ],
      commitTypes: ["feature"],
      diffStats: "",
      hasTests: true,
    };

    vi.mocked(analyzer.analyzeBranch).mockResolvedValue(mockAnalysis);
    vi.mocked(repository.git.diff).mockResolvedValue("clean diff");

    await executeReview("develop");

    expect(analyzer.analyzeBranch).toHaveBeenCalledWith("develop", true);
  });
});
