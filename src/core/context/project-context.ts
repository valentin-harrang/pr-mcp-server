import { promises as fs } from "fs";
import * as path from "path";

export interface ProjectContext {
  // Project type & setup
  hasTypeScript: boolean;
  hasJavaScript: boolean;
  strictMode?: boolean;

  // Internationalization
  hasI18n: boolean;
  i18nLibrary?: string;

  // State management
  stateManagement?: string; // redux, zustand, context, mobx, etc.

  // Styling
  stylingApproach?: string; // css-modules, tailwind, styled-components, emotion, scss, etc.

  // Testing
  testingFramework?: string; // jest, vitest, mocha, etc.
  hasTestingLibrary: boolean;

  // Linting & Formatting
  hasESLint: boolean;
  hasPrettier: boolean;
  eslintRules?: Record<string, unknown>;

  // Architecture
  hasADR: boolean;
  hasDocs: boolean;
  hasContributing: boolean;

  // Component patterns
  componentStructure?: string; // atomic, feature-based, etc.

  // Build & bundler
  bundler?: string; // vite, webpack, rollup, etc.

  // Package info
  packageName?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;

  // Conventions
  namingConvention?: string;
  hasMonorepo: boolean;
  monorepoTool?: string; // turborepo, nx, lerna, etc.

  // Project structure
  projectStructure: string[];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function detectI18n(
  packageJson: Record<string, unknown> | null
): Promise<{ hasI18n: boolean; library?: string }> {
  if (!packageJson) return { hasI18n: false };

  const allDeps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const i18nLibs = [
    "react-i18next",
    "i18next",
    "vue-i18n",
    "next-i18next",
    "react-intl",
    "formatjs",
    "lingui",
    "@lingui/core",
  ];

  for (const lib of i18nLibs) {
    if (allDeps[lib]) {
      return { hasI18n: true, library: lib };
    }
  }

  return { hasI18n: false };
}

async function detectStateManagement(
  packageJson: Record<string, unknown> | null
): Promise<string | undefined> {
  if (!packageJson) return undefined;

  const allDeps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const stateLibs: Record<string, string> = {
    redux: "redux",
    "@reduxjs/toolkit": "redux-toolkit",
    zustand: "zustand",
    mobx: "mobx",
    "mobx-react": "mobx",
    recoil: "recoil",
    jotai: "jotai",
    valtio: "valtio",
    xstate: "xstate",
    "@xstate/react": "xstate",
  };

  for (const [dep, name] of Object.entries(stateLibs)) {
    if (allDeps[dep]) {
      return name;
    }
  }

  return undefined;
}

async function detectStyling(
  packageJson: Record<string, unknown> | null
): Promise<string | undefined> {
  if (!packageJson) return undefined;

  const allDeps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const stylingLibs: Record<string, string> = {
    tailwindcss: "tailwind",
    "styled-components": "styled-components",
    "@emotion/react": "emotion",
    "@emotion/styled": "emotion",
    sass: "scss",
    "node-sass": "scss",
    less: "less",
    "css-modules": "css-modules",
  };

  for (const [dep, name] of Object.entries(stylingLibs)) {
    if (allDeps[dep]) {
      return name;
    }
  }

  return undefined;
}

async function detectTesting(
  packageJson: Record<string, unknown> | null
): Promise<{ framework?: string; hasTestingLibrary: boolean }> {
  if (!packageJson) return { hasTestingLibrary: false };

  const allDeps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const testFrameworks: Record<string, string> = {
    vitest: "vitest",
    jest: "jest",
    "@jest/core": "jest",
    mocha: "mocha",
    jasmine: "jasmine",
    ava: "ava",
  };

  let framework: string | undefined;
  for (const [dep, name] of Object.entries(testFrameworks)) {
    if (allDeps[dep]) {
      framework = name;
      break;
    }
  }

  const hasTestingLibrary =
    "@testing-library/react" in allDeps ||
    "@testing-library/vue" in allDeps ||
    "@testing-library/dom" in allDeps;

  return { framework, hasTestingLibrary };
}

async function detectBundler(
  packageJson: Record<string, unknown> | null
): Promise<string | undefined> {
  if (!packageJson) return undefined;

  const allDeps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };

