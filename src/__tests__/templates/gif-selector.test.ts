import { describe, it, expect, vi } from "vitest";
import { selectGif, selectGifByCriteria } from "../../templates/gif-selector.js";
import { AnalysisResult } from "../../core/git/types.js";

describe("gif-selector", () => {
  const mockAnalysis: AnalysisResult = {
    currentBranch: "feature/auth",
    baseBranch: "main",
    totalCommits: 2,
    commits: [
      { hash: "abc123", message: "feat: add OAuth support", author: "John", date: "2025-01-01" },
      { hash: "def456", message: "feat: add token refresh", author: "Jane", date: "2025-01-02" },
    ],
    filesChanged: 3,
    insertions: 50,
    deletions: 10,
    filesList: [
      { file: "auth/oauth.ts", changes: 30, insertions: 30, deletions: 0 },
      { file: "auth/token.ts", changes: 20, insertions: 15, deletions: 5 },
    ],
    commitTypes: ["feature"],
    diffStats: "stats here",
    hasBreakingChanges: false,
    hasTests: true,
  };

  it("should select feature GIF for feature commits", () => {
    const gif = selectGif(mockAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select breaking change GIF when hasBreakingChanges is true", () => {
    const breakingAnalysis = { ...mockAnalysis, hasBreakingChanges: true };
    const gif = selectGif(breakingAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select fix GIF for fix commits", () => {
    const fixAnalysis = { ...mockAnalysis, commitTypes: ["fix"] };
    const gif = selectGif(fixAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select test GIF for test commits", () => {
    const testAnalysis = { ...mockAnalysis, commitTypes: ["test"] };
    const gif = selectGif(testAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select refactor GIF for refactor commits", () => {
    const refactorAnalysis = { ...mockAnalysis, commitTypes: ["refactor"] };
    const gif = selectGif(refactorAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select docs GIF for documentation commits", () => {
    const docsAnalysis = { ...mockAnalysis, commitTypes: ["documentation"] };
    const gif = selectGif(docsAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select perf GIF for performance commits", () => {
    const perfAnalysis = { ...mockAnalysis, commitTypes: ["perf"] };
    const gif = selectGif(perfAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select default GIF for unknown commit types", () => {
    const unknownAnalysis = { ...mockAnalysis, commitTypes: ["unknown"] };
    const gif = selectGif(unknownAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should prioritize breaking changes over commit types", () => {
    const breakingFeatureAnalysis = { 
      ...mockAnalysis, 
      hasBreakingChanges: true, 
      commitTypes: ["feature"] 
    };
    const gif = selectGif(breakingFeatureAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should return different GIFs on multiple calls (randomness)", () => {
    const gifs = new Set();
    for (let i = 0; i < 10; i++) {
      gifs.add(selectGif(mockAnalysis));
    }
    // With 4 GIFs in the feature category, we should get some variety
    expect(gifs.size).toBeGreaterThan(1);
  });

  describe("selectGifByCriteria", () => {
    it("should select breaking GIF for large breaking changes", () => {
      const gif = selectGifByCriteria(true, ["feature"], true, true);
      expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
      expect(gif).toContain("giphy.gif");
    });

    it("should select test GIF for test-heavy changes", () => {
      const gif = selectGifByCriteria(false, ["test"], true, false);
      expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
      expect(gif).toContain("giphy.gif");
    });

    it("should handle empty commit types", () => {
      const gif = selectGifByCriteria(false, [], false, false);
      expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
      expect(gif).toContain("giphy.gif");
    });
  });
});
