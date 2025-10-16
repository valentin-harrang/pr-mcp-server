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

  it("should approve when no critical issues", async () => {
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

    expect(result).toContain("## Summary");
    expect(result).toContain("## Critical Issues");
    expect(result).toContain("- None");
    expect(result).toContain("## Decision");
    expect(result).toContain("APPROVE");
  });

  it("should request changes when tests are missing", async () => {
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

    expect(result).toContain("REQUEST_CHANGES");
    expect(result).toContain("Missing or insufficient tests");
  });

  it("should detect console.log statements", async () => {
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

    expect(result).toContain("Debug statements found");
    expect(result).toContain("REQUEST_CHANGES");
  });

  it("should detect breaking changes", async () => {
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

    expect(result).toContain("breaking change");
    expect(result).toContain("REQUEST_CHANGES");
  });

  it("should detect TODO/FIXME comments", async () => {
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

    expect(result).toContain("TODO/FIXME");
    expect(result).toContain("REQUEST_CHANGES");
  });

  it("should suggest adding tests for large changes", async () => {
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

    expect(result).toContain("Add unit/integration tests");
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
