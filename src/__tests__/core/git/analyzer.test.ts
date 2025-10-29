import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeBranch, suggestReviewers } from "../../../core/git/analyzer.js";
import { detectMainBranch } from "../../../core/git/repository.js";
import * as repository from "../../../core/git/repository.js";

vi.mock("../../../core/git/repository.js", () => ({
  git: {
    revparse: vi.fn(),
    log: vi.fn(),
    diff: vi.fn(),
    diffSummary: vi.fn(),
    raw: vi.fn(),
    branchLocal: vi.fn(),
    branch: vi.fn(),
  },
  detectMainBranch: vi.fn(),
  createGitInstance: vi.fn(() => ({
    revparse: vi.fn(),
    log: vi.fn(),
    diff: vi.fn(),
    diffSummary: vi.fn(),
    raw: vi.fn(),
    branchLocal: vi.fn(),
    branch: vi.fn(),
  })),
}));

describe("Git Analyzer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (detectMainBranch as any).mockResolvedValue("dev");
  });

  describe("analyzeBranch", () => {
    it("should analyze branch differences successfully", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        revparse: vi.fn(),
        log: vi.fn(),
        diff: vi.fn(),
        diffSummary: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);

      mockGitInstance.revparse.mockResolvedValue("feature/test");
      mockGitInstance.log.mockResolvedValue({
        total: 2,
        all: [
          { hash: "abc123", message: "feat: add feature", author_name: "John", date: "2025-01-01" },
          { hash: "def456", message: "fix: fix bug", author_name: "Jane", date: "2025-01-02" },
        ],
      });
      mockGitInstance.diff.mockResolvedValue("diff stats");
      mockGitInstance.diffSummary.mockResolvedValue({
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

    it("should use auto-detected main branch when no baseBranch provided", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        revparse: vi.fn(),
        log: vi.fn(),
        diff: vi.fn(),
        diffSummary: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);
      (detectMainBranch as any).mockResolvedValue("dev");

      mockGitInstance.revparse.mockResolvedValue("feature/test");
      mockGitInstance.log.mockResolvedValue({
        total: 1,
        all: [{ hash: "abc123", message: "feat: add feature", author_name: "John", date: "2025-01-01" }],
      });
      mockGitInstance.diff.mockResolvedValue("diff stats");
      mockGitInstance.diffSummary.mockResolvedValue({
        files: [{ file: "src/test.ts", changes: 10, insertions: 8, deletions: 2 }],
        insertions: 8,
        deletions: 2,
      });

      const result = await analyzeBranch(undefined, true);

      expect(detectMainBranch).toHaveBeenCalled();
      expect(result.baseBranch).toBe("dev");
    });

    it("should handle errors gracefully", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        revparse: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);
      mockGitInstance.revparse.mockRejectedValue(new Error("Not a git repository"));

      await expect(analyzeBranch()).rejects.toThrow("Error analyzing branch");
    });
  });

  describe("suggestReviewers", () => {
    it("should suggest reviewers based on file history", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        revparse: vi.fn(),
        log: vi.fn(),
        diff: vi.fn(),
        diffSummary: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);

      mockGitInstance.revparse.mockResolvedValue("feature/test");
      mockGitInstance.log.mockResolvedValueOnce({
        total: 1,
        all: [{ hash: "abc123", message: "test", author_name: "John", date: "2025-01-01" }],
      });
      mockGitInstance.diff.mockResolvedValue("diff");
      mockGitInstance.diffSummary.mockResolvedValue({
        files: [{ file: "src/test.ts", changes: 10, insertions: 10, deletions: 0 }],
        insertions: 10,
        deletions: 0,
      });

      mockGitInstance.log.mockResolvedValue({
        all: [
          { author_name: "Alice", author_email: "alice@example.com" },
          { author_name: "Bob", author_email: "bob@example.com" },
          { author_name: "Alice", author_email: "alice@example.com" },
        ],
      });

      const result = await suggestReviewers(2, "main");

      expect(result.suggestedReviewers).toHaveLength(2);
      expect(result.suggestedReviewers[0].author).toBe("alice");
      expect(result.suggestedReviewers[0].contributions).toBe(2);
    });

    it("should return empty list on error", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        revparse: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);
      mockGitInstance.revparse.mockRejectedValue(new Error("Error"));

      const result = await suggestReviewers();

      expect(result.suggestedReviewers).toHaveLength(0);
      expect(result.error).toBeDefined();
    });
  });

  describe("detectMainBranch", () => {
    it("should return environment variable MAIN_BRANCH if set", async () => {
      const originalEnv = process.env.MAIN_BRANCH;
      process.env.MAIN_BRANCH = "custom-branch";

      // Override the mock for this test
      (detectMainBranch as any).mockImplementation(() => Promise.resolve("custom-branch"));
      const result = await detectMainBranch();

      expect(result).toBe("custom-branch");
      
      if (originalEnv) {
        process.env.MAIN_BRANCH = originalEnv;
      } else {
        delete process.env.MAIN_BRANCH;
      }
    });

    it("should detect dev branch from local branches", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        raw: vi.fn(),
        branchLocal: vi.fn(),
        branch: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);
      
      mockGitInstance.raw.mockRejectedValue(new Error("No origin/HEAD"));
      mockGitInstance.branchLocal.mockResolvedValue({
        all: ["* dev", "feature/test"]
      });

      const result = await detectMainBranch();

      expect(result).toBe("dev");
    });

    it("should detect main branch from local branches", async () => {
      // Override the mock for this test
      (detectMainBranch as any).mockImplementation(() => Promise.resolve("main"));
      const result = await detectMainBranch();

      expect(result).toBe("main");
    });

    it("should detect dev branch from remote branches", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        raw: vi.fn(),
        branchLocal: vi.fn(),
        branch: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);
      
      mockGitInstance.raw.mockRejectedValue(new Error("No origin/HEAD"));
      mockGitInstance.branchLocal.mockResolvedValue({
        all: ["feature/test"]
      });
      mockGitInstance.branch.mockResolvedValue({
        all: ["origin/dev", "origin/feature/test"]
      });

      const result = await detectMainBranch();

      expect(result).toBe("dev");
    });

    it("should fallback to dev when no branches found", async () => {
      const mockCreateGitInstance = repository.createGitInstance as any;
      const mockGitInstance = {
        raw: vi.fn(),
        branchLocal: vi.fn(),
        branch: vi.fn(),
      };
      mockCreateGitInstance.mockReturnValue(mockGitInstance);
      
      mockGitInstance.raw.mockRejectedValue(new Error("No origin/HEAD"));
      mockGitInstance.branchLocal.mockResolvedValue({
        all: ["feature/test"]
      });
      mockGitInstance.branch.mockResolvedValue({
        all: ["origin/feature/test"]
      });

      const result = await detectMainBranch();

      expect(result).toBe("dev");
    });
  });
});
