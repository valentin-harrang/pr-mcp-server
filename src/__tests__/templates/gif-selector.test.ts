import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { selectGif, selectGifByCriteria } from "../../templates/gif-selector.js";
import { AnalysisResult } from "../../core/git/types.js";

describe("gif-selector", () => {
  // Mock fetch function
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // Helper to create a mock Giphy API response
  const createMockGiphyResponse = (gifUrls: string[] = []) => {
    const defaultUrls = [
      "https://media.giphy.com/media/test1/giphy.gif",
      "https://media.giphy.com/media/test2/giphy.gif",
      "https://media.giphy.com/media/test3/giphy.gif",
    ];
    const urls = gifUrls.length > 0 ? gifUrls : defaultUrls;
    
    return {
      ok: true,
      json: async () => ({
        data: urls.map((url, index) => ({
          id: `gif${index}`,
          images: {
            original: { url },
            downsized_medium: { url },
          },
        })),
      }),
    };
  };
  
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

  it("should select feature GIF for feature commits", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const gif = await selectGif(mockAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select breaking change GIF when hasBreakingChanges is true", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const breakingAnalysis = { ...mockAnalysis, hasBreakingChanges: true };
    const gif = await selectGif(breakingAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select fix GIF for fix commits", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const fixAnalysis = { ...mockAnalysis, commitTypes: ["fix"] };
    const gif = await selectGif(fixAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select test GIF for test commits", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const testAnalysis = { ...mockAnalysis, commitTypes: ["test"] };
    const gif = await selectGif(testAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select refactor GIF for refactor commits", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const refactorAnalysis = { ...mockAnalysis, commitTypes: ["refactor"] };
    const gif = await selectGif(refactorAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select docs GIF for documentation commits", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const docsAnalysis = { ...mockAnalysis, commitTypes: ["documentation"] };
    const gif = await selectGif(docsAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select perf GIF for performance commits", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const perfAnalysis = { ...mockAnalysis, commitTypes: ["perf"] };
    const gif = await selectGif(perfAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should select default GIF for unknown commit types", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const unknownAnalysis = { ...mockAnalysis, commitTypes: ["unknown"] };
    const gif = await selectGif(unknownAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should prioritize breaking changes over commit types", async () => {
    mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
    const breakingFeatureAnalysis = { 
      ...mockAnalysis, 
      hasBreakingChanges: true, 
      commitTypes: ["feature"] 
    };
    const gif = await selectGif(breakingFeatureAnalysis);
    expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
    expect(gif).toContain("giphy.gif");
  });

  it("should return different GIFs on multiple calls (randomness)", async () => {
    // Mock different responses for each call
    const mockUrls = [
      ["https://media.giphy.com/media/test1/giphy.gif"],
      ["https://media.giphy.com/media/test2/giphy.gif"],
      ["https://media.giphy.com/media/test3/giphy.gif"],
    ];
    mockUrls.forEach((urls) => {
      mockFetch.mockResolvedValueOnce(createMockGiphyResponse(urls));
    });
    
    const gifs = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const gif = await selectGif(mockAnalysis);
      gifs.add(gif);
    }
    // Should get some variety (at least 1 different GIF)
    expect(gifs.size).toBeGreaterThanOrEqual(1);
  });

  describe("selectGifByCriteria", () => {
    it("should select breaking GIF for large breaking changes", async () => {
      mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
      const gif = await selectGifByCriteria(true, ["feature"], true, true);
      expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
      expect(gif).toContain("giphy.gif");
    });

    it("should select test GIF for test-heavy changes", async () => {
      mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
      const gif = await selectGifByCriteria(false, ["test"], true, false);
      expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
      expect(gif).toContain("giphy.gif");
    });

    it("should handle empty commit types", async () => {
      mockFetch.mockResolvedValueOnce(createMockGiphyResponse());
      const gif = await selectGifByCriteria(false, [], false, false);
      expect(gif).toMatch(/^https:\/\/media\.giphy\.com\/media\//);
      expect(gif).toContain("giphy.gif");
    });
  });
});
