import { analyzeBranch } from "../core/git/analyzer.js";
import { git } from "../core/git/repository.js";

function truncateLines(text: string, maxLines: number): string {
  const lines = text.split("\n");
  return lines.slice(0, maxLines).join("\n");
}

/**
 * Tool: review
 * Performs a code review and provides structured feedback
 */
export async function executeReview(baseBranch?: string): Promise<string> {
  const analysis = await analyzeBranch(baseBranch, true);
  const current = analysis.currentBranch;
  const base = analysis.baseBranch || baseBranch;
  const fullDiff = await git.diff([`${base}...${current}`]);

  const changedFiles = analysis.filesList.map((f) => f.file);
  const hasTests = analysis.hasTests === true;
  const hasBreaking = analysis.hasBreakingChanges === true;

  // Heuristics on diff content
  const hasConsoleLogs = /\bconsole\.log\(/.test(fullDiff);
  const hasTodo = /TODO|FIXME/i.test(fullDiff);
  const suspectSecrets =
    /(AKIA[0-9A-Z]{16})|("?api[_-]?key"?\s*[:=])|("?secret"?\s*[:=])/i.test(
      fullDiff
    );

  const criticalIssues: string[] = [];
  if (hasBreaking)
    criticalIssues.push(
      "Potential breaking change detected (`BREAKING CHANGE`)\n"
    );
  if (!hasTests)
    criticalIssues.push("Missing or insufficient tests for modified areas\n");
  if (hasConsoleLogs)
    criticalIssues.push("Debug statements found (`console.log`)\n");
  if (hasTodo) criticalIssues.push("Leftover TODO/FIXME comments in changes\n");
  if (suspectSecrets)
    criticalIssues.push("Possible secrets or API keys in diff\n");

  // Suggestions (non-blocking)
  const suggestions: string[] = [];
  if (analysis.insertions - analysis.deletions > 300 && !hasTests) {
    suggestions.push("Add unit/integration tests for new logic");
  }
  if (changedFiles.some((f) => f.endsWith(".ts") || f.endsWith(".tsx"))) {
    suggestions.push("Ensure strict typing and avoid `any` in new code");
  }
  if (
    changedFiles.some((f) => f.includes("docs") || f.includes("README")) ===
    false
  ) {
    suggestions.push("Update documentation if behavior or APIs changed");
  }

  const decision = criticalIssues.length > 0 ? "REQUEST_CHANGES" : "APPROVE";

  // Assemble markdown, enforce 10-15 lines total
  const lines: string[] = [];
  lines.push("## Summary");
  lines.push(
    criticalIssues.length > 0
      ? "Several blocking issues found; please address before merging."
      : "No blocking issues detected; changes look good overall."
  );
  lines.push("");
  lines.push("## Critical Issues");
  if (criticalIssues.length === 0) {
    lines.push("- None");
  } else {
    for (const issue of criticalIssues.slice(0, 4)) {
      // keep bullets concise
      lines.push(`- ${issue.trim()}`);
    }
  }
  lines.push("");
  lines.push("## Key Suggestions");
  if (suggestions.length === 0) {
    lines.push("- No additional suggestions");
  } else {
    for (const s of suggestions.slice(0, 3)) {
      lines.push(`- ${s}`);
    }
  }
  lines.push("");
  lines.push("## Decision");
  lines.push(
    decision === "REQUEST_CHANGES"
      ? "REQUEST_CHANGES - Address critical issues above"
      : "APPROVE - Ship it"
  );

  return truncateLines(lines.join("\n"), 15);
}
