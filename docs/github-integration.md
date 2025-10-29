# GitHub Integration

Complete guide for creating Pull Requests on GitHub using `pr-mcp-server`.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Smart PR Handling](#smart-pr-handling)
- [Auto-Reviewers](#auto-reviewers)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. GitHub Token

You need a GitHub token with `repo` scope to create Pull Requests.

**Personal Access Token** (starts with `ghp_`):
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Select `repo` scope (full control of private repositories)
4. Generate and copy the token

**Enterprise Token** (starts with `github_pat_`):
- Use your organization's enterprise token with `repo` scope
- Contact your GitHub admin if you don't have one

### 2. Pushed Branch

Your branch must be pushed to the remote repository:

```bash
git push -u origin your-branch-name
```

### 3. GitHub Remote

Repository must have a remote named `origin` pointing to GitHub:

```bash
# Check remotes
git remote -v

# Should show something like:
# origin  git@github.com:username/repo.git (fetch)
# origin  git@github.com:username/repo.git (push)
```

## Setup

### Set Environment Variable

**Option 1: Export in shell**

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

**Option 2: Add to shell config**

In `~/.zshrc` or `~/.bashrc`:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Then reload:
```bash
source ~/.zshrc  # or ~/.bashrc
```

**Option 3: MCP Configuration**

For Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server",
      "cwd": "{workspaceFolder}",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

For Claude Desktop:

```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server",
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Verify Setup

```bash
# Check if token is set
echo $GITHUB_TOKEN

# Should output: ghp_...
```

## Smart PR Handling

The `create_pr` tool intelligently handles existing PRs:

### Scenario 1: No Existing PR

**Action:** Creates a new PR

**Output:**
```json
{
  "action": "created",
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "state": "open"
}
```

### Scenario 2: Closed PR Exists

**Action:** Reopens the PR and updates title/description

**Why?** You might have closed a PR by mistake or want to continue work on it.

**Output:**
```json
{
  "action": "reopened",
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "state": "open"
}
```

### Scenario 3: Open PR Exists

**Action:** Updates the existing PR's title and description

**Why?** You've added more commits and want to update the description.

**Output:**
```json
{
  "action": "updated",
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "state": "open"
}
```

### Benefits

- ✅ **Never fails** on existing PRs
- ✅ **Preserves PR history** (comments, reviews, etc.)
- ✅ **Updates description** with latest changes
- ✅ **Reopens closed PRs** automatically
- ✅ **Idempotent** - safe to run multiple times

## Auto-Reviewers

The `create_pr` tool can automatically suggest and add reviewers based on Git contribution history.

### How It Works

1. **Analyzes modified files** in your branch
2. **Extracts Git history** for each file
3. **Ranks contributors** by number of commits
4. **Converts to GitHub usernames** intelligently
5. **Filters out PR author** automatically
6. **Adds reviewers** via GitHub API
7. **Verifies addition** and reports results

### Configuration

```json
{
  "addReviewers": true,    // Enable/disable auto-reviewers (default: true)
  "maxReviewers": 3        // Maximum reviewers to add (default: 3, max: 20)
}
```

### Success Example

```json
{
  "url": "https://github.com/owner/repo/pull/123",
  "number": 123,
  "action": "created",
  "reviewers": ["john-doe", "jane-smith"],
  "reviewersAdded": 2
}
```

### Failure Examples

**No Git history:**
```json
{
  "reviewersAdded": 0,
  "reviewerNote": "Analyzed 3 file(s), but found no Git history (likely new files)"
}
```

**Username mismatch:**
```json
{
  "reviewersAdded": 0,
  "reviewerNote": "Attempted to add: john-doe - but GitHub couldn't add any of them (API returned 0 reviewers). Possible reasons: (1) These usernames don't exist on GitHub..."
}
```

**Solo contributor:**
```json
{
  "reviewersAdded": 0,
  "reviewerNote": "Found contributor(s): john-doe - but all were filtered out (you are the only/main contributor)"
}
```

See [Smart Reviewers](reviewers.md) for detailed troubleshooting.

## Testing

### Test with MCP Inspector

1. **Navigate to a Git repository:**
   ```bash
   cd /path/to/your/repo
   ```

2. **Ensure branch is pushed:**
   ```bash
   git push -u origin your-branch
   ```

3. **Run Inspector with token:**
   ```bash
   GITHUB_TOKEN=ghp_your_token npx @modelcontextprotocol/inspector pr-mcp-server
   ```

4. **Call `create_pr` tool:**
   ```json
   {
     "template": "standard",
     "language": "fr",
     "draft": false,
     "addReviewers": true
   }
   ```

### Test with Cursor

1. **Set token in config** (`~/.cursor/mcp.json`):
   ```json
   {
     "mcpServers": {
       "pr-mcp-server": {
         "command": "pr-mcp-server",
         "cwd": "{workspaceFolder}",
         "env": {
           "GITHUB_TOKEN": "ghp_your_token"
         }
       }
     }
   }
   ```

2. **Restart Cursor**

3. **Push your branch:**
   ```bash
   git push -u origin your-branch
   ```

4. **Ask Cursor:**
   - "Crée une PR sur GitHub"
   - "Create a PR on GitHub with reviewers"

### Test Draft PRs

```json
{
  "template": "standard",
  "draft": true
}
```

Creates PR in draft mode for work-in-progress.

## Troubleshooting

### Error: "GitHub token is required"

**Problem:** `GITHUB_TOKEN` environment variable not set.

**Solutions:**

1. **Check if set:**
   ```bash
   echo $GITHUB_TOKEN
   ```

2. **Set it:**
   ```bash
   export GITHUB_TOKEN=ghp_your_token
   ```

3. **Verify it's valid:**
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
   ```

### Error: "Branch does not exist on remote"

**Problem:** Local branch not pushed to GitHub.

**Solutions:**

1. **Push your branch:**
   ```bash
   git push -u origin your-branch-name
   ```

2. **Verify it's on GitHub:**
   ```bash
   git branch -r | grep your-branch-name
   ```

### Error: "No remote URL found for 'origin'"

**Problem:** Git repository doesn't have GitHub remote configured.

**Solutions:**

1. **Check remotes:**
   ```bash
   git remote -v
   ```

2. **Add GitHub remote:**
   ```bash
   git remote add origin git@github.com:username/repo.git
   ```

3. **Or use HTTPS:**
   ```bash
   git remote add origin https://github.com/username/repo.git
   ```

### Error: "Bad credentials"

**Problem:** GitHub token is invalid or expired.

**Solutions:**

1. **Verify token format:**
   - Personal: should start with `ghp_`
   - Enterprise: should start with `github_pat_`

2. **Check token permissions:**
   - Must have `repo` scope
   - Check on GitHub → Settings → Personal access tokens

3. **Generate new token:**
   - Go to GitHub → Settings → Developer settings
   - Generate new token with `repo` scope

### Error: "Resource not accessible by integration"

**Problem:** Token lacks required permissions.

**Solutions:**

1. **Check token scope:**
   - Needs `repo` for private repositories
   - Or `public_repo` for public repositories only

2. **Verify repository access:**
   - Ensure you have write access to the repository
   - For organization repos, check organization permissions

### Error: "Validation failed"

**Problem:** Invalid PR data (title, description, base branch, etc.)

**Solutions:**

1. **Check base branch exists:**
   ```bash
   git branch -r | grep origin/main
   ```

2. **Verify branch is different from base:**
   ```bash
   git rev-parse HEAD
   git rev-parse origin/main
   # Should be different
   ```

3. **Check for existing PR:**
   - Tool should handle this, but verify manually on GitHub

### Reviewers Not Added

**Problem:** PR created but no reviewers added.

**See:** [Smart Reviewers Documentation](reviewers.md)

**Quick checks:**

1. **Check `reviewerNote`** in output:
   ```json
   {
     "reviewerNote": "Attempted to add: john-doe - but GitHub couldn't add any of them"
   }
   ```

2. **Verify usernames exist:**
   - Visit `https://github.com/john-doe`
   - If 404, username doesn't exist

3. **Check Git history:**
   ```bash
   git log --format="%an <%ae>" -- path/to/modified/file.ts
   ```

4. **Look for `[REVIEWERS]` logs** in console output

### Rate Limit Errors

**Problem:** Too many API requests.

**Solutions:**

1. **Check rate limit:**
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/rate_limit
   ```

2. **Wait for reset:**
   - GitHub has rate limits: 5000 requests/hour (authenticated)
   - Check `X-RateLimit-Reset` header

3. **Use different token:**
   - Generate a new token if current one is shared/abused

### PR Not Showing on GitHub

**Problem:** Tool says PR created, but can't find it on GitHub.

**Solutions:**

1. **Check URL** in output:
   ```json
   {
     "url": "https://github.com/owner/repo/pull/123"
   }
   ```
   Visit that exact URL.

2. **Check PR state:**
   - Might be created as draft
   - Check "Draft" PRs section on GitHub

3. **Verify repository:**
   - Ensure tool used correct repository
   - Check `origin` remote URL

### Cannot Reopen Closed PR

**Problem:** Tool tries to reopen but fails.

**Solutions:**

1. **Check if PR is merged:**
   - Merged PRs cannot be reopened
   - Create a new PR instead

2. **Verify permissions:**
   - Ensure you have write access
   - Org settings might restrict reopening

3. **Manual reopen:**
   - Try reopening manually on GitHub UI
   - If it fails, create new PR

---

[← Back to README](../README.md) | [Tools Reference](tools.md) | [Smart Reviewers](reviewers.md)

