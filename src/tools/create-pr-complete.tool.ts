import { Octokit } from "@octokit/rest";
import { createGitInstance, getGitHubRepoInfo, detectMainBranch } from "../core/git/repository.js";
import { executeGenerateTitle } from "./generate-pr-title.tool.js";
import { executeSuggestReviewers } from "./suggest-reviewers.tool.js";
import { Language, TemplateType } from "../validation/types.js";
import { analyzeBranch } from "../core/git/analyzer.js";
import { prTemplates } from "../templates/pr-templates.js";
import { CommitInfo } from "../core/git/types.js";
import { gatherProjectContext } from "../core/context/project-context.js";

export interface CreatePRCompleteResult {
  url: string;
  number: number;
  title: string;
  state: string;
  action: 'created' | 'reopened' | 'updated';
  reviewers?: string[];
  reviewersAdded?: number;
  reviewerNote?: string;
  reviewPerformed: boolean;
}

/**
 * Tool: create_pr_complete
 *
 * UNIFIED PR CREATION WORKFLOW
 *
 * This is the main orchestrator that performs the complete PR creation workflow:
 * 1. Analyzes changes and gathers project context
 * 2. Generates PR title based on branch name and changes
 * 3. Performs AI-powered code review with project context awareness
 * 4. Generates comprehensive PR description including the review
 * 5. Adds relevant GIF at the end
 * 6. Creates/updates the PR on GitHub
 * 7. Assigns appropriate reviewers automatically
 *
 * When you say "Create a PR", this tool does everything automatically.
 */
