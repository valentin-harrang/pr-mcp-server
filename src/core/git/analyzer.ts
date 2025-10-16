import { DiffResultTextFile } from "simple-git";
import { git } from "./repository.js";
import { AnalysisResult, ReviewersResult } from "./types.js";

/**
 * Analyzes differences between the current branch and a base branch
 */
export async function analyzeBranch(
  baseBranch: string = "main",
  detailed: boolean = true
): Promise<AnalysisResult> {
  try {
    const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
    const logs = await git.log([`${baseBranch}..${currentBranch}`]);
    const diff = await git.diff([`${baseBranch}...${currentBranch}`, "--stat"]);
    const diffSummary = await git.diffSummary([
      `${baseBranch}...${currentBranch}`,
    ]);

    const commitTypes = logs.all.map((commit) => {
      const message = commit.message.toLowerCase();
      if (message.startsWith("fix")) return "fix";
      if (message.startsWith("feat")) return "feature";
      if (message.startsWith("refactor")) return "refactor";
      if (message.startsWith("docs")) return "documentation";
      if (message.startsWith("test")) return "test";
      return "other";
    });

    const analysis: AnalysisResult = {
      currentBranch: currentBranch.trim(),
      baseBranch,
      totalCommits: logs.total,
      commits: logs.all.map((c) => ({
        hash: c.hash.substring(0, 7),
        message: c.message,
        author: c.author_name,
        date: c.date,
      })),
      filesChanged: diffSummary.files.length,
      insertions: diffSummary.insertions,
      deletions: diffSummary.deletions,
      filesList: diffSummary.files.map((f) => {
        const isTextFile = "changes" in f;
        return {
          file: f.file,
          changes: isTextFile ? (f as DiffResultTextFile).changes : 0,
          insertions: isTextFile ? (f as DiffResultTextFile).insertions : 0,
          deletions: isTextFile ? (f as DiffResultTextFile).deletions : 0,
        };
      }),
      commitTypes: [...new Set(commitTypes)],
      diffStats: diff,
    };

    if (detailed) {
      const fullDiff = await git.diff([`${baseBranch}...${currentBranch}`]);
      analysis.hasBreakingChanges = fullDiff.includes("BREAKING CHANGE");
      analysis.hasTests = diffSummary.files.some(
        (f) => f.file.includes("test") || f.file.includes("spec")
      );
    }

    return analysis;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error analyzing branch: ${errorMessage}`);
  }
}

/**
 * Suggests code reviewers based on Git contribution history
 */
export async function suggestReviewers(
  limit: number = 3,
  baseBranch: string = "main"
): Promise<ReviewersResult> {
  try {
    const analysis = await analyzeBranch(baseBranch);
    const fileAuthors = new Map<string, number>();

    for (const file of analysis.filesList.slice(0, 10)) {
      const log = await git.log(["--follow", "--pretty=format:%an", file.file]);
      log.all.forEach((commit) => {
        const author = commit.author_name;
        if (author) {
          fileAuthors.set(author, (fileAuthors.get(author) || 0) + 1);
        }
      });
    }

    const sorted = Array.from(fileAuthors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return {
      suggestedReviewers: sorted.map(([author, contributions]) => ({
        author,
        contributions,
        reason: `Contributed ${contributions} times to modified files`,
      })),
      basedOn: `Analysis of ${Math.min(
        10,
        analysis.filesList.length
      )} modified files`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      suggestedReviewers: [],
      basedOn: "Unable to determine reviewers",
      error: errorMessage,
    };
  }
}
