import { simpleGit, SimpleGit } from "simple-git";

/**
 * Singleton Git repository instance
 */
export const git: SimpleGit = simpleGit({
  baseDir: process.cwd(),
  binary: "git",
  maxConcurrentProcesses: 6,
});
