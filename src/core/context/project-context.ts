import { promises as fs } from "fs";
import * as path from "path";

export interface ProjectContext {
  // Language & Framework (universal)
  language?: string; // php, python, go, rust, java, typescript, javascript, ruby, etc.
  framework?: string; // laravel, django, express, fastapi, spring, rails, etc.

  // JavaScript/TypeScript specific (only if detected)
  hasTypeScript?: boolean;
  hasJavaScript?: boolean;
  strictMode?: boolean;

  // PHP specific (only if detected)
  phpVersion?: string;
  hasComposer?: boolean;

  // Python specific (only if detected)
  pythonVersion?: string;
  hasPipenv?: boolean;
  hasPoetry?: boolean;

  // Go specific (only if detected)
  goVersion?: string;
  hasGoMod?: boolean;

  // Rust specific (only if detected)
  rustVersion?: string;
  hasCargo?: boolean;

  // Java specific (only if detected)
  javaVersion?: string;
  hasMaven?: boolean;
  hasGradle?: boolean;

  // Internationalization (universal)
  hasI18n: boolean;
  i18nLibrary?: string;

  // State management (frontend specific)
  stateManagement?: string;

  // Styling (frontend specific)
  stylingApproach?: string;

  // Testing (universal)
  testingFramework?: string; // phpunit, pytest, jest, vitest, go test, cargo test, junit, etc.
  hasTestingLibrary?: boolean;

  // Code Quality (universal)
  linter?: string; // eslint, psalm, pylint, golint, clippy, etc.
  formatter?: string; // prettier, php-cs-fixer, black, gofmt, rustfmt, etc.
  hasLinter: boolean;
  hasFormatter: boolean;

  // Architecture (universal)
  hasADR: boolean;
  hasDocs: boolean;
  hasContributing: boolean;

  // Build & bundler (universal)
  bundler?: string;

  // Package info (universal)
  packageName?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;

  // Monorepo (universal)
  hasMonorepo: boolean;
  monorepoTool?: string;

  // Project structure (universal)
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
  // Detect primary language first
  const language = await detectLanguage(workingDir);

  // Universal checks
  const hasADR = await fileExists(path.join(workingDir, "adr")) ||
                 await fileExists(path.join(workingDir, "docs/adr"));
  const hasDocs = await fileExists(path.join(workingDir, "docs"));
  const hasContributing = await fileExists(path.join(workingDir, "CONTRIBUTING.md"));
  const projectStructure = await getProjectStructure(workingDir);

  // Language-specific detection
  let context: Partial<ProjectContext> = {
    language,
    hasADR,
    hasDocs,
    hasContributing,
    projectStructure,
    dependencies: {},
    devDependencies: {},
    hasI18n: false,
    hasLinter: false,
    hasFormatter: false,
    hasMonorepo: false,
  };

  if (language === 'php') {
    context = { ...context, ...(await detectPHPContext(workingDir)) };
  } else if (language === 'python') {
    context = { ...context, ...(await detectPythonContext(workingDir)) };
  } else if (language === 'go') {
    context = { ...context, ...(await detectGoContext(workingDir)) };
  } else if (language === 'rust') {
    context = { ...context, ...(await detectRustContext(workingDir)) };
  } else if (language === 'java') {
    context = { ...context, ...(await detectJavaContext(workingDir)) };
  } else if (language === 'typescript' || language === 'javascript') {
    context = { ...context, ...(await detectJavaScriptContext(workingDir)) };
  } else if (language === 'ruby') {
    context = { ...context, ...(await detectRubyContext(workingDir)) };
  }

  return context as ProjectContext;
}

