import { analyzeBranch } from "../core/git/analyzer.js";
import { prTemplates } from "../templates/pr-templates.js";
import { Language, TemplateType } from "../validation/types.js";
import { gatherProjectContext, formatProjectContextForPrompt } from "../core/context/project-context.js";
import { git } from "../core/git/repository.js";

/**
 * Tool: generate_pr_description
 * 
 * Returns a comprehensive PROMPT for the AI to generate a PR description.
 * This is NOT the final description - it provides all the context needed
 * for Claude to write an intelligent, project-specific description.
 */
export async function executeGeneratePR(
  title?: string,
  template: TemplateType = "standard",
  language: Language = "fr",
  includeStats: boolean = true,
  baseBranch?: string
): Promise<string> {
  try {
    const analysis = await analyzeBranch(baseBranch, true);
    const current = analysis.currentBranch;
    const base = analysis.baseBranch || baseBranch;
    
    // Get project context
    const projectContext = await gatherProjectContext();
    const contextPrompt = formatProjectContextForPrompt(projectContext);
    
    // Get diff for context
    const fullDiff = await git.diff([`${base}...${current}`]);
    const truncatedDiff = fullDiff.slice(0, 10000);

    const templateInfo = template === "detailed" ? "detailed with extensive sections" :
                        template === "minimal" ? "minimal and concise" :
                        "standard with key sections";

    const languageInfo = language === "fr" ? "French (français)" : "English";

    return `# PR Description Generation Request

Please generate a comprehensive Pull Request description based on the following information.

${contextPrompt}

## Changes Summary
- **Branch**: ${analysis.currentBranch} → ${analysis.baseBranch}
- **Commits**: ${analysis.totalCommits}
- **Files Changed**: ${analysis.filesChanged}
- **Insertions**: +${analysis.insertions}
- **Deletions**: -${analysis.deletions}
${title ? `- **Proposed Title**: ${title}` : ''}

## Commit Messages
${analysis.commits.map(c => `- ${c.hash}: ${c.message}`).join('\n')}

## Modified Files
${analysis.filesList.map(f => `- ${f.file} (+${f.insertions} -${f.deletions})`).join('\n')}

## Sample Diff (first 10k chars)
\`\`\`diff
${truncatedDiff}${fullDiff.length > 10000 ? '\n... (diff truncated)' : ''}
\`\`\`

---

**INSTRUCTIONS FOR AI PR DESCRIPTION:**

Generate a ${templateInfo} Pull Request description in **${languageInfo}**.

${includeStats ? '**Include statistics** about the changes (files, lines, commits).' : '**Do not include** detailed statistics.'}

The description should include:

1. **What** - Clear explanation of what this PR changes/adds/fixes
2. **Why** - Context on why these changes are needed
3. **How** - Brief overview of the technical approach${template === "detailed" ? ' (detailed)' : ''}
4. **Impact** - What areas of the codebase are affected
${template !== "minimal" ? '5. **Testing** - How the changes were/should be tested' : ''}

**Format Requirements:**
- Use markdown formatting
- Be clear and concise (${template === "minimal" ? '3-5 sentences' : template === "detailed" ? '2-3 paragraphs per section' : '1-2 paragraphs per section'})
- Focus on the actual changes in the diff and commits
- Adapt language to the project's tech stack (based on Project Context)
${language === "fr" ? '- Write in professional French' : '- Write in clear English'}

**Important**: Generate ONLY the PR description text, not this prompt. The description should be ready to paste into GitHub.`;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error generating PR description prompt: ${errorMessage}`);
  }
}

/**
 * Generates a simple PR description automatically using templates.
 * This is the fallback when no AI-generated description is provided.
 */
export async function executeGeneratePRSimple(
  title?: string,
  template: TemplateType = "standard",
  language: Language = "fr",
  includeStats: boolean = true,
  baseBranch?: string
): Promise<string> {
  try {
    const analysis = await analyzeBranch(baseBranch, true);

    const data = {
      ...analysis,
      title,
      description: title ? `Cette PR implémente: ${title}` : null,
      includeStats,
    };

    const templateFunc = prTemplates[template][language];
    return await templateFunc(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error generating PR description: ${errorMessage}`);
  }
}
