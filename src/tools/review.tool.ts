import { analyzeBranch } from "../core/git/analyzer.js";
import { git } from "../core/git/repository.js";
import { gatherProjectContext, formatProjectContextForPrompt } from "../core/context/project-context.js";

/**
 * Tool: review
 *
 * This tool prepares all the context needed for an AI-powered code review.
 * It does NOT perform the review itself - instead, it returns all the information
 * that Claude (the AI) needs to perform an intelligent, context-aware review.
 *
 * The AI analyzing this data will have access to:
 * - The full diff of changes
 * - Complete project context (languages, frameworks, tools, conventions)
 * - Git analysis (commits, files changed, breaking changes)
 * - File list and statistics
 *
 * This allows Claude to provide truly intelligent, project-specific feedback
 * that adapts to ANY project (PHP, Python, Go, Rust, TypeScript, etc.)
 */
export async function executeReview(baseBranch?: string): Promise<string> {
  const reviewData = await executeAIReview(baseBranch);

  // Return a structured prompt for the AI to analyze
  // This will be consumed by Claude who will provide the actual intelligent review
  return `# Code Review Request

Please perform a comprehensive, context-aware code review of these changes.

${reviewData.projectContext}

## Changes Summary
- **Branch**: ${reviewData.analysis.currentBranch} → ${reviewData.analysis.baseBranch}
- **Commits**: ${reviewData.analysis.totalCommits}
- **Files Changed**: ${reviewData.analysis.filesChanged}
- **Insertions**: +${reviewData.analysis.insertions}
- **Deletions**: -${reviewData.analysis.deletions}
- **Has Tests**: ${reviewData.analysis.hasTests ? 'Yes' : 'No'}
- **Breaking Changes**: ${reviewData.analysis.hasBreakingChanges ? 'Yes' : 'No'}

## Modified Files
${reviewData.analysis.filesList.map(f => `- ${f.file} (+${f.insertions} -${f.deletions})`).join('\n')}

## Commit Messages
${reviewData.analysis.commits.map(c => `- ${c.hash}: ${c.message}`).join('\n')}

## Full Diff
\`\`\`diff
${reviewData.diff.slice(0, 15000)}${reviewData.diff.length > 15000 ? '\n... (diff truncated for length)' : ''}
\`\`\`

---

**IMPORTANT INSTRUCTIONS FOR AI REVIEW:**

As a senior software engineer, please provide a comprehensive GitHub Pull Request review with the following priority structure:

## PRIMARY ANALYSIS (High Priority - Focus Here)
**Review the PR diff/changes with highest attention:**
1. **Modified Code Review**: Analyze each changed/added line in the PR diff above
2. **Context Compliance**: Verify changes follow project-specific patterns, tools, and conventions (based on Project Context section)
3. **Change Quality**: Check new code for bugs, security issues, performance problems
4. **Best Practices**: Ensure new code follows coding standards and established patterns for this tech stack
5. **Architecture Fit**: Verify changes align with existing architecture and guidelines (check if adr/ or docs/ exist in Project Structure)
6. **Testing Coverage**: Assess if appropriate tests are included based on the project's testing framework
7. **Breaking Changes**: Identify any potential breaking changes or compatibility issues

## SECONDARY ANALYSIS (Lower Priority - Context Review)
8. **Integration Impact**: How changes interact with existing code and dependencies
9. **Code Consistency**: Overall consistency with existing codebase patterns
10. **Refactoring Opportunities**: Suggest improvements to related existing code (if relevant)
11. **Documentation Updates**: Check if broader documentation needs updates

## CRITICAL: OUTPUT REQUIREMENTS
Your response MUST be:
- **CONCISE**: Maximum 10-15 lines total
- **DIRECT**: No fluff, verbose explanations, or unnecessary details
- **ACTIONABLE**: Only mention issues that need immediate action
- **STRUCTURED**: Use bullet points, not paragraphs
- **FORMATTED**: Raw markdown syntax that can be copied/pasted directly into GitHub

**IMPORTANT**: Your response must use this EXACT format:

## Summary
[2-3 sentence overview of the changes and overall quality]

## Critical Issues
- [Issue 1 with \`code\` references]
- [Issue 2 with context violations]
- None (if no critical issues)

## Key Suggestions
- [Actionable suggestion 1]
- [Actionable suggestion 2]
- No additional suggestions (if none)

## Decision
REQUEST_CHANGES - [brief reason]
OR
APPROVE - [brief reason]

**Be ruthlessly concise. Skip minor issues. Focus only on what matters for THIS specific project based on the Project Context above.**`;
}

/**
 * Generates a comprehensive AI-powered review with full project context.
 * This version returns all the raw data needed for AI analysis.
 */
export async function executeAIReview(baseBranch?: string): Promise<{
  projectContext: string;
  diff: string;
  analysis: Awaited<ReturnType<typeof analyzeBranch>>;
}> {
  const analysis = await analyzeBranch(baseBranch, true);
  const current = analysis.currentBranch;
  const base = analysis.baseBranch || baseBranch;
  const fullDiff = await git.diff([`${base}...${current}`]);

  // Gather comprehensive project context
  const projectContext = await gatherProjectContext();
  const contextPrompt = formatProjectContextForPrompt(projectContext);

  return {
    projectContext: contextPrompt,
    diff: fullDiff,
    analysis,
  };
}
