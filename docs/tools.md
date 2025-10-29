# Tools Reference

Complete reference for all available MCP tools in `pr-mcp-server`.

## 📋 Table of Contents

- [analyze_branch](#analyze_branch)
- [generate_pr_title](#generate_pr_title)
- [generate_pr_description](#generate_pr_description)
- [generate_pr_complete](#generate_pr_complete)
- [suggest_reviewers](#suggest_reviewers)
- [review](#review)
- [create_pr](#create_pr)

---

## analyze_branch

Analyze differences between the current branch and a base branch.

### Input

```json
{
  "baseBranch": "main",   // string, default: "main"
  "detailed": true         // boolean, default: true
}
```

### Output

Returns `AnalysisResult`:

```typescript
{
  currentBranch: string;
  baseBranch: string;
  totalCommits: number;
  commits: Array<{
    hash: string;
    message: string;
    author: string;
    date: string;
  }>;
  filesChanged: number;
  insertions: number;
  deletions: number;
  filesList: string[];
  commitTypes: string[];
  diffStats: string;
  hasBreakingChanges?: boolean;
  hasTests?: boolean;
}
```

### Example

```json
{
  "baseBranch": "dev",
  "detailed": true
}
```

---

## generate_pr_title

Generate a conventional PR title based on recent commits and changed files.

### Input

```json
{
  "maxLength": 72   // optional, number, caps title length (e.g., 72)
}
```

### Output

A string like `feat(auth): add refresh token rotation`.

### Example

```json
{
  "maxLength": 60
}
```

**Output:**
```
feat(api): add OAuth support
```

---

## generate_pr_description

Generate a PR description from the analysis.

### Input

```json
{
  "title": "My awesome PR",         // string | optional
  "template": "standard",           // "standard" | "detailed" | "minimal" (default: "standard")
  "language": "fr",                 // "fr" | "en" (default: "fr")
  "includeStats": true               // boolean (default: true)
}
```

### Output

String (markdown ready to paste into your PR).

### Templates

- **standard**: Balanced description with context, changes, and testing info
- **detailed**: Comprehensive description with all sections
- **minimal**: Brief description with essential information only

### Example

```json
{
  "title": "Add OAuth support",
  "template": "detailed",
  "language": "en",
  "includeStats": true
}
```

---

## generate_pr_complete

Generate both a conventional PR title and a complete PR description in one operation.

### Input

```json
{
  "template": "standard",           // "standard" | "detailed" | "minimal" (default: "standard")
  "language": "fr",                 // "fr" | "en" (default: "fr")
  "includeStats": true,             // boolean (default: true)
  "maxTitleLength": 72,             // number | optional, caps title length
  "baseBranch": "main"              // string | optional, base branch for comparison
}
```

### Output

```typescript
{
  title: string;
  description: string;
}
```

Both title and description ready to use.

### Example

```json
{
  "template": "standard",
  "language": "fr",
  "baseBranch": "dev"
}
```

**Output:**
```json
{
  "title": "feat(auth): add OAuth support",
  "description": "![GIF](https://media.giphy.com/...\n\n## 🎯 feat(auth): add OAuth support\n\n..."
}
```

---

## suggest_reviewers

Suggest reviewers based on contribution history on modified files.

### Input

```json
{
  "limit": 3,              // number, 1..20 (default: 3)
  "baseBranch": "main"     // string | optional (default: "main")
}
```

### Output

```typescript
{
  suggestedReviewers: Array<{
    author: string;
    contributions: number;
    reason: string;
  }>;
  basedOn: string;
  error?: string;
}
```

### Example

```json
{
  "limit": 5
}
```

**Output:**
```json
{
  "suggestedReviewers": [
    {
      "author": "john-doe",
      "contributions": 15,
      "reason": "Most active contributor to modified files"
    },
    {
      "author": "jane-smith",
      "contributions": 8,
      "reason": "Regular contributor to these areas"
    }
  ],
  "basedOn": "Analyzed 10 commit(s) from 5 file(s)"
}
```

See [Smart Reviewers](reviewers.md) for detailed documentation.

---

## review

Produce a concise, structured PR code review (markdown, 10–15 lines).

### Input

```json
{}
```

### Output

Raw markdown using exactly this structure (copy/paste-ready):

```markdown
## Summary
[one-line summary]

## Critical Issues  
- [issue with `code` references]

## Key Suggestions
- [suggestion 1]
- [suggestion 2]

## Decision
REQUEST_CHANGES - [brief reason]
```

### Example

**Output:**
```markdown
## Summary
Adds OAuth authentication with refresh token rotation

## Critical Issues  
- Missing error handling in `refreshToken()` function
- Credentials stored in plain text in `config.ts`

## Key Suggestions
- Add rate limiting to prevent token abuse
- Implement token expiration validation

## Decision
REQUEST_CHANGES - Critical security issues must be addressed
```

---

## create_pr

Creates a Pull Request on GitHub using auto-generated title and description. Includes smart PR handling and automatic reviewer assignment.

### Input

```json
{
  "template": "standard",           // "standard" | "detailed" | "minimal" (default: "standard")
  "language": "fr",                 // "fr" | "en" (default: "fr")
  "includeStats": true,             // boolean (default: true)
  "maxTitleLength": 72,             // number | optional, caps title length
  "baseBranch": "main",             // string | optional, base branch for comparison
  "draft": false,                   // boolean (default: false) - create PR as draft
  "githubToken": "ghp_...",         // string | optional, defaults to GITHUB_TOKEN env var
  "addReviewers": true,             // boolean (default: true) - automatically add reviewers
  "maxReviewers": 3                 // number (default: 3) - max reviewers to add (1-20)
}
```

### Output

```typescript
{
  url: string;
  number: number;
  title: string;
  state: string;
  action: 'created' | 'reopened' | 'updated';
  reviewers?: string[];
  reviewersAdded?: number;
  reviewerNote?: string;
}
```

### Prerequisites

- Set `GITHUB_TOKEN` environment variable (or pass `githubToken` parameter)
  - Supports **Personal Access Tokens** (`ghp_...`)
  - Supports **Enterprise Tokens** (`github_pat_...`)
- Your branch must be pushed to the remote repository
- Repository must have a remote named `origin` pointing to GitHub

### Behavior

- ✅ **No existing PR:** Creates a new PR
- ✅ **Closed PR exists:** Reopens the PR and updates its title/description
- ✅ **Open PR exists:** Updates the existing PR's title/description
- ✅ **Auto-reviewers:** Suggests and adds reviewers based on who contributed to modified files

### Example

```json
{
  "template": "standard",
  "language": "fr",
  "draft": false,
  "addReviewers": true,
  "maxReviewers": 3
}
```

**Output (success with reviewers):**
```json
{
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "title": "feat(auth): add OAuth support",
  "state": "open",
  "action": "created",
  "reviewers": ["john-doe", "jane-smith"],
  "reviewersAdded": 2
}
```

**Output (no reviewers found):**
```json
{
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "title": "feat(auth): add OAuth support",
  "state": "open",
  "action": "created",
  "reviewersAdded": 0,
  "reviewerNote": "Analyzed 3 file(s), but found no Git history (likely new files)"
}
```

See [GitHub Integration](github-integration.md) for detailed documentation and troubleshooting.

---

[← Back to README](../README.md)

