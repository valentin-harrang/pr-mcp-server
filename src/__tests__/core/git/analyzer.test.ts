import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeBranch, suggestReviewers } from "../../../core/git/analyzer.js";
import * as repository from "../../../core/git/repository.js";

vi.mock("../../../core/git/repository.js", () => ({
  git: {
    revparse: vi.fn(),
    log: vi.fn(),
    diff: vi.fn(),
    diffSummary: vi.fn(),
  },
}));

describe("Git Analyzer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeBranch", () => {
    it("should analyze branch differences successfully", async () => {
      const mockGit = repository.git as any;

      mockGit.revparse.mockResolvedValue("feature/test");
      mockGit.log.mockResolvedValue({
        total: 2,
        all: [
          { hash: "abc123", message: "feat: add feature", author_name: "John", date: "2025-01-01" },
          { hash: "def456", message: "fix: fix bug", author_name: "Jane", date: "2025-01-02" },
        ],
      });
      mockGit.diff.mockResolvedValue("diff stats");
      mockGit.diffSummary.mockResolvedValue({
        files: [
          { file: "src/test.ts", changes: 10, insertions: 8, deletions: 2 },
        ],
        insertions: 8,
        deletions: 2,
      });

      const result = await analyzeBranch("main", true);

      expect(result.currentBranch).toBe("feature/test");
      expect(result.baseBranch).toBe("main");
      expect(result.totalCommits).toBe(2);
      expect(result.commits).toHaveLength(2);
      expect(result.filesChanged).toBe(1);
      expect(result.commitTypes).toContain("feature");
      expect(result.commitTypes).toContain("fix");
    });

    it("should handle errors gracefully", async () => {
      const mockGit = repository.git as any;
      mockGit.revparse.mockRejectedValue(new Error("Not a git repository"));

      await expect(analyzeBranch()).rejects.toThrow("Error analyzing branch");
    });
  });

  describe("suggestReviewers", () => {
    it("should suggest reviewers based on file history", async () => {
      const mockGit = repository.git as any;

      mockGit.revparse.mockResolvedValue("feature/test");
      mockGit.log.mockResolvedValueOnce({
        total: 1,
        all: [{ hash: "abc123", message: "test", author_name: "John", date: "2025-01-01" }],
      });
      mockGit.diff.mockResolvedValue("diff");
      mockGit.diffSummary.mockResolvedValue({
        files: [{ file: "src/test.ts", changes: 10, insertions: 10, deletions: 0 }],
        insertions: 10,
        deletions: 0,
      });

      mockGit.log.mockResolvedValue({
        all: [
          { author_name: "Alice" },
          { author_name: "Bob" },
          { author_name: "Alice" },
        ],
      });

      const result = await suggestReviewers(2, "main");

      expect(result.suggestedReviewers).toHaveLength(2);
      expect(result.suggestedReviewers[0].author).toBe("Alice");
      expect(result.suggestedReviewers[0].contributions).toBe(2);
    });

    it("should return empty list on error", async () => {
      const mockGit = repository.git as any;
      mockGit.revparse.mockRejectedValue(new Error("Error"));

      const result = await suggestReviewers();

      expect(result.suggestedReviewers).toHaveLength(0);
      expect(result.error).toBeDefined();
    });
  });
});
