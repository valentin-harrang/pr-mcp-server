import { analyzeBranch } from "../core/git/analyzer.js";
import { AnalysisResult } from "../core/git/types.js";

/**
 * Tool: analyze_branch
 * Analyzes the differences between the current Git branch and a base branch
 */
export async function executeAnalyzeBranch(
  baseBranch?: string,
  detailed: boolean = true
): Promise<AnalysisResult> {
  return analyzeBranch(baseBranch, detailed);
}
