import { Octokit } from "@octokit/rest";
import { createGitInstance, getGitHubRepoInfo, detectMainBranch } from "../core/git/repository.js";
import { executeGenerateTitle } from "./generate-pr-title.tool.js";
import { executeGeneratePR } from "./generate-pr-description.tool.js";
import { Language, TemplateType } from "../validation/types.js";

export interface CreatePRResult {
  url: string;
  number: number;
  title: string;
  state: string;
  action: 'created' | 'reopened' | 'updated';
}

/**
 * Tool: create_pr
 * Creates a Pull Request on GitHub using generate-pr-title and generate-pr-description.
 * Smart handling: If a PR already exists for the branch (open or closed), it will be updated/reopened
 * instead of failing with a duplicate error.
 */
export async function executeCreatePR(
  template: TemplateType = "standard",
  language: Language = "fr",
  includeStats: boolean = true,
  maxTitleLength?: number,
  baseBranch?: string,
  draft: boolean = false,
  githubToken?: string
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

    // Generate title
    const title = await executeGenerateTitle(maxTitleLength, detectedBaseBranch);

    // Generate description
    const description = await executeGeneratePR(
      title,
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
          title,
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
          title,
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
        title,
        body: description,
        head: currentBranch,
        base: detectedBaseBranch,
        draft,
      });
      pr = newPR;
      action = 'created';
    }

    return {
      url: pr.html_url,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      action,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error creating PR: ${errorMessage}`);
  }
}

