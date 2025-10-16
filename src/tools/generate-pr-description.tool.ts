import { analyzeBranch } from "../core/git/analyzer.js";
import { prTemplates } from "../templates/pr-templates.js";
import { Language, TemplateType } from "../validation/types.js";

/**
 * Tool: generate_pr_description
 * Generates a complete Pull Request description based on Git analysis
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

    const data = {
      ...analysis,
      title,
      description: title ? `Cette PR implémente: ${title}` : null,
      includeStats,
    };

    const templateFunc = prTemplates[template][language];
    return templateFunc(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error generating PR description: ${errorMessage}`);
  }
}
