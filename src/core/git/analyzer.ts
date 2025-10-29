import { DiffResultTextFile } from "simple-git";
import { detectMainBranch, createGitInstance } from "./repository.js";
import { AnalysisResult, ReviewersResult } from "./types.js";

export async function analyzeBranch(
  baseBranch?: string,
  detailed: boolean = true
): Promise<AnalysisResult> {
  try {
    const workingDir = process.cwd();
    const workingGit = createGitInstance(workingDir);
    const detectedBaseBranch = baseBranch || await detectMainBranch(workingDir);
    
    const currentBranch = await workingGit.revparse(["--abbrev-ref", "HEAD"]);
    const logs = await workingGit.log([`${detectedBaseBranch}..${currentBranch}`]);
    const diff = await workingGit.diff([`${detectedBaseBranch}...${currentBranch}`, "--stat"]);
    const diffSummary = await workingGit.diffSummary([
      `${detectedBaseBranch}...${currentBranch}`,
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
      baseBranch: detectedBaseBranch,
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
      const fullDiff = await workingGit.diff([`${detectedBaseBranch}...${currentBranch}`]);
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
 * Extract GitHub username from git email or name
 */
function extractGitHubUsername(email: string, name: string): string | null {
  // Try to extract from GitHub email formats:
  // - username@users.noreply.github.com
  // - 12345+username@users.noreply.github.com
  const noreplyMatch = email.match(/(?:\d+\+)?([^@]+)@users\.noreply\.github\.com/);
  if (noreplyMatch) {
    return noreplyMatch[1];
  }
  
  // Try to extract username from email local part (best effort)
  // e.g., john.doe@company.com -> johndoe (without separators first, then with hyphen)
  const emailLocal = email.split('@')[0];
  if (emailLocal && emailLocal.length > 0) {
    // GitHub usernames: Try without separators first (most common)
    const withoutSeparators = emailLocal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (withoutSeparators && withoutSeparators.length >= 3) {
      return withoutSeparators;
    }
    
    // Fallback: use hyphens for separators
    const withHyphens = emailLocal.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    if (withHyphens) {
      return withHyphens;
    }
  }
  
  // Fallback: try to use the name (remove spaces, no hyphens)
  const nameWithoutSpaces = name.replace(/\s+/g, '').toLowerCase();
  if (nameWithoutSpaces && nameWithoutSpaces.length >= 3) {
    return nameWithoutSpaces;
  }
  
  // Last resort: use hyphens
  return name.replace(/\s+/g, '-').toLowerCase();
}

export async function suggestReviewers(
  limit: number = 3,
  baseBranch?: string
): Promise<ReviewersResult> {
  try {
    const analysis = await analyzeBranch(baseBranch);
    const workingDir = process.cwd();
    const workingGit = createGitInstance(workingDir);
    const fileAuthors = new Map<string, { email: string; name: string; count: number }>();

    if (analysis.filesList.length === 0) {
      return {
        suggestedReviewers: [],
        basedOn: "No files were modified in this branch",
        error: "No modified files to analyze",
      };
    }

    const filesToAnalyze = analysis.filesList.slice(0, 10);
    let totalCommitsAnalyzed = 0;

    for (const file of filesToAnalyze) {
      try {
        // Get commit history for this file with author info
        const log = await workingGit.log(["--follow", file.file]);
        
        if (log.all && log.all.length > 0) {
          totalCommitsAnalyzed += log.all.length;
          
          log.all.forEach((commit) => {
            // Use native simple-git fields
            const name = commit.author_name;
            const email = commit.author_email;
            
            if (name && email) {
              const key = `${name}|${email}`;
              const existing = fileAuthors.get(key);
              if (existing) {
                existing.count++;
              } else {
                fileAuthors.set(key, { email, name, count: 1 });
              }
            }
          });
        }
      } catch (fileError) {
        // Skip files that cause errors (might be new files)
        console.warn(`Could not analyze history for ${file.file}: ${fileError}`);
      }
    }

    if (totalCommitsAnalyzed === 0) {
      return {
        suggestedReviewers: [],
        basedOn: `Analyzed ${filesToAnalyze.length} file(s), but found no Git history (likely new files)`,
        error: "No commit history found for modified files",
      };
    }

    const sorted = Array.from(fileAuthors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    if (sorted.length === 0) {
      return {
        suggestedReviewers: [],
        basedOn: `Analyzed ${totalCommitsAnalyzed} commit(s) from ${filesToAnalyze.length} file(s), but no valid contributors found`,
        error: "No valid contributors extracted from Git history",
      };
    }

    return {
      suggestedReviewers: sorted.map((author) => {
        const username = extractGitHubUsername(author.email, author.name);
        return {
          author: username || author.name,
          contributions: author.count,
          reason: `Contributed ${author.count} times to modified files (${author.email})`,
        };
      }),
      basedOn: `Analyzed ${totalCommitsAnalyzed} commit(s) from ${Math.min(
        10,
        analysis.filesList.length
      )} modified file(s)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      suggestedReviewers: [],
      basedOn: "Unable to determine reviewers due to error",
      error: errorMessage,
    };
  }
}
