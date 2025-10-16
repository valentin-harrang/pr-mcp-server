export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface FileChange {
  file: string;
  changes: number;
  insertions: number;
  deletions: number;
}

export interface AnalysisResult {
  currentBranch: string;
  baseBranch: string;
  totalCommits: number;
  commits: CommitInfo[];
  filesChanged: number;
  insertions: number;
  deletions: number;
  filesList: FileChange[];
  commitTypes: string[];
  diffStats: string;
  hasBreakingChanges?: boolean;
  hasTests?: boolean;
}

export interface ReviewerSuggestion {
  author: string;
  contributions: number;
  reason: string;
}

export interface ReviewersResult {
  suggestedReviewers: ReviewerSuggestion[];
  basedOn: string;
  error?: string;
}
