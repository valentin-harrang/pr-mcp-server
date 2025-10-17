import { AnalysisResult } from "../core/git/types.js";

// GIF categories based on commit types and work patterns
const GIF_CATEGORIES = {
  // Feature development
  feature: [
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Building something
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // Coding
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Success
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Celebration
  ],
  
  // Bug fixes
  fix: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // Bug squashing
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Problem solved
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Debugging
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Victory
  ],
  
  // Documentation
  docs: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // Writing
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Organizing
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Knowledge
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Learning
  ],
  
  // Testing
  test: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // Testing
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Quality assurance
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Success
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Confidence
  ],
  
  // Refactoring
  refactor: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // Cleaning up
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Improving
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Better code
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Optimization
  ],
  
  // Performance improvements
  perf: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // Speed
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Optimization
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Fast
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Performance
  ],
  
  // Breaking changes
  breaking: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // Major changes
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Big update
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Transformation
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Evolution
  ],
  
  // Default/fallback
  default: [
    "https://media.giphy.com/media/3o7aCRloybJlXNLGk0/giphy.gif", // General work
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif", // Coding
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", // Progress
    "https://media.giphy.com/media/3o7aTskTEUldX6sVj2/giphy.gif", // Development
  ]
};

/**
 * Selects an appropriate GIF based on the analysis of the branch
 */
export function selectGif(analysis: AnalysisResult): string {
  // Check for breaking changes first (highest priority)
  if (analysis.hasBreakingChanges) {
    return getRandomGif(GIF_CATEGORIES.breaking);
  }
  
  // Check commit types to determine the most appropriate category
  const commitTypes = analysis.commitTypes;
  
  // Priority order for commit types
  if (commitTypes.includes("feature")) {
    return getRandomGif(GIF_CATEGORIES.feature);
  }
  
  if (commitTypes.includes("fix")) {
    return getRandomGif(GIF_CATEGORIES.fix);
  }
  
  if (commitTypes.includes("test")) {
    return getRandomGif(GIF_CATEGORIES.test);
  }
  
  if (commitTypes.includes("refactor")) {
    return getRandomGif(GIF_CATEGORIES.refactor);
  }
  
  if (commitTypes.includes("perf")) {
    return getRandomGif(GIF_CATEGORIES.perf);
  }
  
  if (commitTypes.includes("documentation")) {
    return getRandomGif(GIF_CATEGORIES.docs);
  }
  
  // Fallback to default
  return getRandomGif(GIF_CATEGORIES.default);
}

/**
 * Gets a random GIF from a category
 */
function getRandomGif(category: string[]): string {
  const randomIndex = Math.floor(Math.random() * category.length);
  return category[randomIndex];
}

/**
 * Gets a GIF based on specific criteria (for more targeted selection)
 */
export function selectGifByCriteria(
  hasBreakingChanges: boolean,
  commitTypes: string[],
  hasTests: boolean,
  isLargeChange: boolean
): string {
  // Large changes get special treatment
  if (isLargeChange && hasBreakingChanges) {
    return getRandomGif(GIF_CATEGORIES.breaking);
  }
  
  // Test-heavy changes
  if (hasTests && commitTypes.includes("test")) {
    return getRandomGif(GIF_CATEGORIES.test);
  }
  
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
  
  return selectGif(mockAnalysis);
}