export async function executeCreatePRComplete(
  template: TemplateType = "standard",
  language: Language = "fr",
  includeStats: boolean = true,
  maxTitleLength?: number,
  baseBranch?: string,
  draft: boolean = false,
  githubToken?: string,
  addReviewers: boolean = true,
  maxReviewers: number = 3,
  includeAIReview: boolean = false,
  aiReviewText?: string
): Promise<CreatePRCompleteResult> {
  try {
    console.error("=== UNIFIED PR CREATION WORKFLOW STARTING ===");

    // Get GitHub token
    const token = githubToken || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        "GitHub token is required. Set GITHUB_TOKEN environment variable or pass it as parameter."
      );
    }

    // Get repository info
    const workingDir = process.cwd();
    const repoInfo = await getGitHubRepoInfo(workingDir);

    // Get current branch and base branch
    const workingGit = createGitInstance(workingDir);
    const currentBranch = (await workingGit.revparse(["--abbrev-ref", "HEAD"])).trim();
    const detectedBaseBranch = baseBranch || await detectMainBranch(workingDir);

    console.error(`📊 Branch: ${currentBranch} -> ${detectedBaseBranch}`);

    // STEP 1: Analyze changes & gather context
    console.error("🔍 STEP 1: Analyzing changes and gathering project context...");
    const analysis = await analyzeBranch(detectedBaseBranch, true);
    const projectContext = await gatherProjectContext();
    console.error(`   ✓ Found ${analysis.totalCommits} commits, ${analysis.filesChanged} files changed`);
    console.error(`   ✓ Project context: ${projectContext.hasTypeScript ? 'TypeScript' : 'JavaScript'}${projectContext.testingFramework ? `, ${projectContext.testingFramework}` : ''}${projectContext.stylingApproach ? `, ${projectContext.stylingApproach}` : ''}`);

    // STEP 2: Generate PR title
    console.error("📝 STEP 2: Generating PR title...");
    const title = await executeGenerateTitle(maxTitleLength, detectedBaseBranch);
    console.error(`   ✓ Title: ${title}`);

    // STEP 3: Add AI review if provided
    let reviewSection = "";
    if (aiReviewText) {
      console.error("🤖 STEP 3: Including AI-generated code review...");
      console.error(`   ✓ Review text provided (${aiReviewText.split('\n').length} lines)`);

      // Format review section with the actual AI-generated review
      reviewSection = `\n\n---\n\n## 🤖 AI Code Review\n\n${aiReviewText}\n\n---`;
    } else if (includeAIReview) {
      console.error("⚠️  STEP 3: includeAIReview is true but no aiReviewText provided");
      console.error("   ℹ️  Skipping review section. To include a review, call 'review' tool first,");
      console.error("   ℹ️  then pass the generated review as 'aiReviewText' parameter.");
    } else {
      console.error("⏭️  STEP 3: Skipping AI review (disabled)");
    }

    // STEP 4: Generate PR description with review included
    console.error("📄 STEP 4: Generating comprehensive PR description...");

    // Build enhanced description with commits in descriptive format
    const commitsList = analysis.commits
      .map((c: CommitInfo) => {
        let message = c.message;

        // Transform commit messages to be more descriptive
        if (language === "fr") {
          message = message.replace(/^feat(\(.+\))?:?\s*/i, 'Ajoute ');
          message = message.replace(/^add(\(.+\))?:?\s*/i, 'Ajoute ');
          message = message.replace(/^fix(\(.+\))?:?\s*/i, 'Corrige ');
          message = message.replace(/^update(\(.+\))?:?\s*/i, 'Met à jour ');
          message = message.replace(/^refactor(\(.+\))?:?\s*/i, 'Refactorise ');
          message = message.replace(/^remove(\(.+\))?:?\s*/i, 'Supprime ');
          message = message.replace(/^implement(\(.+\))?:?\s*/i, 'Implémente ');
          message = message.replace(/^improve(\(.+\))?:?\s*/i, 'Améliore ');
          message = message.replace(/^enhance(\(.+\))?:?\s*/i, 'Améliore ');
        } else {
          message = message.replace(/^feat(\(.+\))?:?\s*/i, 'Adds ');
          message = message.replace(/^add(\(.+\))?:?\s*/i, 'Adds ');
          message = message.replace(/^fix(\(.+\))?:?\s*/i, 'Fixes ');
          message = message.replace(/^update(\(.+\))?:?\s*/i, 'Updates ');
          message = message.replace(/^refactor(\(.+\))?:?\s*/i, 'Refactors ');
          message = message.replace(/^remove(\(.+\))?:?\s*/i, 'Removes ');
          message = message.replace(/^implement(\(.+\))?:?\s*/i, 'Implements ');
          message = message.replace(/^improve(\(.+\))?:?\s*/i, 'Improves ');
          message = message.replace(/^enhance(\(.+\))?:?\s*/i, 'Enhances ');
        }

        // Lowercase first letter to make it flow better
        message = message.charAt(0).toLowerCase() + message.slice(1);

        return `- ${message}`;
      })
      .join('\n');

    const data = {
      ...analysis,
      title,
      description: commitsList,
      includeStats,
      projectContext,
    };

    const templateFunc = prTemplates[template][language];
    let description = await templateFunc(data);

    // Insert the AI review section before the GIF
    if (reviewSection) {
      // Find the GIF line and insert review before it
      const gifMatch = description.match(/!\[.*?\]\(.*?\)/);
      if (gifMatch) {
        const gifIndex = description.indexOf(gifMatch[0]);
        description = description.slice(0, gifIndex) + reviewSection + "\n\n" + description.slice(gifIndex);
        console.error(`   ✓ Review inserted before GIF`);
      } else {
        // No GIF found, append review at the end
        description += reviewSection;
        console.error(`   ✓ Review appended (no GIF found)`);
      }
    }

    console.error(`   ✓ Description generated (${description.split('\n').length} lines)`);

    // Verify branch exists on remote
    const octokit = new Octokit({ auth: token });

    try {
      await octokit.rest.repos.getBranch({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        branch: currentBranch,
      });
    } catch (error: unknown) {
      const errorStatus = error && typeof error === 'object' && 'status' in error ? error.status : null;
      if (errorStatus === 404) {
        throw new Error(
          `Branch "${currentBranch}" does not exist on remote. Please push your branch first:\n` +
          `  git push -u origin ${currentBranch}`
        );
      }
      throw error;
    }

    // STEP 5: Create or update PR on GitHub
    console.error("🚀 STEP 5: Creating/updating PR on GitHub...");

    // Check if a PR already exists for this branch
    const { data: existingPRs } = await octokit.rest.pulls.list({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      head: `${repoInfo.owner}:${currentBranch}`,
      base: detectedBaseBranch,
      state: 'all',
    });

    let pr;
    let action: 'created' | 'reopened' | 'updated';

    if (existingPRs.length > 0) {
      const existingPR = existingPRs[0];

      if (existingPR.state === 'closed') {
        console.error(`   ℹ️  Reopening closed PR #${existingPR.number}`);
        const { data: reopenedPR } = await octokit.rest.pulls.update({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          pull_number: existingPR.number,
          title,
          body: description,
          state: 'open',
        });
        pr = reopenedPR;
        action = 'reopened';
      } else {
        console.error(`   ℹ️  Updating existing PR #${existingPR.number}`);
        const { data: updatedPR } = await octokit.rest.pulls.update({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          pull_number: existingPR.number,
          title,
          body: description,
        });
        pr = updatedPR;
        action = 'updated';
      }
    } else {
      console.error(`   ℹ️  Creating new PR`);
      const { data: newPR } = await octokit.rest.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title,
        body: description,
        head: currentBranch,
        base: detectedBaseBranch,
        draft,
      });
      pr = newPR;
      action = 'created';
    }

    console.error(`   ✓ PR ${action}: #${pr.number}`);

    // STEP 6: Assign reviewers automatically
    let reviewersAdded: string[] = [];
    let reviewerError: string | undefined;

    if (addReviewers) {
      console.error("👥 STEP 6: Assigning reviewers based on Git history...");
      try {
        const reviewersResult = await executeSuggestReviewers(maxReviewers, detectedBaseBranch);

        if (reviewersResult.error) {
          reviewerError = `${reviewersResult.basedOn}: ${reviewersResult.error}`;
          console.error(`   ⚠️  Could not add reviewers: ${reviewerError}`);
        } else if (reviewersResult.suggestedReviewers.length === 0) {
          reviewerError = `${reviewersResult.basedOn}. No reviewers could be suggested.`;
          console.error(`   ⚠️  ${reviewerError}`);
        } else {
          // Filter out the PR author from reviewers
          const currentUser = (await octokit.rest.users.getAuthenticated()).data.login;
          const allSuggested = reviewersResult.suggestedReviewers.map(r => r.author);
          const reviewerLogins = allSuggested.filter(
            author => author.toLowerCase() !== currentUser.toLowerCase()
          );

          if (reviewerLogins.length === 0) {
            reviewerError = `${reviewersResult.basedOn}. All suggested reviewers filtered out (you are the only contributor)`;
            console.error(`   ⚠️  ${reviewerError}`);
          } else {
            try {
              const response = await octokit.rest.pulls.requestReviewers({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                pull_number: pr.number,
                reviewers: reviewerLogins,
              });

              const actuallyAdded = response.data.requested_reviewers?.map(r => r.login) || [];

              if (actuallyAdded.length === 0) {
                reviewerError = `${reviewersResult.basedOn}. Attempted to add: ${reviewerLogins.join(', ')} - but GitHub couldn't add them.`;
                console.error(`   ⚠️  ${reviewerError}`);
              } else if (actuallyAdded.length < reviewerLogins.length) {
                const notAdded = reviewerLogins.filter(r => !actuallyAdded.includes(r));
                reviewersAdded = actuallyAdded;
                reviewerError = `Partially successful: Added ${actuallyAdded.join(', ')} but couldn't add ${notAdded.join(', ')}`;
                console.error(`   ⚠️  ${reviewerError}`);
                console.error(`   ✓ Added ${reviewersAdded.length} reviewer(s): ${reviewersAdded.join(', ')}`);
              } else {
                reviewersAdded = actuallyAdded;
                console.error(`   ✓ Added ${reviewersAdded.length} reviewer(s): ${reviewersAdded.join(', ')}`);
              }
            } catch (githubError: unknown) {
              const errorMsg = githubError instanceof Error ? githubError.message : String(githubError);
              reviewerError = `${reviewersResult.basedOn}. GitHub API error: ${errorMsg}`;
              console.error(`   ⚠️  ${reviewerError}`);
            }
          }
        }
      } catch (error) {
        reviewerError = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`   ⚠️  ${reviewerError}`);
      }
    } else {
      console.error("⏭️  STEP 6: Skipping reviewer assignment (disabled)");
    }

    console.error("=== WORKFLOW COMPLETE ===");
    console.error(`✨ PR: ${pr.html_url}`);

    return {
      url: pr.html_url,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      action,
      reviewers: reviewersAdded.length > 0 ? reviewersAdded : undefined,
      reviewersAdded: reviewersAdded.length,
      reviewerNote: reviewerError || (reviewersAdded.length > 0 ? undefined : "No reviewers were automatically added"),
      reviewPerformed: includeAIReview,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ERROR: ${errorMessage}`);
    throw new Error(`Error creating complete PR: ${errorMessage}`);
  }
}
