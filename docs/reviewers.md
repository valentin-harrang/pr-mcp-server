# Smart Reviewers

Automatic reviewer suggestion and assignment based on Git contribution history.

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Username Detection](#username-detection)
- [Diagnostic Messages](#diagnostic-messages)
- [Troubleshooting](#troubleshooting)
- [Common Issues](#common-issues)

## How It Works

The reviewer detection system analyzes Git history to automatically suggest and add reviewers to your Pull Requests.

### Process

1. **Analyze Modified Files**: Identifies all files changed in your branch
2. **Extract Git History**: Retrieves commit history for each modified file
3. **Parse Contributors**: Extracts author names and emails from commits
4. **Convert to GitHub Usernames**: Intelligently converts Git identities to GitHub usernames
5. **Rank by Contributions**: Ranks contributors by number of commits to modified files
6. **Filter Author**: Automatically excludes the PR author from reviewers
7. **Verify Addition**: Confirms reviewers were actually added via GitHub API

### Algorithm

The system uses a smart priority-based approach:

```
1. GitHub noreply email → username
   john@users.noreply.github.com → john

2. Email local part (without separators)
   john.doe@company.com → johndoe
   
3. Email local part (with hyphens)
   john.doe@company.com → john-doe
   
4. Name (without spaces)
   "John Doe" → johndoe
   
5. Name (with hyphens)
   "John Doe" → john-doe
```

## Username Detection

### Priority Order

The system tries multiple strategies to extract valid GitHub usernames:

#### 1. GitHub Noreply Emails (Highest Priority)

```
username@users.noreply.github.com → username
12345+username@users.noreply.github.com → username
```

✅ **Most reliable** - Directly maps to GitHub username

#### 2. Email Without Separators

```
john.doe@company.com → johndoe
jane_smith@example.com → janesmith
```

✅ **Common format** - Many GitHub usernames don't include separators

#### 3. Email With Hyphens

```
john.doe@company.com → john-doe
jane_smith@example.com → jane-smith
```

⚠️ **Fallback** - Used if "without separators" format doesn't work

#### 4. Name Without Spaces

```
"John Doe" → johndoe
"Jane Smith" → janesmith
```

⚠️ **Secondary fallback** - When email doesn't provide clear username

#### 5. Name With Hyphens

```
"John Doe" → john-doe
"Jane Smith" → jane-smith
```

⚠️ **Last resort** - Least reliable format

### Verification

After requesting reviewers via GitHub API, the system:
1. Checks `response.data.requested_reviewers`
2. Compares requested vs actually added reviewers
3. Reports discrepancies in `reviewerNote`

## Diagnostic Messages

The `reviewerNote` field provides detailed feedback about reviewer assignment.

### Success Messages

| Message | Meaning |
|---------|---------|
| *(no reviewerNote)* | All reviewers successfully added |
| `Partially successful: Added alice but couldn't add bob` | Some succeeded, others failed |

### Failure Messages

| Message | Meaning | Solution |
|---------|---------|----------|
| `Analyzed X file(s), but found no Git history (likely new files)` | Modified files are new | Normal for new features - add reviewers manually |
| `Found contributor(s): john-doe - but all were filtered out (you are the only/main contributor)` | You're the only contributor | Add reviewers manually or continue solo |
| `Attempted to add: john-doe - but GitHub couldn't add any of them (API returned 0 reviewers)` | **Usernames don't exist on GitHub** | Username mismatch - try manually with correct username |
| `GitHub API error: ... These usernames may not exist` | API call failed entirely | Verify Git emails match GitHub accounts or check permissions |

## Troubleshooting

### Username Mismatches

**Problem**: `"Attempted to add: john-doe - but GitHub couldn't add any of them"`

**This means:**
1. The system found a contributor in Git history (e.g., email: `john.doe@company.com`)
2. It converted the email to a username (tried `johndoe` first, then `john-doe`)
3. GitHub couldn't find these usernames - they don't exist or are spelled differently

**Solutions:**

1. **Check the actual GitHub username:**
   - Go to the contributor's GitHub profile
   - Look at the URL: `github.com/USERNAME`

2. **Compare with Git email:**
   ```bash
   # Check who contributed to your files
   git log --format="%an <%ae>" -- path/to/file.ts | sort -u
   ```

3. **Verify username exists:**
   - Try visiting `https://github.com/username`
   - If 404, the username doesn't exist

4. **Add manually:**
   - Use the GitHub UI to add reviewers
   - This confirms the correct username

### Debugging with Logs

The system provides detailed `[REVIEWERS]` logs via `console.error`:

```
[REVIEWERS] Current GitHub user (PR author): alice
[REVIEWERS] All suggested reviewers: johndoe, alice
[REVIEWERS] After filtering PR author: johndoe
[REVIEWERS] Attempting to add 1 reviewer(s): johndoe
[REVIEWERS] API Response Status: 201
[REVIEWERS] Requested reviewers in response: ["johndoe"]
[REVIEWERS] ✅ Successfully added 1 reviewer(s): johndoe
```

If reviewers aren't added, check:
- `All suggested reviewers` - Are they correct?
- `After filtering PR author` - Did the PR author get filtered?
- `API Response Status` - Was the request successful (201)?
- `Requested reviewers in response` - Did GitHub actually add them?

### No Reviewers Found

**Scenario 1: New Files**

```json
{
  "reviewerNote": "Analyzed 3 file(s), but found no Git history (likely new files)"
}
```

**Solution**: This is normal - new files have no commit history. Add reviewers manually.

**Scenario 2: Solo Contributor**

```json
{
  "reviewerNote": "Found contributor(s): john-doe - but all were filtered out (you are the only/main contributor)"
}
```

**Solution**: You're the only one who worked on these files. Add reviewers manually if needed.

**Scenario 3: No Commit History**

```json
{
  "reviewerNote": "No commit history found for modified files"
}
```

**Solution**: The files exist but have no commits (rare). Verify files are tracked and committed.

### Permission Errors

**Problem**: `GitHub API error: ... you may lack permission`

**Solutions:**

1. **Check token permissions:**
   ```bash
   # Token must have 'repo' scope
   curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user
   ```

2. **Verify repository access:**
   - Ensure you have write access to the repository
   - Check if branch protection rules allow reviewer assignment

3. **Try manual assignment:**
   - Use GitHub UI to add a reviewer
   - If it fails, you likely lack permissions

## Common Issues

### Issue: Git Name vs GitHub Username

**Problem**: Git name is "John Doe" but GitHub username is "johndoe42"

**Solution**: The system will try `johndoe` (without spaces) but not `johndoe42`. Either:
- Ask contributor to use GitHub noreply email in Git config
- Add reviewers manually

### Issue: Corporate Email Formats

**Problem**: Email is `john.doe@bigcorp.com` but GitHub username is `jdoe`

**Solution**: The system tries `johndoe` and `john-doe`, but not abbreviations. Either:
- Use GitHub noreply email for Git commits
- Add reviewers manually

### Issue: Multiple Contributors, None Added

**Problem**: Several people worked on files, but none were added

**Solution**: Check if all have username mismatch issues:
```bash
# See all contributors to your changes
git log --format="%an <%ae>" origin/main..HEAD | sort -u
```

Then verify each username exists on GitHub.

### Issue: Reviewers Already Assigned

**Problem**: `couldn't add bob (usernames may not exist, already reviewers, or you lack permissions)`

**Solution**: Check if Bob is already a reviewer on the PR. GitHub API won't re-add existing reviewers.

## Best Practices

### For Contributors

**Use GitHub noreply email** in your Git config:

```bash
git config --global user.email "username@users.noreply.github.com"
```

This ensures perfect username detection.

### For Repository Owners

1. **Document team GitHub usernames** in `CODEOWNERS` or team docs
2. **Encourage noreply emails** for consistent Git commits
3. **Test reviewer assignment** on a test PR first
4. **Add fallback reviewers manually** if auto-detection fails

### For Users

1. **Check logs first** - `[REVIEWERS]` logs show exactly what happened
2. **Verify usernames** - Visit GitHub profiles to confirm usernames
3. **Manual fallback** - Always have option to add reviewers via UI
4. **Report patterns** - If certain usernames consistently fail, report them

---

[← Back to README](../README.md) | [Tools Reference](tools.md) | [GitHub Integration](github-integration.md)

