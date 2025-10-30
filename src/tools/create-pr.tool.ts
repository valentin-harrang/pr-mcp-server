import { Octokit } from "@octokit/rest";
import { createGitInstance, getGitHubRepoInfo, detectMainBranch } from "../core/git/repository.js";
import { executeGenerateTitleSimple } from "./generate-pr-title.tool.js";
import { executeGeneratePR } from "./generate-pr-description.tool.js";
import { executeSuggestReviewers } from "./suggest-reviewers.tool.js";
import { Language, TemplateType } from "../validation/types.js";

export interface CreatePRResult {
  url: string;
  number: number;
  title: string;
  state: string;
  action: 'created' | 'reopened' | 'updated';
  reviewers?: string[];
  reviewersAdded?: number;
  reviewerNote?: string;
}

/**
 * Tool: create_pr
 * Creates a Pull Request on GitHub.
 *
 * RECOMMENDED WORKFLOW FOR AI ASSISTANTS:
 * 1. Call 'generate_pr_title' tool first to get an AI prompt
 * 2. Analyze the code changes and generate an intelligent title
 * 3. Call this tool with the generated title in the 'title' parameter
 *
 * If no title is provided, it will generate a simple title based on commit messages.
 *
 * Smart handling: If a PR already exists for the branch (open or closed), it will be updated/reopened
 * instead of failing with a duplicate error.
 * Can automatically suggest and add reviewers based on Git history.
 */