async function detectPHPContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const composerPath = path.join(workingDir, "composer.json");
  const composer = await readJsonFile(composerPath);

  const context: Partial<ProjectContext> = {
    hasComposer: true,
    dependencies: (composer?.require as Record<string, string>) || {},
    devDependencies: (composer?.['require-dev'] as Record<string, string>) || {},
  };

  // Detect framework
  if (context.dependencies?.['laravel/framework']) {
    context.framework = 'laravel';
  } else if (context.dependencies?.['symfony/symfony'] || context.dependencies?.['symfony/framework-bundle']) {
    context.framework = 'symfony';
  } else if (context.dependencies?.['cakephp/cakephp']) {
    context.framework = 'cakephp';
  } else if (context.dependencies?.['codeigniter4/framework']) {
    context.framework = 'codeigniter';
  }

  // Detect testing
  if (context.devDependencies?.['phpunit/phpunit']) {
    context.testingFramework = 'phpunit';
  } else if (context.devDependencies?.['pestphp/pest']) {
    context.testingFramework = 'pest';
  }

  // Detect code quality tools
  if (context.devDependencies?.['vimeo/psalm'] || context.devDependencies?.['psalm/plugin-laravel']) {
    context.linter = 'psalm';
    context.hasLinter = true;
  } else if (context.devDependencies?.['phpstan/phpstan']) {
    context.linter = 'phpstan';
    context.hasLinter = true;
  }

  if (context.devDependencies?.['friendsofphp/php-cs-fixer']) {
    context.formatter = 'php-cs-fixer';
    context.hasFormatter = true;
  }

  // Detect package name
  if (composer?.name) {
    context.packageName = composer.name as string;
  }

  return context;
}

async function detectPythonContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const context: Partial<ProjectContext> = {
    dependencies: {},
    devDependencies: {},
  };

  // Check for poetry
  if (await fileExists(path.join(workingDir, "pyproject.toml"))) {
    context.hasPoetry = true;
    const pyproject = await readJsonFile(path.join(workingDir, "pyproject.toml"));
    if (pyproject?.['tool']) {
      const tool = pyproject['tool'] as Record<string, unknown>;
      if (tool?.['poetry']) {
        const poetry = tool['poetry'] as Record<string, unknown>;
        context.packageName = poetry['name'] as string;
      }
    }
  }

  // Check for pipenv
  if (await fileExists(path.join(workingDir, "Pipfile"))) {
    context.hasPipenv = true;
  }

  // Detect framework from requirements or imports
  const requirementsPath = path.join(workingDir, "requirements.txt");
  if (await fileExists(requirementsPath)) {
    const requirements = await fs.readFile(requirementsPath, 'utf-8');
    if (requirements.includes('Django')) {
      context.framework = 'django';
    } else if (requirements.includes('Flask')) {
      context.framework = 'flask';
    } else if (requirements.includes('fastapi')) {
      context.framework = 'fastapi';
    }

    if (requirements.includes('pytest')) {
      context.testingFramework = 'pytest';
    }

    if (requirements.includes('black')) {
      context.formatter = 'black';
      context.hasFormatter = true;
    }

    if (requirements.includes('pylint') || requirements.includes('flake8')) {
      context.linter = requirements.includes('pylint') ? 'pylint' : 'flake8';
      context.hasLinter = true;
    }
  }

  return context;
}

async function detectGoContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const context: Partial<ProjectContext> = {
    hasGoMod: true,
    testingFramework: 'go test', // Built-in
    formatter: 'gofmt', // Built-in
    hasFormatter: true,
    dependencies: {},
    devDependencies: {},
  };

  // Read go.mod for dependencies
  const goModPath = path.join(workingDir, "go.mod");
  if (await fileExists(goModPath)) {
    const goModContent = await fs.readFile(goModPath, 'utf-8');

    // Detect popular frameworks
    if (goModContent.includes('github.com/gin-gonic/gin')) {
      context.framework = 'gin';
    } else if (goModContent.includes('github.com/gofiber/fiber')) {
      context.framework = 'fiber';
    } else if (goModContent.includes('github.com/labstack/echo')) {
      context.framework = 'echo';
    }

    // Check for golangci-lint
    if (goModContent.includes('golangci-lint')) {
      context.linter = 'golangci-lint';
      context.hasLinter = true;
    }
  }

  return context;
}

