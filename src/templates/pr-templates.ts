import { CommitInfo, FileChange } from "../core/git/types.js";
import { TemplateData, PRTemplates } from "../validation/types.js";
import { selectGif } from "./gif-selector.js";

export const prTemplates: PRTemplates = {
  standard: {
    fr: (data: TemplateData) => `![GIF](${selectGif(data)})

## 🎯 ${
      data.title || `Update from ${data.currentBranch}`
    }

### 📋 Description
${
  data.description ||
  "This PR contains " +
    data.totalCommits +
    " commits with " +
    data.filesChanged +
    " modified files."
}

### 🔄 Changes
${data.commits.map((c: CommitInfo) => `- ${c.message} (${c.hash})`).join("\n")}

${
  data.includeStats !== false
    ? `### 📊 Statistics\n- **Modified files:** ${data.filesChanged}\n- **Additions:** +${data.insertions}\n- **Deletions:** -${data.deletions}\n- **Commits:** ${data.totalCommits}`
    : ""
}

### ✅ Checklist
- [ ] Code has been tested locally
- [ ] All tests pass
- [ ] Documentation updated if needed
- [ ] No forgotten console.log
- [ ] Code conventions respected

### 📝 Type of change
${data.commitTypes.map((type: string) => `- [x] ${type}`).join("\n")}

${
  data.includeStats !== false
    ? `### 🔍 Impacted files\n\`\`\`\n${data.filesList
        .slice(0, 10)
        .map((f: FileChange) => `${f.file} | +${f.insertions} -${f.deletions}`)
        .join("\n")}\n${
        data.filesList.length > 10
          ? `... and ${data.filesList.length - 10} more files`
          : ""
      }\n\`\`\``
    : ""
}`,
    en: (data: TemplateData) => `![GIF](${selectGif(data)})

## 🎯 ${
      data.title || `Update from ${data.currentBranch}`
    }

### 📋 Description
${
  data.description ||
  "This PR contains " +
    data.totalCommits +
    " commits with " +
    data.filesChanged +
    " modified files."
}

### 🔄 Changes
${data.commits.map((c: CommitInfo) => `- ${c.message} (${c.hash})`).join("\n")}

${
  data.includeStats !== false
    ? `### 📊 Statistics\n- **Modified files:** ${data.filesChanged}\n- **Additions:** +${data.insertions}\n- **Deletions:** -${data.deletions}\n- **Commits:** ${data.totalCommits}`
    : ""
}

### ✅ Checklist
- [ ] Code has been tested locally
- [ ] All tests pass
- [ ] Documentation updated if needed
- [ ] No forgotten console.log
- [ ] Code conventions respected

### 📝 Type of change
${data.commitTypes.map((type: string) => `- [x] ${type}`).join("\n")}

${
  data.includeStats !== false
    ? `### 🔍 Impacted files\n\`\`\`\n${data.filesList
        .slice(0, 10)
        .map((f: FileChange) => `${f.file} | +${f.insertions} -${f.deletions}`)
        .join("\n")}\n${
        data.filesList.length > 10
          ? `... and ${data.filesList.length - 10} more files`
          : ""
      }\n\`\`\``
    : ""
}`,
  },
  minimal: {
    fr: (data: TemplateData) => `![GIF](${selectGif(data)})

## ${data.title || data.currentBranch}

${data.commits.map((c: CommitInfo) => `- ${c.message}`).join("\n")}

**Impact:** ${data.filesChanged} files | +${data.insertions} -${
      data.deletions
    }`,
    en: (data: TemplateData) => `![GIF](${selectGif(data)})

## ${data.title || data.currentBranch}

${data.commits.map((c: CommitInfo) => `- ${c.message}`).join("\n")}

**Impact:** ${data.filesChanged} files | +${data.insertions} -${
      data.deletions
    }`,
  },
  detailed: {
    fr: (data: TemplateData) =>
      `${prTemplates.standard.fr(data)}

### 🚨 Important notes
${
  data.hasBreakingChanges
    ? "- ⚠️ **Breaking Changes detected**"
    : "- ✅ No breaking changes"
}
${data.hasTests ? "- ✅ Tests included" : "- ⚠️ No tests added"}

### 👥 Suggested reviewers
To be determined based on modified files

### 🔗 Links
- Related issue: #XXX
- Documentation: [Link to docs]`,
    en: (data: TemplateData) =>
      `${prTemplates.standard.en(data)}

### 🚨 Important notes
${
  data.hasBreakingChanges
    ? "- ⚠️ **Breaking Changes detected**"
    : "- ✅ No breaking changes"
}
${data.hasTests ? "- ✅ Tests included" : "- ⚠️ No tests added"}

### 👥 Suggested reviewers
To be determined based on modified files

### 🔗 Links
- Related issue: #XXX
- Documentation: [Link to docs]`,
  },
};
