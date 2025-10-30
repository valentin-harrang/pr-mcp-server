import { analyzeBranch } from "../core/git/analyzer.js";
import { prTemplates } from "../templates/pr-templates.js";
import { Language, TemplateType } from "../validation/types.js";

const CONVENTIONAL_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
];

function inferScopeFromFiles(files: string[]): string | undefined {
  // Monorepo root directories that should use their child directory as scope
  const MONOREPO_ROOTS = ["packages", "apps", "libs", "modules", "services"];

  // Extract first directory or filename stem as scope heuristic
  for (const file of files) {
    const parts = file.split("/");
    if (parts.length > 1) {
      const firstLevel = parts[0].toLowerCase();

      // If in a monorepo structure, use the second level (e.g., packages/api -> api)
      if (MONOREPO_ROOTS.includes(firstLevel) && parts.length > 2) {
        const candidate = parts[1].replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
        if (candidate) {
          return candidate;
        }
      }

      // Otherwise use the first level
      const candidate = firstLevel.replace(/[^a-zA-Z0-9_-]/g, "-");
      if (candidate && candidate !== "src" && candidate !== "lib") {
        return candidate;
      }
    }
  }
  return undefined;
}

function inferTypeFromCommits(messages: string[]): string {
  for (const m of messages) {
    const lower = m.toLowerCase();
    for (const t of CONVENTIONAL_TYPES) {
      if (lower.startsWith(`${t}:`) || lower.startsWith(`${t}(`)) return t;
      if (t === "feat" && lower.startsWith("feature")) return "feat";
    }
  }
  // fallback by keywords
  if (messages.some((m) => /fix|bug/i.test(m))) return "fix";
  if (messages.some((m) => /feat|feature/i.test(m))) return "feat";
  if (messages.some((m) => /refactor/i.test(m))) return "refactor";
  if (messages.some((m) => /test/i.test(m))) return "test";
  return "chore";
}

function inferSubjectFromCommits(messages: string[]): string {
  const first = messages[0] || "update";
  // strip conventional prefix if present
  const cleaned = first.replace(/^[a-z]+(?:\([^)]*\))?:\s*/i, "").trim();
  return cleaned.length > 0 ? cleaned : "update";
}

export interface PRCompleteResult {
  title: string;
  description: string;
}

/**
 * Tool: generate_pr_complete
 * Generates both a conventional commit-style PR title and a complete Pull Request description
 */
export async function executeGenerateComplete(
  template: TemplateType = "standard",
  language: Language = "fr",
  includeStats: boolean = true,
  maxTitleLength?: number,
  baseBranch?: string
): Promise<PRCompleteResult> {
  try {
    const analysis = await analyzeBranch(baseBranch, true);
    const messages = analysis.commits.map((c) => c.message);
    const files = analysis.filesList.map((f) => f.file);

    // Generate title
    const type = inferTypeFromCommits(messages);
    const scope = inferScopeFromFiles(files);
    const subject = inferSubjectFromCommits(messages);

    const base = scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
    const title = !maxTitleLength || base.length <= maxTitleLength
      ? base
      : base.slice(0, Math.max(3, maxTitleLength - 3)).trimEnd() + "...";

    // Generate description with detailed changes
    const changesList = messages.map((msg) => {
      // Clean up conventional commit prefixes for better readability
      let cleanMsg = msg.replace(/^[a-z]+(?:\([^)]*\))?:\s*/i, "").trim();
      // Capitalize first letter
      cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
      return `- ${cleanMsg}`;
    }).join('\n');

    const descriptionSummary = `**What does this PR change or add?**\n\n${changesList || `- This PR contains ${analysis.totalCommits} commits with ${analysis.filesChanged} files modified.`}`;

    const data = {
      ...analysis,
      title,
      description: descriptionSummary,
      includeStats,
    };

    const templateFunc = prTemplates[template][language];
    const description = await templateFunc(data);

    return {
      title,
      description,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error generating complete PR: ${errorMessage}`);
  }
}