async function detectRustContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const context: Partial<ProjectContext> = {
    hasCargo: true,
    testingFramework: 'cargo test', // Built-in
    formatter: 'rustfmt', // Built-in
    linter: 'clippy', // Built-in
    hasFormatter: true,
    hasLinter: true,
    dependencies: {},
    devDependencies: {},
  };

  // Read Cargo.toml
  const cargoPath = path.join(workingDir, "Cargo.toml");
  if (await fileExists(cargoPath)) {
    const cargoContent = await fs.readFile(cargoPath, 'utf-8');

    if (cargoContent.includes('actix-web')) {
      context.framework = 'actix-web';
    } else if (cargoContent.includes('rocket')) {
      context.framework = 'rocket';
    } else if (cargoContent.includes('axum')) {
      context.framework = 'axum';
    }
  }

  return context;
}

async function detectJavaContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const context: Partial<ProjectContext> = {
    dependencies: {},
    devDependencies: {},
  };

  // Check Maven
  if (await fileExists(path.join(workingDir, "pom.xml"))) {
    context.hasMaven = true;
    context.testingFramework = 'junit';

    const pomContent = await fs.readFile(path.join(workingDir, "pom.xml"), 'utf-8');
    if (pomContent.includes('spring-boot')) {
      context.framework = 'spring-boot';
    }
  }

  // Check Gradle
  if (await fileExists(path.join(workingDir, "build.gradle")) ||
      await fileExists(path.join(workingDir, "build.gradle.kts"))) {
    context.hasGradle = true;
    context.testingFramework = 'junit';
  }

  return context;
}

async function detectRubyContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const context: Partial<ProjectContext> = {
    dependencies: {},
    devDependencies: {},
  };

  const gemfilePath = path.join(workingDir, "Gemfile");
  if (await fileExists(gemfilePath)) {
    const gemfileContent = await fs.readFile(gemfilePath, 'utf-8');

    if (gemfileContent.includes('rails')) {
      context.framework = 'rails';
      context.testingFramework = 'rspec';
    }

    if (gemfileContent.includes('rubocop')) {
      context.linter = 'rubocop';
      context.hasLinter = true;
    }
  }

  return context;
}

async function detectJavaScriptContext(workingDir: string): Promise<Partial<ProjectContext>> {
  const packageJsonPath = path.join(workingDir, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);

  const tsconfigPath = path.join(workingDir, "tsconfig.json");
  const tsconfig = await readJsonFile(tsconfigPath);

  const hasTypeScript = await fileExists(tsconfigPath);

  const context: Partial<ProjectContext> = {
    hasTypeScript,
    hasJavaScript: packageJson !== null,
    dependencies: (packageJson?.dependencies as Record<string, string>) || {},
    devDependencies: (packageJson?.devDependencies as Record<string, string>) || {},
  };

  // TypeScript strict mode
  if (hasTypeScript && tsconfig?.compilerOptions) {
    context.strictMode = Boolean((tsconfig.compilerOptions as Record<string, unknown>).strict);
  }

  // Detect framework
  if (context.dependencies?.['next']) {
    context.framework = 'next.js';
  } else if (context.dependencies?.['react']) {
    context.framework = 'react';
  } else if (context.dependencies?.['vue']) {
    context.framework = 'vue';
  } else if (context.dependencies?.['@angular/core']) {
    context.framework = 'angular';
  } else if (context.dependencies?.['express']) {
    context.framework = 'express';
  } else if (context.dependencies?.['@nestjs/core']) {
    context.framework = 'nestjs';
  }

  // i18n
  const i18nInfo = await detectI18n(packageJson);
  context.hasI18n = i18nInfo.hasI18n;
  context.i18nLibrary = i18nInfo.library;

  // State management
  context.stateManagement = await detectStateManagement(packageJson);

  // Styling
  context.stylingApproach = await detectStyling(packageJson);

  // Testing
  const testingInfo = await detectTesting(packageJson);
  context.testingFramework = testingInfo.framework;
  context.hasTestingLibrary = testingInfo.hasTestingLibrary;

  // Bundler
  context.bundler = await detectBundler(packageJson);

  // Code quality
  if (context.devDependencies?.['eslint']) {
    context.linter = 'eslint';
    context.hasLinter = true;
  }

  if (context.devDependencies?.['prettier']) {
    context.formatter = 'prettier';
    context.hasFormatter = true;
  }

  // Monorepo
  const monorepoInfo = await detectMonorepo(workingDir, packageJson);
  context.hasMonorepo = monorepoInfo.hasMonorepo;
  context.monorepoTool = monorepoInfo.tool;

  // Package name
  if (packageJson?.name) {
    context.packageName = packageJson.name as string;
  }

  return context;
}