  const bundlers: Record<string, string> = {
    vite: "vite",
    webpack: "webpack",
    rollup: "rollup",
    parcel: "parcel",
    esbuild: "esbuild",
    "next": "next.js",
    "@remix-run/dev": "remix",
  };

  for (const [dep, name] of Object.entries(bundlers)) {
    if (allDeps[dep]) {
      return name;
    }
  }

  return undefined;
}

async function detectMonorepo(
  workingDir: string,
  packageJson: Record<string, unknown> | null
): Promise<{ hasMonorepo: boolean; tool?: string }> {
  // Check for monorepo tools
  if (packageJson) {
    const allDeps = {
      ...(packageJson.dependencies as Record<string, string> || {}),
      ...(packageJson.devDependencies as Record<string, string> || {}),
    };

    if (allDeps.turborepo || allDeps.turbo) {
      return { hasMonorepo: true, tool: "turborepo" };
    }
    if (allDeps["@nrwl/workspace"] || allDeps.nx) {
      return { hasMonorepo: true, tool: "nx" };
    }
    if (allDeps.lerna) {
      return { hasMonorepo: true, tool: "lerna" };
    }

    // Check for workspaces in package.json
    if (packageJson.workspaces) {
      return { hasMonorepo: true, tool: "npm/yarn workspaces" };
    }
  }

  // Check for pnpm-workspace.yaml
  if (await fileExists(path.join(workingDir, "pnpm-workspace.yaml"))) {
    return { hasMonorepo: true, tool: "pnpm workspaces" };
  }

  // Check for lerna.json
  if (await fileExists(path.join(workingDir, "lerna.json"))) {
    return { hasMonorepo: true, tool: "lerna" };
  }

  // Check for common monorepo directory structures
  const monorepoMarkers = ["packages", "apps", "libs", "modules"];
  for (const marker of monorepoMarkers) {
    try {
      const stats = await fs.stat(path.join(workingDir, marker));
      if (stats.isDirectory()) {
        const entries = await fs.readdir(path.join(workingDir, marker));
        // If has multiple subdirectories, likely a monorepo
        if (entries.length > 1) {
          return { hasMonorepo: true, tool: "unknown" };
        }
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  return { hasMonorepo: false };
}

async function getProjectStructure(workingDir: string): Promise<string[]> {
  const structure: string[] = [];

  try {
    const entries = await fs.readdir(workingDir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip node_modules, .git, and hidden directories
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name.startsWith(".")
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        structure.push(`${entry.name}/`);

        // Get one level deeper for important directories
        try {
          const subEntries = await fs.readdir(
            path.join(workingDir, entry.name),
            { withFileTypes: true }
          );
          const subDirs = subEntries
            .filter(e => e.isDirectory() && !e.name.startsWith("."))
            .slice(0, 5) // Limit to first 5
            .map(e => `  ${entry.name}/${e.name}/`);
          structure.push(...subDirs);
        } catch {
          // Can't read subdirectory, skip
        }
      } else {
        structure.push(entry.name);
      }
    }
  } catch (error) {
    console.warn("Could not read project structure:", error);
  }

  return structure.slice(0, 50); // Limit total entries
}

export async function gatherProjectContext(
  workingDir: string = process.cwd()
): Promise<ProjectContext> {
  // Read package.json
  const packageJsonPath = path.join(workingDir, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);

  // Read tsconfig.json
  const tsconfigPath = path.join(workingDir, "tsconfig.json");
  const tsconfig = await readJsonFile(tsconfigPath);

  // Read .eslintrc or eslint.config.js
  const eslintPaths = [
    ".eslintrc.json",
    ".eslintrc.js",
    ".eslintrc.cjs",
    "eslint.config.js",
  ];
  let eslintConfig: Record<string, unknown> | null = null;
  for (const eslintFile of eslintPaths) {
    eslintConfig = await readJsonFile(path.join(workingDir, eslintFile));
    if (eslintConfig) break;
  }

  // Check file existence
  const hasTypeScript = await fileExists(tsconfigPath);
  const hasESLint = eslintConfig !== null || await fileExists(path.join(workingDir, ".eslintrc"));
  const hasPrettier = await fileExists(path.join(workingDir, ".prettierrc")) ||
                       await fileExists(path.join(workingDir, ".prettierrc.json")) ||
                       await fileExists(path.join(workingDir, ".prettierrc.js"));
  const hasADR = await fileExists(path.join(workingDir, "adr")) ||
                 await fileExists(path.join(workingDir, "docs/adr"));
  const hasDocs = await fileExists(path.join(workingDir, "docs"));
  const hasContributing = await fileExists(path.join(workingDir, "CONTRIBUTING.md"));

  // Detect various aspects
  const i18nInfo = await detectI18n(packageJson);
  const stateManagement = await detectStateManagement(packageJson);
  const stylingApproach = await detectStyling(packageJson);
  const testingInfo = await detectTesting(packageJson);
  const bundler = await detectBundler(packageJson);
  const monorepoInfo = await detectMonorepo(workingDir, packageJson);
  const projectStructure = await getProjectStructure(workingDir);

  // TypeScript strict mode
  const strictMode = tsconfig?.compilerOptions &&
                     typeof tsconfig.compilerOptions === 'object' &&
                     'strict' in tsconfig.compilerOptions
    ? Boolean((tsconfig.compilerOptions as Record<string, unknown>).strict)
    : undefined;

  return {
    hasTypeScript,
    hasJavaScript: packageJson !== null,
    strictMode,
    hasI18n: i18nInfo.hasI18n,
    i18nLibrary: i18nInfo.library,
    stateManagement,
    stylingApproach,
    testingFramework: testingInfo.framework,
    hasTestingLibrary: testingInfo.hasTestingLibrary,
    hasESLint,
    hasPrettier,
    eslintRules: eslintConfig?.rules as Record<string, unknown> | undefined,
    hasADR,
    hasDocs,
    hasContributing,
    bundler,
    hasMonorepo: monorepoInfo.hasMonorepo,
    monorepoTool: monorepoInfo.tool,
    packageName: packageJson?.name as string | undefined,
    dependencies: (packageJson?.dependencies as Record<string, string>) || {},
    devDependencies: (packageJson?.devDependencies as Record<string, string>) || {},
    projectStructure,
  };
}

export function formatProjectContextForPrompt(context: ProjectContext): string {
  const sections: string[] = [];

  sections.push("# Project Context");
  sections.push("");

  // Project Type
  sections.push("## Project Type");
  if (context.hasTypeScript) {
    sections.push(`- TypeScript project${context.strictMode ? " (strict mode enabled)" : ""}`);
  } else if (context.hasJavaScript) {
    sections.push("- JavaScript project");
  }
  if (context.hasMonorepo) {
    sections.push(`- Monorepo structure (${context.monorepoTool})`);
  }
  sections.push("");

  // Technologies
  sections.push("## Key Technologies");
  if (context.hasI18n) {
    sections.push(`- Internationalization: ${context.i18nLibrary || "enabled"}`);
  }
  if (context.stateManagement) {
    sections.push(`- State Management: ${context.stateManagement}`);
  }
  if (context.stylingApproach) {
    sections.push(`- Styling: ${context.stylingApproach}`);
  }
  if (context.bundler) {
    sections.push(`- Bundler: ${context.bundler}`);
  }
  sections.push("");

  // Testing
  if (context.testingFramework || context.hasTestingLibrary) {
    sections.push("## Testing");
    if (context.testingFramework) {
      sections.push(`- Framework: ${context.testingFramework}`);
    }
    if (context.hasTestingLibrary) {
      sections.push("- Uses Testing Library");
    }
    sections.push("");
  }

  // Code Quality
  sections.push("## Code Quality");
  if (context.hasESLint) {
    sections.push("- ESLint enabled");
  }
  if (context.hasPrettier) {
    sections.push("- Prettier enabled");
  }
  sections.push("");

  // Documentation
  if (context.hasADR || context.hasDocs || context.hasContributing) {
    sections.push("## Documentation");
    if (context.hasADR) {
      sections.push("- Architecture Decision Records (ADR) present");
    }
    if (context.hasDocs) {
      sections.push("- Documentation directory present");
    }
    if (context.hasContributing) {
      sections.push("- CONTRIBUTING.md present");
    }
    sections.push("");
  }

  // Project Structure (abbreviated)
  if (context.projectStructure.length > 0) {
    sections.push("## Project Structure (overview)");
    sections.push("```");
    sections.push(...context.projectStructure.slice(0, 20));
    if (context.projectStructure.length > 20) {
      sections.push("... (more files/directories)");
    }
    sections.push("```");
    sections.push("");
  }

  return sections.join("\n");
}
