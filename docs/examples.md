# Examples

Real-world usage examples for `pr-mcp-server`.

## 📋 Table of Contents

- [Basic Workflow](#basic-workflow)
- [Analyze Branch](#analyze-branch)
- [Generate PR Title](#generate-pr-title)
- [Generate PR Description](#generate-pr-description)
- [Complete PR Generation](#complete-pr-generation)
- [Suggest Reviewers](#suggest-reviewers)
- [Create PR on GitHub](#create-pr-on-github)
- [Code Review](#code-review)
- [Advanced Scenarios](#advanced-scenarios)

## Basic Workflow

### Typical development flow:

```bash
# 1. Create feature branch
git checkout -b feat/add-oauth

# 2. Make changes
git add .
git commit -m "feat(auth): add OAuth support"
git commit -m "feat(auth): add refresh tokens"

# 3. Push branch
git push -u origin feat/add-oauth

# 4. Use pr-mcp-server to create PR
# (via Cursor, Claude Desktop, or MCP Inspector)
```

## Analyze Branch

### Example 1: Basic analysis

**Input:**
```json
{
  "baseBranch": "main",
  "detailed": true
}
```

**Output:**
```json
{
  "currentBranch": "feat/add-oauth",
  "baseBranch": "main",
  "totalCommits": 2,
  "commits": [
    {
      "hash": "a1b2c3d",
      "message": "feat(auth): add OAuth support",
      "author": "John Doe",
      "date": "2024-01-15"
    },
    {
      "hash": "e4f5g6h",
      "message": "feat(auth): add refresh tokens",
      "author": "John Doe",
      "date": "2024-01-15"
    }
  ],
  "filesChanged": 5,
  "insertions": 150,
  "deletions": 20,
  "filesList": [
    "src/auth/oauth.ts",
    "src/auth/tokens.ts",
    "src/auth/types.ts",
    "tests/auth.test.ts",
    "docs/oauth.md"
  ],
  "commitTypes": ["feature"],
  "hasBreakingChanges": false,
  "hasTests": true
}
```

### Example 2: Analyzing against dev branch

**Input:**
```json
{
  "baseBranch": "dev",
  "detailed": false
}
```

**Use case:** When your base branch is `dev` instead of `main`.

## Generate PR Title

### Example 1: Simple feature

**Branch:** `feat/add-login-page`

**Commits:**
- `feat(ui): add login form`
- `feat(ui): add validation`

**Output:**
```
feat(ui): add login page
```

### Example 2: Bug fix

**Branch:** `fix/api-null-handling`

**Commits:**
- `fix(api): handle null responses`
- `fix(api): add validation`

**Output:**
```
fix(api): handle null responses and validation
```

### Example 3: With length limit

**Input:**
```json
{
  "maxLength": 50
}
```

**Output:**
```
feat(auth): add OAuth support
```

(Truncated if needed to fit 50 characters)

### Example 4: Monorepo

**Modified files:**
- `packages/api/src/auth.ts`
- `packages/api/src/tokens.ts`

**Output:**
```
feat(api): add OAuth support
```

Scope is `api` (child directory) not `packages` (parent).

## Generate PR Description

### Example 1: Standard template in French

**Input:**
```json
{
  "title": "Add OAuth support",
  "template": "standard",
  "language": "fr",
  "includeStats": true
}
```

**Output:**
```markdown
![GIF](https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif)

## 🎯 Add OAuth support

### 📋 Description

This PR implements:
- Add OAuth authentication flow
- Add refresh token rotation
- Add token validation middleware

### 🔍 Testing

- ✅ Unit tests added
- ✅ Integration tests updated
- Manual testing completed

### 📊 Stats
- **Files changed**: 5
- **Insertions**: +150
- **Deletions**: -20
```

### Example 2: Detailed template in English

**Input:**
```json
{
  "title": "Fix API null handling",
  "template": "detailed",
  "language": "en"
}
```

**Output:**
```markdown
![GIF](https://media.giphy.com/media/3o7abldj0b3rxrZUxW/giphy.gif)

## 🐛 Fix API null handling

### 📋 Description

This PR implements:
- Handle null responses in API client
- Add validation for required fields
- Add error handling for edge cases

### 🎯 Changes

**Modified files:**
- `src/api/client.ts` - Add null checks
- `src/api/types.ts` - Update type definitions
- `tests/api.test.ts` - Add test cases

### 🔍 Testing

- ✅ Unit tests added
- ✅ Edge cases covered
- Manual testing completed

### 📊 Impact

- **Breaking changes**: No
- **Performance impact**: None
- **Dependencies**: No changes

### 📊 Stats
- **Commits**: 3
- **Files changed**: 3
- **Insertions**: +45
- **Deletions**: -8
```

### Example 3: Minimal template

**Input:**
```json
{
  "title": "Update docs",
  "template": "minimal",
  "language": "en",
  "includeStats": false
}
```

**Output:**
```markdown
![GIF](https://media.giphy.com/media/xT5LMQ8rHYTDGFG07e/giphy.gif)

## 📝 Update docs

This PR implements:
- Update OAuth documentation
- Add setup instructions
- Add examples
```

## Complete PR Generation

### Example 1: Feature PR

**Input:**
```json
{
  "template": "standard",
  "language": "fr",
  "baseBranch": "main"
}
```

**Output:**
```json
{
  "title": "feat(auth): add OAuth support",
  "description": "![GIF](...)\n\n## 🎯 feat(auth): add OAuth support\n\n..."
}
```

### Example 2: Bug fix with English description

**Input:**
```json
{
  "template": "detailed",
  "language": "en",
  "maxTitleLength": 60
}
```

**Output:**
```json
{
  "title": "fix(api): handle null responses",
  "description": "![GIF](...)\n\n## 🐛 fix(api): handle null responses\n\n..."
}
```

## Suggest Reviewers

### Example 1: Top 3 contributors

**Input:**
```json
{
  "limit": 3
}
```

**Modified files:**
- `src/auth/oauth.ts`
- `src/auth/tokens.ts`

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
    },
    {
      "author": "bob-wilson",
      "contributions": 3,
      "reason": "Contributed to auth module"
    }
  ],
  "basedOn": "Analyzed 25 commit(s) from 2 file(s)"
}
```

### Example 2: No reviewers found (new files)

**Input:**
```json
{
  "limit": 5
}
```

**Modified files:** All new files

**Output:**
```json
{
  "suggestedReviewers": [],
  "basedOn": "Analyzed 2 file(s), but found no Git history (likely new files)",
  "error": "No commit history found for modified files"
}
```

### Example 3: Solo contributor

**Input:**
```json
{
  "limit": 3
}
```

**Modified files:** Only you worked on them

**Output:**
```json
{
  "suggestedReviewers": [],
  "basedOn": "Analyzed 5 commit(s) from 2 file(s), but no valid contributors found",
  "error": "No valid contributors extracted from Git history (you may be the only contributor)"
}
```

## Create PR on GitHub

### Example 1: Basic PR creation

**Input:**
```json
{
  "template": "standard",
  "language": "fr",
  "draft": false
}
```

**Output:**
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

### Example 2: Draft PR without reviewers

**Input:**
```json
{
  "template": "minimal",
  "language": "en",
  "draft": true,
  "addReviewers": false
}
```

**Output:**
```json
{
  "url": "https://github.com/owner/repo/pull/124",
  "number": 124,
  "title": "fix(api): handle null responses",
  "state": "open",
  "action": "created",
  "reviewersAdded": 0
}
```

### Example 3: Reopen closed PR

**Scenario:** PR #125 was closed, now reopening with updates

**Input:**
```json
{
  "template": "standard",
  "language": "fr"
}
```

**Output:**
```json
{
  "url": "https://github.com/owner/repo/pull/125",
  "number": 125,
  "title": "feat(ui): add dark mode",
  "state": "open",
  "action": "reopened",
  "reviewers": ["alice-dev"],
  "reviewersAdded": 1
}
```

### Example 4: Update existing PR

**Scenario:** PR #126 exists and is open, updating with new commits

**Input:**
```json
{
  "template": "detailed",
  "language": "en"
}
```

**Output:**
```json
{
  "url": "https://github.com/owner/repo/pull/126",
  "number": 126,
  "title": "refactor(api): improve error handling",
  "state": "open",
  "action": "updated",
  "reviewers": ["bob-wilson"],
  "reviewersAdded": 1,
  "reviewerNote": "Partially successful: Added bob-wilson but couldn't add alice-dev (already a reviewer)"
}
```

### Example 5: Custom reviewer limit

**Input:**
```json
{
  "template": "standard",
  "language": "fr",
  "addReviewers": true,
  "maxReviewers": 5
}
```

Adds up to 5 reviewers instead of default 3.

## Code Review

### Example 1: Feature review

**Branch:** `feat/add-oauth`

**Output:**
```markdown
## Summary
Adds OAuth authentication with refresh token support

## Critical Issues  
- Missing rate limiting on token endpoint
- Credentials stored in plain text in config file

## Key Suggestions
- Add token expiration validation
- Implement secure credential storage
- Add integration tests for OAuth flow

## Decision
REQUEST_CHANGES - Critical security issues must be addressed before merge
```

### Example 2: Bug fix review

**Branch:** `fix/api-null-handling`

**Output:**
```markdown
## Summary
Fixes null pointer exceptions in API client

## Critical Issues  
None

## Key Suggestions
- Consider adding defensive checks in other API methods
- Document the null handling behavior in type definitions

## Decision
APPROVE - Good fix with comprehensive tests
```

## Advanced Scenarios

### Scenario 1: Monorepo with multiple packages

**Modified files:**
```
packages/api/src/auth.ts
packages/api/src/tokens.ts
packages/frontend/src/login.tsx
```

**Title:**
```
feat: add OAuth across api and frontend
```

(No single scope when multiple packages are modified)

### Scenario 2: Breaking change

**Commit:**
```
feat(api)!: change authentication endpoint

BREAKING CHANGE: /auth/login endpoint moved to /api/v2/auth/login
```

**Title:**
```
feat(api)!: change authentication endpoint
```

**Description includes:**
- 💥 Breaking change warning
- Migration guide
- Breaking change GIF

### Scenario 3: Multiple commit types

**Commits:**
- `feat(auth): add OAuth`
- `fix(api): handle null`
- `docs(readme): update`

**Title:**
```
feat(auth): add OAuth support
```

(First commit type wins: `feat`)

### Scenario 4: Enterprise GitHub

**Setup:**
```bash
export GITHUB_TOKEN=github_pat_your_enterprise_token
```

**Same workflow**, but uses enterprise token format.

### Scenario 5: Complex reviewer scenario

**Modified files:**
- `src/auth/oauth.ts` (15 commits by alice, 10 by bob, 5 by you)
- `src/auth/tokens.ts` (8 commits by alice, 3 by charlie, 1 by you)

**Input:**
```json
{
  "maxReviewers": 3
}
```

**Output:**
```json
{
  "suggestedReviewers": [
    {
      "author": "alice",
      "contributions": 23,
      "reason": "Most active contributor"
    },
    {
      "author": "bob",
      "contributions": 10,
      "reason": "Regular contributor"
    },
    {
      "author": "charlie",
      "contributions": 3,
      "reason": "Contributed to tokens module"
    }
  ]
}
```

(You are filtered out automatically)

### Scenario 6: Rate limited GIF API

**Situation:** Already hit Giphy rate limit

**Behavior:**
- ✅ Fallback GIF used automatically
- ✅ No additional API calls for 1 hour
- ✅ One warning logged: `[GIF] Giphy API rate limit reached`
- ✅ PR creation continues normally

**Output:** PR with fallback GIF, everything else works.

---

[← Back to README](../README.md) | [Tools Reference](tools.md)

