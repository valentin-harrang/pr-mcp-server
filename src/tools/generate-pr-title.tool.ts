import { analyzeBranch } from "../core/git/analyzer.js";

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

/**
 * Tool: generate_pr_title
 * Generates a conventional commit-style PR title
 */
export async function executeGenerateTitle(
  maxLength?: number,
  baseBranch?: string
): Promise<string> {
  const analysis = await analyzeBranch(baseBranch, true);
  const messages = analysis.commits.map((c) => c.message);
  const files = analysis.filesList.map((f) => f.file);

  const type = inferTypeFromCommits(messages);
  const scope = inferScopeFromFiles(files);
  const subject = inferSubjectFromCommits(messages);

  const base = scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
  if (!maxLength || base.length <= maxLength) return base;

  // leave space for ellipsis
  const allowed = Math.max(3, maxLength - 3);
  return base.slice(0, allowed).trimEnd() + "...";
}
