import { analyzeBranch } from "../core/git/analyzer.js";
import { git } from "../core/git/repository.js";
import { gatherProjectContext, formatProjectContextForPrompt } from "../core/context/project-context.js";

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
 * Returns an AI prompt for generating an intelligent PR title by analyzing code changes.
 * This tool should be called by AI assistants (like Claude) who will then generate the actual title.
 */
export async function executeGenerateTitle(
  maxLength?: number,
  baseBranch?: string
): Promise<string> {
  const analysis = await analyzeBranch(baseBranch, true);
  const current = analysis.currentBranch;
  const base = analysis.baseBranch || baseBranch;
  const fullDiff = await git.diff([`${base}...${current}`]);

  const messages = analysis.commits.map((c) => c.message);
  const files = analysis.filesList.map((f) => f.file);

  const suggestedType = inferTypeFromCommits(messages);
  const suggestedScope = inferScopeFromFiles(files);

  // Gather project context for better title generation
  const projectContext = await gatherProjectContext();
  const contextPrompt = formatProjectContextForPrompt(projectContext);

  // Return a structured prompt for AI to generate an intelligent PR title
  return `# PR Title Generation Request

Please generate a concise, descriptive PR title following conventional commit format.

${contextPrompt}

## Changes Summary
- **Branch**: ${current} → ${base}
- **Files Changed**: ${analysis.filesChanged}
- **Commits**: ${analysis.totalCommits}

## Modified Files
${analysis.filesList.slice(0, 10).map(f => `- ${f.file} (+${f.insertions} -${f.deletions})`).join('\n')}${analysis.filesList.length > 10 ? `\n... and ${analysis.filesList.length - 10} more files` : ''}

## Commit Messages (for context)
${messages.slice(0, 5).map(m => `- ${m}`).join('\n')}${messages.length > 5 ? `\n... and ${messages.length - 5} more commits` : ''}

## Code Changes (Diff Preview)
\`\`\`diff
${fullDiff.slice(0, 8000)}${fullDiff.length > 8000 ? '\n... (diff truncated for length)' : ''}
\`\`\`

---

**INSTRUCTIONS FOR AI:**

Analyze the code changes above and generate a PR title that:
1. **Follows conventional commit format**: \`type(scope): description\`
   - Suggested type based on commits: **${suggestedType}**
   - Suggested scope based on files: **${suggestedScope || "(no scope)"}**
2. **Describes WHAT was actually changed** (not just the commit message)
3. **Is concise and descriptive** (${maxLength ? `max ${maxLength} characters` : 'reasonable length'})
4. **Uses present tense** (e.g., "add", "fix", "update", not "added", "fixed")

**IMPORTANT**:
- The type and scope suggestions above are based on commit messages and file paths
- You SHOULD keep the type (${suggestedType}) and scope (${suggestedScope || "none"}) from the suggestion
- Focus on generating a better, more descriptive subject line based on the actual code changes
- Respond with ONLY the PR title, nothing else

**Format Examples:**
- \`feat(auth): add OAuth2 authentication flow\`
- \`fix(api): resolve race condition in user requests\`
- \`refactor(components): extract shared button logic\`

**Your response must be ONLY the title (one line), with no explanation.**`;
}

/**
 * Generates a basic conventional commit-style PR title (fallback/legacy function)
 * This is used internally by other tools that need a quick title.
 */
export async function executeGenerateTitleSimple(
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
