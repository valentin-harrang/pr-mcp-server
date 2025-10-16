import { z } from "zod";
import { executeAnalyzeBranch } from "../../tools/analyze-branch.tool.js";
import { executeGeneratePR } from "../../tools/generate-pr-description.tool.js";
import { executeSuggestReviewers } from "../../tools/suggest-reviewers.tool.js";
import { executeGenerateTitle } from "../../tools/generate-pr-title.tool.js";
import { executeReview } from "../../tools/review.tool.js";
import { executeGenerateComplete } from "../../tools/generate-pr-complete.tool.js";
import {
  AnalyzeBranchSchema,
  GeneratePRSchema,
  SuggestReviewersSchema,
  TitleSchema,
  ReviewSchema,
  GenerateCompleteSchema,
} from "../../validation/schemas.js";

/**
 * MCP tool request handler
 * Routes tool requests to their corresponding implementations
 */
export async function handleToolRequest(
  name: string,
  args: Record<string, unknown> | undefined
) {
  try {
    switch (name) {
      case "analyze_branch": {
        const validated = AnalyzeBranchSchema.parse(args);
        const result = await executeAnalyzeBranch(
          validated.baseBranch,
          validated.detailed
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_pr_description": {
        const validated = GeneratePRSchema.parse(args);
        const description = await executeGeneratePR(
          validated.title,
          validated.template,
          validated.language,
          validated.includeStats,
          validated.baseBranch
        );
        return {
          content: [
            {
              type: "text",
              text: description,
            },
          ],
        };
      }

      case "suggest_reviewers": {
        const validated = SuggestReviewersSchema.parse(args ?? {});
        const reviewers = await executeSuggestReviewers(
          validated.limit,
          validated.baseBranch
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(reviewers, null, 2),
            },
          ],
        };
      }

      case "generate_pr_title": {
        const validated = TitleSchema.parse(args ?? {});
        const title = await executeGenerateTitle(
          validated.maxLength,
          validated.baseBranch
        );
        return {
          content: [
            {
              type: "text",
              text: title,
            },
          ],
        };
      }

      case "review": {
        const validated = ReviewSchema.parse(args ?? {});
        const review = await executeReview(validated.baseBranch);
        return {
          content: [
            {
              type: "text",
              text: review,
            },
          ],
        };
      }

      case "generate_pr_complete": {
        const validated = GenerateCompleteSchema.parse(args ?? {});
        const result = await executeGenerateComplete(
          validated.template,
          validated.language,
          validated.includeStats,
          validated.maxTitleLength,
          validated.baseBranch
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}