async function detectLanguage(workingDir: string): Promise<string | undefined> {
  // Check for language-specific files in order of specificity

  // Rust
  if (await fileExists(path.join(workingDir, "Cargo.toml"))) {
    return 'rust';
  }

  // Go
  if (await fileExists(path.join(workingDir, "go.mod"))) {
    return 'go';
  }

  // PHP (composer.json is pretty definitive)
  if (await fileExists(path.join(workingDir, "composer.json"))) {
    return 'php';
  }

  // Python (check multiple indicators)
  const hasPythonFile = await fileExists(path.join(workingDir, "requirements.txt")) ||
                        await fileExists(path.join(workingDir, "setup.py")) ||
                        await fileExists(path.join(workingDir, "pyproject.toml")) ||
                        await fileExists(path.join(workingDir, "Pipfile"));
  if (hasPythonFile) {
    return 'python';
  }

  // Ruby
  if (await fileExists(path.join(workingDir, "Gemfile"))) {
    return 'ruby';
  }

  // Java
  if (await fileExists(path.join(workingDir, "pom.xml")) ||
      await fileExists(path.join(workingDir, "build.gradle")) ||
      await fileExists(path.join(workingDir, "build.gradle.kts"))) {
    return 'java';
  }

  // TypeScript vs JavaScript
  if (await fileExists(path.join(workingDir, "tsconfig.json"))) {
    return 'typescript';
  }

  if (await fileExists(path.join(workingDir, "package.json"))) {
    return 'javascript';
  }

  return undefined;
}

export function formatProjectContextForPrompt(context: ProjectContext): string {
  const sections: string[] = [];

  sections.push("# Project Context");
  sections.push("");

  // Project Type (universal)
  sections.push("## Project Type");
  if (context.language) {
    const lang = context.language.charAt(0).toUpperCase() + context.language.slice(1);
    sections.push(`- ${lang} project`);

    // Language-specific details
    if (context.language === 'typescript' && context.strictMode) {
      sections.push("  - TypeScript strict mode enabled");
    }
    if (context.language === 'php' && context.hasComposer) {
      sections.push("  - Uses Composer for dependencies");
    }
    if (context.language === 'python' && (context.hasPoetry || context.hasPipenv)) {
      sections.push(`  - Uses ${context.hasPoetry ? 'Poetry' : 'Pipenv'}`);
    }
    if (context.language === 'go' && context.hasGoMod) {
      sections.push("  - Uses Go modules");
    }
    if (context.language === 'rust' && context.hasCargo) {
      sections.push("  - Uses Cargo");
    }
    if (context.language === 'java' && (context.hasMaven || context.hasGradle)) {
      sections.push(`  - Uses ${context.hasMaven ? 'Maven' : 'Gradle'}`);
    }
  }

  if (context.framework) {
    sections.push(`- Framework: ${context.framework}`);
  }

  if (context.hasMonorepo) {
    sections.push(`- Monorepo structure (${context.monorepoTool || 'detected'})`);
  }
  sections.push("");

  // Testing (universal)
  if (context.testingFramework) {
    sections.push("## Testing");
    sections.push(`- Framework: ${context.testingFramework}`);
    if (context.hasTestingLibrary) {
      sections.push("- Uses Testing Library (for UI components)");
    }
    sections.push("");
  }

  // Code Quality (universal)
  if (context.hasLinter || context.hasFormatter) {
    sections.push("## Code Quality");
    if (context.linter) {
      sections.push(`- Linter: ${context.linter}`);
    }
    if (context.formatter) {
      sections.push(`- Formatter: ${context.formatter}`);
    }
    sections.push("");
  }

  // Frontend-specific technologies
  if (context.stateManagement || context.stylingApproach || context.bundler) {
    sections.push("## Frontend Technologies");
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
  }

  // i18n (universal)
  if (context.hasI18n) {
    sections.push("## Internationalization");
    sections.push(`- i18n enabled: ${context.i18nLibrary || "yes"}`);
    sections.push("");
  }

  // Documentation (universal)
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
