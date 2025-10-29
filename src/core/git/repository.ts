import { simpleGit, SimpleGit } from "simple-git";
import { existsSync } from "fs";
import { join } from "path";

function findGitRoot(startDir: string = process.cwd()): string {
  let currentDir = startDir;
  
  while (currentDir !== "/" && currentDir !== "") {
    if (existsSync(join(currentDir, ".git"))) {
      return currentDir;
    }
    currentDir = join(currentDir, "..");
  }
  
  return process.cwd();
}

export async function detectMainBranch(workingDir?: string): Promise<string> {
  try {
    if (process.env.MAIN_BRANCH) {
      return process.env.MAIN_BRANCH;
    }
    
    const targetDir = workingDir || process.cwd();
    const targetGit = createGitInstance(targetDir);
    
    try {
      const originHead = await targetGit.raw(['symbolic-ref', 'refs/remotes/origin/HEAD']);
      const defaultBranch = originHead.trim().replace('refs/remotes/origin/', '');
      return defaultBranch;
    } catch (error) {
      // Continue to fallback logic
    }

    const localBranches = await targetGit.branchLocal();
    const commonBranches = ['dev', 'main', 'master'];
    
    for (const branch of commonBranches) {
      if (localBranches.all.some(b => b.includes(branch))) {
        return branch;
      }
    }
    
    const remoteBranches = await targetGit.branch(['-r']);
    
    for (const branch of commonBranches) {
      if (remoteBranches.all.some(b => b.includes(`origin/${branch}`))) {
        return branch;
      }
    }
    
    return 'dev';
  } catch (error) {
    return 'dev';
  }
}

const gitRoot = findGitRoot();

export const git: SimpleGit = simpleGit({
  baseDir: gitRoot,
  binary: "git",
  maxConcurrentProcesses: 6,
});

export function createGitInstance(workingDir: string): SimpleGit {
  return simpleGit({
    baseDir: workingDir,
    binary: "git",
    maxConcurrentProcesses: 6,
  });
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
}

/**
 * Extracts GitHub owner and repository name from git remote URL
 */
export async function getGitHubRepoInfo(workingDir?: string): Promise<GitHubRepoInfo> {
  try {
    const targetDir = workingDir || process.cwd();
    const targetGit = createGitInstance(targetDir);
    
    const remoteUrl = await targetGit.remote(["get-url", "origin"]);
    if (!remoteUrl) {
      throw new Error("No remote URL found for 'origin'");
    }
    const url = remoteUrl.trim();
    
    // Match patterns like:
    // - git@github.com:owner/repo.git
    // - https://github.com/owner/repo.git
    // - https://github.com/owner/repo
    const sshMatch = url.match(/git@github\.com:(.+)\/(.+)\.git$/);
    if (sshMatch) {
      return {
        owner: sshMatch[1],
        repo: sshMatch[2].replace(/\.git$/, ""),
      };
    }
    
    const httpsMatch = url.match(/https?:\/\/github\.com\/(.+)\/(.+?)(?:\.git)?$/);
    if (httpsMatch) {
      return {
        owner: httpsMatch[1],
        repo: httpsMatch[2].replace(/\.git$/, ""),
      };
    }
    
    throw new Error(`Unable to parse GitHub repository from remote URL: ${url}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error getting GitHub repo info: ${errorMessage}`);
  }
}
