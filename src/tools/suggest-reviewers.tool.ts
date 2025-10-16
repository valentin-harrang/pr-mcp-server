import { suggestReviewers } from "../core/git/analyzer.js";
import { ReviewersResult } from "../core/git/types.js";

/**
 * Tool: suggest_reviewers
 * Suggests code reviewers based on Git contribution history
 */
export async function executeSuggestReviewers(
  limit: number = 3,
  baseBranch: string = "main"
): Promise<ReviewersResult> {
  return suggestReviewers(limit, baseBranch);
}
