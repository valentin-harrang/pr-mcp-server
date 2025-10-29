# Smart GIF Selection

Automatic GIF selection for Pull Requests based on work type and commit patterns.

## 📋 Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [GIF Categories](#gif-categories)
- [Rate Limit Handling](#rate-limit-handling)
- [Disabling GIFs](#disabling-gifs)
- [Troubleshooting](#troubleshooting)

## Features

- ✅ **Automatic category detection**: Selects GIFs based on commit types (feature, fix, refactor, etc.)
- ✅ **Graceful fallback**: If Giphy API fails, uses a default GIF (never blocks PR creation)
- ✅ **Rate limit handling**: Automatically detects 429 errors and stops making requests for 1 hour
- ✅ **Optional**: Can be completely disabled via environment variable
- ✅ **No blocking**: GIF selection failures never block PR creation workflow

## How It Works

### 1. Analyze Branch

The system analyzes your Git branch to determine:
- Commit types (feat, fix, docs, test, refactor, perf, etc.)
- Breaking changes
- Test additions
- Scope and impact of changes

### 2. Select Category

Based on the analysis, it selects an appropriate GIF category:

```
Priority Order:
1. Breaking changes → "breaking" category
2. Feature commits → "feature" category
3. Bug fixes → "fix" category
4. Tests → "test" category
5. Refactoring → "refactor" category
6. Performance → "perf" category
7. Documentation → "docs" category
8. Default → "default" category
```

### 3. Fetch GIF

For the selected category:
1. Chooses a random search term (e.g., "coding celebration" for features)
2. Queries Giphy API with the search term
3. Randomly selects one GIF from results
4. Returns the GIF URL

### 4. Fallback on Error

If anything fails:
- Uses a static fallback GIF URL
- Never throws errors
- Never blocks PR creation

## GIF Categories

### 🚀 Feature Development

**Trigger:** Commits with `feat` type or new feature additions

**Search terms:**
- "coding celebration"
- "building something"
- "success"
- "awesome work"

**Example GIFs:** Coding animations, building blocks, celebration scenes

---

### 🐛 Bug Fixes

**Trigger:** Commits with `fix` type

**Search terms:**
- "bug fixed"
- "problem solved"
- "debugging"
- "victory"

**Example GIFs:** Problem-solving, debugging, victory dances

---

### 📝 Documentation

**Trigger:** Commits with `docs` type

**Search terms:**
- "writing"
- "documentation"
- "knowledge"
- "learning"

**Example GIFs:** Writing, teaching, learning scenes

---

### 🧪 Testing

**Trigger:** Commits with `test` type or test file additions

**Search terms:**
- "testing"
- "quality assurance"
- "success"
- "confidence"

**Example GIFs:** Testing equipment, quality checks, thumbs up

---

### ♻️ Refactoring

**Trigger:** Commits with `refactor` type

**Search terms:**
- "cleaning up"
- "improving code"
- "optimization"
- "better code"

**Example GIFs:** Cleaning, organizing, improvement scenes

---

### ⚡ Performance

**Trigger:** Commits with `perf` type

**Search terms:**
- "speed"
- "performance"
- "fast"
- "optimization"

**Example GIFs:** Fast motion, rockets, speed scenes

---

### 💥 Breaking Changes

**Trigger:** Commit messages with `BREAKING CHANGE` or `!` after type

**Search terms:**
- "major changes"
- "big update"
- "transformation"
- "evolution"

**Example GIFs:** Explosions, transformations, major changes

---

### 🔧 Default

**Trigger:** Other commit types or mixed commits

**Search terms:**
- "coding"
- "programming"
- "development"
- "work"

**Example GIFs:** General coding, programming, work scenes

## Rate Limit Handling

### Detection

When Giphy API returns a 429 (Rate Limit) error:

1. **Sets rate limit flag**: Activates internal `isRateLimited` flag
2. **Logs warning once**: `[GIF] Giphy API rate limit reached (429). Using fallback GIFs for the next hour.`
3. **Uses fallback immediately**: Returns static fallback GIF
4. **Waits 1 hour**: Doesn't retry API calls for 60 minutes

### During Rate Limit Period

- ✅ All GIF requests return fallback immediately
- ✅ No additional API calls are made
- ✅ No additional warnings are logged
- ✅ PR creation continues normally

### After Rate Limit Period

After 1 hour:
- Automatically resets the rate limit flag
- Tries Giphy API again on next request
- If successful, resumes normal operation

### Fallback GIF

```
https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif
```

A neutral coding GIF suitable for any PR type.

## Disabling GIFs

### Why Disable?

- Avoid external API calls
- Faster PR creation
- Corporate network restrictions
- Already hit rate limit frequently

### How to Disable

**Option 1: Environment Variable**

```bash
export DISABLE_GIFS=true
```

Or:

```bash
export DISABLE_GIFS=1
```

**Option 2: MCP Configuration**

For Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pr-mcp-server": {
      "command": "pr-mcp-server",
      "cwd": "{workspaceFolder}",
      "env": {
        "DISABLE_GIFS": "true"
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
        "DISABLE_GIFS": "true"
      }
    }
  }
}
```

### Behavior When Disabled

- ✅ Giphy API is never called
- ✅ Fallback GIF is always used
- ✅ No network requests
- ✅ Instant GIF "selection"
- ✅ No rate limit errors

## Troubleshooting

### Issue: Seeing Many 429 Errors

**Symptoms:**
```
[error] Giphy API request failed with status 429
[error] Giphy API request failed with status 429
```

**Solution:**
The new version detects this and:
1. Logs ONE warning: `[GIF] Giphy API rate limit reached (429)`
2. Automatically uses fallbacks for 1 hour
3. Doesn't spam more errors

**If you still see spam:** Update to latest version and rebuild:
```bash
npm run build
```

### Issue: Wrong GIF for PR Type

**Problem:** Feature PR gets a bug fix GIF

**Causes:**
1. Commit messages aren't using conventional format
2. Mixed commit types in PR
3. First commit type determines category

**Solutions:**
1. Use conventional commits: `feat:`, `fix:`, etc.
2. Split PRs by type for accurate GIFs
3. Categories are best-effort - GIF is decorative only

### Issue: GIF Not Loading in GitHub

**Problem:** GIF shows broken image in PR description

**Causes:**
1. Giphy URL expired (rare)
2. GitHub/Giphy connection issue
3. Corporate network blocks Giphy

**Solutions:**
1. Edit PR description and replace GIF URL
2. Remove GIF section entirely
3. Use `DISABLE_GIFS=true` to avoid Giphy

### Issue: Want Different GIF Categories

**Problem:** Want custom GIF searches for my team

**Solution:** Modify `src/templates/gif-selector.ts`:

```typescript
const GIF_SEARCH_TERMS: Record<string, string[]> = {
  feature: ["your", "custom", "search", "terms"],
  // ... other categories
};
```

Then rebuild:
```bash
npm run build
```

### Issue: GIF Takes Too Long

**Problem:** PR creation feels slow due to GIF fetching

**Solutions:**

1. **Disable GIFs** for faster creation:
   ```bash
   export DISABLE_GIFS=true
   ```

2. **Network optimization**: GIF fetch is async and shouldn't block, but network latency can add 1-2 seconds

3. **Use fallback**: After first rate limit, fallback is instant

## Examples

### Feature PR

**Commits:** `feat(auth): add OAuth`, `feat(auth): add refresh tokens`

**Selected Category:** "feature"

**Search Term:** "coding celebration" (random from feature terms)

**Result:**
```markdown
![GIF](https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif)

## 🎯 feat(auth): add OAuth support
...
```

### Bug Fix PR

**Commits:** `fix(api): handle null responses`, `fix(api): add validation`

**Selected Category:** "fix"

**Search Term:** "problem solved" (random from fix terms)

**Result:**
```markdown
![GIF](https://media.giphy.com/media/3o7abldj0b3rxrZUxW/giphy.gif)

## 🐛 fix(api): handle null responses
...
```

### Rate Limited

**Scenario:** Hit Giphy rate limit

**Result:**
```markdown
![GIF](https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif)

## 🎯 feat(auth): add OAuth support
...
```

Plus log message:
```
[GIF] Giphy API rate limit reached (429). Using fallback GIFs for the next hour. This won't affect PR creation.
```

---

[← Back to README](../README.md) | [Tools Reference](tools.md)

