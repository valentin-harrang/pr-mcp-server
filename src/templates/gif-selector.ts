import { AnalysisResult } from "../core/git/types.js";

// Giphy API configuration
const GIPHY_API_KEY = "4KkFaNbs9aFyyrBtX9eq29xlEfM17D66";
const GIPHY_API_BASE_URL = "https://api.giphy.com/v1/gifs";

// Type definitions for Giphy API response
interface GiphyImage {
  url: string;
}

interface GiphyImages {
  original?: GiphyImage;
  downsized_medium?: GiphyImage;
}

interface GiphyGif {
  id: string;
  images: GiphyImages;
}

interface GiphySearchResponse {
  data: GiphyGif[];
}

// Search terms for each category to query Giphy API
const GIF_SEARCH_TERMS: Record<string, string[]> = {
  // Feature development
  feature: ["coding celebration", "building something", "success", "awesome work"],
  
  // Bug fixes
  fix: ["bug fixed", "problem solved", "debugging", "victory"],
  
  // Documentation
  docs: ["writing", "documentation", "knowledge", "learning"],
  
  // Testing
  test: ["testing", "quality assurance", "success", "confidence"],
  
  // Refactoring
  refactor: ["cleaning up", "improving code", "optimization", "better code"],
  
  // Performance improvements
  perf: ["speed", "performance", "fast", "optimization"],
  
  // Breaking changes
  breaking: ["major changes", "big update", "transformation", "evolution"],
  
  // Default/fallback
  default: ["coding", "programming", "development", "work"]
};

// Fallback GIF URL in case API fails
const FALLBACK_GIF_URL = "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif";

/**
 * Fetches a random GIF from Giphy API based on search term
 */
async function fetchGifFromGiphy(searchTerm: string): Promise<string> {
  try {
    const searchQuery = encodeURIComponent(searchTerm);
    const url = `${GIPHY_API_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${searchQuery}&limit=25&rating=g`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Giphy API request failed with status ${response.status}`);
      return FALLBACK_GIF_URL;
    }
    
    const data = await response.json() as GiphySearchResponse;
    
    if (!data.data || data.data.length === 0) {
      console.warn(`No GIFs found for search term: ${searchTerm}`);
      return FALLBACK_GIF_URL;
    }
    
    // Select a random GIF from the results
    const randomIndex = Math.floor(Math.random() * data.data.length);
    const gif = data.data[randomIndex];
    
    // Return the URL of the GIF (use original or downsized_medium)
    return gif.images?.original?.url || gif.images?.downsized_medium?.url || FALLBACK_GIF_URL;
  } catch (error) {
    console.warn(`Error fetching GIF from Giphy: ${error}`);
    return FALLBACK_GIF_URL;
  }
}

/**
 * Gets a random search term from a category
 */
function getRandomSearchTerm(category: string[]): string {
  const randomIndex = Math.floor(Math.random() * category.length);
  return category[randomIndex];
}

/**
 * Selects an appropriate GIF based on the analysis of the branch
 */
export async function selectGif(analysis: AnalysisResult): Promise<string> {
  let category: string;
  let searchTerms: string[];
  
  // Check for breaking changes first (highest priority)
  if (analysis.hasBreakingChanges) {
    searchTerms = GIF_SEARCH_TERMS.breaking;
    category = "breaking";
  } else {
    // Check commit types to determine the most appropriate category
    const commitTypes = analysis.commitTypes;
    
    // Priority order for commit types
    if (commitTypes.includes("feature")) {
      category = "feature";
    } else if (commitTypes.includes("fix")) {
      category = "fix";
    } else if (commitTypes.includes("test")) {
      category = "test";
    } else if (commitTypes.includes("refactor")) {
      category = "refactor";
    } else if (commitTypes.includes("perf")) {
      category = "perf";
    } else if (commitTypes.includes("documentation")) {
      category = "docs";
    } else {
      category = "default";
    }
    
    searchTerms = GIF_SEARCH_TERMS[category] || GIF_SEARCH_TERMS.default;
  }
  
  // Get a random search term and fetch GIF from Giphy
  const searchTerm = getRandomSearchTerm(searchTerms);
  return await fetchGifFromGiphy(searchTerm);
}

/**
 * Gets a GIF based on specific criteria (for more targeted selection)
 */
export async function selectGifByCriteria(
  hasBreakingChanges: boolean,
  commitTypes: string[],
  hasTests: boolean,
  isLargeChange: boolean
): Promise<string> {
  // Use the main selection logic
  const mockAnalysis: AnalysisResult = {
    currentBranch: "",
    baseBranch: "",
    totalCommits: 0,
    commits: [],
    filesChanged: 0,
    insertions: 0,
    deletions: 0,
    filesList: [],
    commitTypes,
    diffStats: "",
    hasBreakingChanges,
    hasTests
  };
  
  return await selectGif(mockAnalysis);
}