export async function executeCreatePR(
  template: TemplateType = "standard",
  language: Language = "fr",
  includeStats: boolean = true,
  maxTitleLength?: number,
  baseBranch?: string,
  draft: boolean = false,
  githubToken?: string,
  addReviewers: boolean = true,
  maxReviewers: number = 3,
  title?: string
): Promise<CreatePRResult> {
  try {
    // Get GitHub token (supports both personal access tokens 'ghp_' and enterprise tokens 'github_pat_')
    const token = githubToken || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        "GitHub token is required. Set GITHUB_TOKEN environment variable or pass it as parameter. " +
        "Supports both personal access tokens (ghp_...) and enterprise tokens (github_pat_...)."
      );
    }

    // Get repository info
    const workingDir = process.cwd();
    const repoInfo = await getGitHubRepoInfo(workingDir);
    
    // Get current branch and base branch
    const workingGit = createGitInstance(workingDir);
    const currentBranch = (await workingGit.revparse(["--abbrev-ref", "HEAD"])).trim();
    const detectedBaseBranch = baseBranch || await detectMainBranch(workingDir);

    // Verify branch exists on remote or push it
    const octokit = new Octokit({ auth: token });
    
    try {
      // Check if branch exists on remote
      await octokit.rest.repos.getBranch({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        branch: currentBranch,
      });
    } catch (error: unknown) {
      // Branch doesn't exist on remote, need to push it
      const errorStatus = error && typeof error === 'object' && 'status' in error ? error.status : null;
      if (errorStatus === 404) {
        throw new Error(
          `Branch "${currentBranch}" does not exist on remote. Please push your branch first:\n` +
          `  git push -u origin ${currentBranch}`
        );
      }
      // Re-throw other errors
      throw error;
    }

    // Generate title if not provided
    const finalTitle = title || await executeGenerateTitleSimple(maxTitleLength, detectedBaseBranch);

    // Generate description
    const description = await executeGeneratePR(
      finalTitle,
      template,
      language,
      includeStats,
      detectedBaseBranch
    );

    // Check if a PR already exists for this branch
    const { data: existingPRs } = await octokit.rest.pulls.list({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      head: `${repoInfo.owner}:${currentBranch}`,
      base: detectedBaseBranch,
      state: 'all', // Include both open and closed PRs
    });

    let pr;
    let action: 'created' | 'reopened' | 'updated';

    if (existingPRs.length > 0) {
      // PR already exists - update it
      const existingPR = existingPRs[0];
      
      if (existingPR.state === 'closed') {
        // Reopen the closed PR
        const { data: reopenedPR } = await octokit.rest.pulls.update({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          pull_number: existingPR.number,
          title: finalTitle,
          body: description,
          state: 'open',
        });
        pr = reopenedPR;
        action = 'reopened';
      } else {
        // Update the existing open PR
        const { data: updatedPR } = await octokit.rest.pulls.update({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          pull_number: existingPR.number,
          title: finalTitle,
          body: description,
        });
        pr = updatedPR;
        action = 'updated';
      }
    } else {
      // No existing PR - create a new one
      const { data: newPR } = await octokit.rest.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title: finalTitle,
        body: description,
        head: currentBranch,
        base: detectedBaseBranch,
        draft,
      });
      pr = newPR;
      action = 'created';
    }

    // Add reviewers if requested
    let reviewersAdded: string[] = [];
    let reviewerError: string | undefined;
    
    if (addReviewers) {
      try {
        const reviewersResult = await executeSuggestReviewers(maxReviewers, detectedBaseBranch);
        
        if (reviewersResult.error) {
          reviewerError = `${reviewersResult.basedOn}: ${reviewersResult.error}`;
          console.warn(`Could not add reviewers: ${reviewerError}`);
        } else if (reviewersResult.suggestedReviewers.length === 0) {
          reviewerError = `${reviewersResult.basedOn}. No reviewers could be suggested.`;
          console.warn(reviewerError);
        } else {
          // Filter out the PR author from reviewers
          const currentUser = (await octokit.rest.users.getAuthenticated()).data.login;
          console.error(`[REVIEWERS] Current GitHub user (PR author): ${currentUser}`);
          
          const allSuggested = reviewersResult.suggestedReviewers.map(r => r.author);
          console.error(`[REVIEWERS] All suggested reviewers: ${allSuggested.join(', ')}`);
          
          const reviewerLogins = allSuggested
            .filter(author => author.toLowerCase() !== currentUser.toLowerCase());
          console.error(`[REVIEWERS] After filtering PR author: ${reviewerLogins.join(', ') || '(none - all filtered out)'}`);
          
          if (reviewerLogins.length === 0) {
            reviewerError = `${reviewersResult.basedOn}. Found contributor(s): ${allSuggested.join(', ')} - but all were filtered out (you are the only/main contributor)`;
            console.warn(`[REVIEWERS] ${reviewerError}`);
          } else {
            try {
              console.error(`[REVIEWERS] Attempting to add ${reviewerLogins.length} reviewer(s): ${reviewerLogins.join(', ')}`);
              console.error(`[REVIEWERS] PR: ${repoInfo.owner}/${repoInfo.repo}#${pr.number}`);
              
              const response = await octokit.rest.pulls.requestReviewers({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                pull_number: pr.number,
                reviewers: reviewerLogins,
              });
              
              // Debug: Log full response
              console.error(`[REVIEWERS] API Response Status: ${response.status}`);
              console.error(`[REVIEWERS] Requested reviewers in response:`, JSON.stringify(response.data.requested_reviewers?.map(r => r.login)));
              
              // Verify reviewers were actually added by checking the response
              const actuallyAdded = response.data.requested_reviewers?.map(r => r.login) || [];
              
              if (actuallyAdded.length === 0) {
                // API call succeeded but no reviewers were added (usernames don't exist)
                const errorDetails = `Response status: ${response.status}, Data: ${JSON.stringify(response.data, null, 2)}`;
                console.error(`[REVIEWERS] No reviewers added. ${errorDetails}`);
                reviewerError = `${reviewersResult.basedOn}. Attempted to add: ${reviewerLogins.join(', ')} - but GitHub couldn't add any of them (API returned 0 reviewers). Possible reasons: (1) These usernames don't exist on GitHub, (2) They are already reviewers, (3) They are the PR author, (4) Insufficient permissions. Try manually adding '${reviewerLogins[0]}' on GitHub to verify the username exists.`;
                console.warn(reviewerError);
              } else if (actuallyAdded.length < reviewerLogins.length) {
                // Some reviewers were added, but not all
                const notAdded = reviewerLogins.filter(r => !actuallyAdded.includes(r));
                reviewersAdded = actuallyAdded;
                reviewerError = `Partially successful: Added ${actuallyAdded.join(', ')} but couldn't add ${notAdded.join(', ')} (likely PR author or already a reviewer)`;
                console.warn(`[REVIEWERS] ${reviewerError}`);
                console.error(`[REVIEWERS] Successfully added ${reviewersAdded.length} reviewer(s): ${reviewersAdded.join(', ')}`);
              } else {
                // All reviewers were added successfully
                reviewersAdded = actuallyAdded;
                console.error(`[REVIEWERS] ✅ Successfully added ${reviewersAdded.length} reviewer(s): ${reviewersAdded.join(', ')}`);
              }
            } catch (githubError: unknown) {
              const errorMsg = githubError instanceof Error ? githubError.message : String(githubError);
              const errorStack = githubError instanceof Error ? githubError.stack : '';
              const suggestedDetails = reviewersResult.suggestedReviewers
                .map(r => `${r.author} (${r.contributions} contributions)`)
                .join(', ');
              reviewerError = `${reviewersResult.basedOn}. Suggested: ${suggestedDetails}. GitHub API error: ${errorMsg}. These usernames may not exist on GitHub or you may lack permission to add them.`;
              console.error(`[REVIEWERS] GitHub API Error:`, errorMsg);
              console.error(`[REVIEWERS] Stack:`, errorStack);
              console.warn(reviewerError);
            }
          }
        }
      } catch (error) {
        // Don't fail the PR creation if reviewer addition fails
        reviewerError = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`Could not add reviewers: ${reviewerError}`);
      }
    }

    return {
      url: pr.html_url,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      action,
      reviewers: reviewersAdded.length > 0 ? reviewersAdded : undefined,
      reviewersAdded: reviewersAdded.length,
      reviewerNote: reviewerError || (reviewersAdded.length > 0 ? undefined : "No reviewers were automatically added"),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error creating PR: ${errorMessage}`);
  }
}

