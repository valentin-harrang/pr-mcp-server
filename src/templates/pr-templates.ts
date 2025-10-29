import { CommitInfo, FileChange } from "../core/git/types.js";
import { TemplateData, PRTemplates } from "../validation/types.js";
import { selectGif } from "./gif-selector.js";

export const prTemplates: PRTemplates = {
  standard: {
    fr: async (data: TemplateData) => `## Description

**Que fait cette PR ou qu'ajoute-t-elle ?**

${data.commits
  .map((c: CommitInfo) => {
    // Convertir le message de commit en bullet point descriptif
    let message = c.message;
    
    // Remplacer les préfixes de commit conventionnels par des descriptions plus naturelles
    message = message.replace(/^feat(\(.+\))?:?\s*/i, 'Ajoute ');
    message = message.replace(/^add(\(.+\))?:?\s*/i, 'Ajoute ');
    message = message.replace(/^fix(\(.+\))?:?\s*/i, 'Corrige ');
    message = message.replace(/^update(\(.+\))?:?\s*/i, 'Met à jour ');
    message = message.replace(/^refactor(\(.+\))?:?\s*/i, 'Refactorise ');
    message = message.replace(/^remove(\(.+\))?:?\s*/i, 'Supprime ');
    message = message.replace(/^delete(\(.+\))?:?\s*/i, 'Supprime ');
    message = message.replace(/^implement(\(.+\))?:?\s*/i, 'Implémente ');
    message = message.replace(/^improve(\(.+\))?:?\s*/i, 'Améliore ');
    message = message.replace(/^enhance(\(.+\))?:?\s*/i, 'Améliore ');
    message = message.replace(/^optimize(\(.+\))?:?\s*/i, 'Optimise ');
    message = message.replace(/^style(\(.+\))?:?\s*/i, 'Met à jour le style de ');
    message = message.replace(/^chore(\(.+\))?:?\s*/i, 'Maintenance: ');
    message = message.replace(/^docs(\(.+\))?:?\s*/i, 'Documentation: ');
    message = message.replace(/^test(\(.+\))?:?\s*/i, 'Tests: ');
    
    // Capitaliser la première lettre
    message = message.charAt(0).toLowerCase() + message.slice(1);
    
    return `- ${message}`;
  })
  .join('\n') || `- Cette PR contient ${data.totalCommits} commits avec ${data.filesChanged} fichiers modifiés.`}

**Étapes nécessaires pour la tester ?**

- Exécuter les tests unitaires : \`npm test\`
- Vérifier les fonctionnalités modifiées
- Tester les cas d'usage principaux

**Détails d'implémentation notables :**

${(() => {
  const implementationCommits = data.commits.filter((c: CommitInfo) => 
    c.message.toLowerCase().includes('refactor') || 
    c.message.toLowerCase().includes('architecture') ||
    c.message.toLowerCase().includes('optimize') ||
    c.message.toLowerCase().includes('implement') ||
    c.message.toLowerCase().includes('migrate') ||
    c.message.toLowerCase().includes('restructure')
  );
  
  if (implementationCommits.length > 0) {
    return implementationCommits.map((c: CommitInfo) => `- ${c.message}`).join('\n');
  }
  
  // Si pas de commits d'implémentation spécifiques, générer des détails basés sur les types de fichiers modifiés
  const hasUIChanges = data.filesList.some(f => f.file.includes('component') || f.file.includes('ui') || f.file.includes('css'));
  const hasLogicChanges = data.filesList.some(f => f.file.includes('service') || f.file.includes('util') || f.file.includes('helper'));
  const hasConfigChanges = data.filesList.some(f => f.file.includes('config') || f.file.includes('.env') || f.file.includes('package.json'));
  
  const details = [];
  if (hasUIChanges) details.push('- Modifications de l\'interface utilisateur');
  if (hasLogicChanges) details.push('- Changements dans la logique métier');
  if (hasConfigChanges) details.push('- Mise à jour de la configuration');
  
  return details.length > 0 ? details.join('\n') : '- Aucun détail d\'implémentation spécifique';
})()}

**Étapes de déploiement :**

- Aucune migration ou mise à jour de configuration requise
- Redémarrage des services si nécessaire
- Vérification post-déploiement

**Gif :**

![PR GIF](${await selectGif(data)})`,
    en: async (data: TemplateData) => `## Description

**What does this PR change or add?**

${data.commits
  .map((c: CommitInfo) => {
    // Convert commit message to descriptive bullet point
    let message = c.message;
    
    // Replace conventional commit prefixes with more natural descriptions
    message = message.replace(/^feat(\(.+\))?:?\s*/i, 'Adds ');
    message = message.replace(/^add(\(.+\))?:?\s*/i, 'Adds ');
    message = message.replace(/^fix(\(.+\))?:?\s*/i, 'Fixes ');
    message = message.replace(/^update(\(.+\))?:?\s*/i, 'Updates ');
    message = message.replace(/^refactor(\(.+\))?:?\s*/i, 'Refactors ');
    message = message.replace(/^remove(\(.+\))?:?\s*/i, 'Removes ');
    message = message.replace(/^delete(\(.+\))?:?\s*/i, 'Removes ');
    message = message.replace(/^implement(\(.+\))?:?\s*/i, 'Implements ');
    message = message.replace(/^improve(\(.+\))?:?\s*/i, 'Improves ');
    message = message.replace(/^enhance(\(.+\))?:?\s*/i, 'Enhances ');
    message = message.replace(/^optimize(\(.+\))?:?\s*/i, 'Optimizes ');
    message = message.replace(/^style(\(.+\))?:?\s*/i, 'Updates styling for ');
    message = message.replace(/^chore(\(.+\))?:?\s*/i, 'Maintenance: ');
    message = message.replace(/^docs(\(.+\))?:?\s*/i, 'Documentation: ');
    message = message.replace(/^test(\(.+\))?:?\s*/i, 'Tests: ');
    
    // Capitalize first letter
    message = message.charAt(0).toLowerCase() + message.slice(1);
    
    return `- ${message}`;
  })
  .join('\n') || `- This PR contains ${data.totalCommits} commits with ${data.filesChanged} modified files.`}

**Any steps needed to test it?**

- Run unit tests: \`npm test\`
- Verify modified functionality
- Test main use cases

**Notable implementation details:**

${(() => {
  const implementationCommits = data.commits.filter((c: CommitInfo) => 
    c.message.toLowerCase().includes('refactor') || 
    c.message.toLowerCase().includes('architecture') ||
    c.message.toLowerCase().includes('optimize') ||
    c.message.toLowerCase().includes('implement') ||
    c.message.toLowerCase().includes('migrate') ||
    c.message.toLowerCase().includes('restructure')
  );
  
  if (implementationCommits.length > 0) {
    return implementationCommits.map((c: CommitInfo) => `- ${c.message}`).join('\n');
  }
  
  // If no specific implementation commits, generate details based on file types modified
  const hasUIChanges = data.filesList.some(f => f.file.includes('component') || f.file.includes('ui') || f.file.includes('css'));
  const hasLogicChanges = data.filesList.some(f => f.file.includes('service') || f.file.includes('util') || f.file.includes('helper'));
  const hasConfigChanges = data.filesList.some(f => f.file.includes('config') || f.file.includes('.env') || f.file.includes('package.json'));
  
  const details = [];
  if (hasUIChanges) details.push('- User interface modifications');
  if (hasLogicChanges) details.push('- Business logic changes');
  if (hasConfigChanges) details.push('- Configuration updates');
  
  return details.length > 0 ? details.join('\n') : '- No specific implementation details';
})()}

**Deployment steps:**

- No migrations or config updates required
- Service restart if necessary
- Post-deployment verification

**Gif:**

![PR GIF](${await selectGif(data)})`,
  },
  minimal: {
    fr: async (data: TemplateData) => `![GIF](${await selectGif(data)})

## ${data.title || data.currentBranch}

${data.commits.map((c: CommitInfo) => `- ${c.message}`).join("\n")}

**Impact:** ${data.filesChanged} files | +${data.insertions} -${
      data.deletions
    }`,
    en: async (data: TemplateData) => `![GIF](${await selectGif(data)})

## ${data.title || data.currentBranch}

${data.commits.map((c: CommitInfo) => `- ${c.message}`).join("\n")}

**Impact:** ${data.filesChanged} files | +${data.insertions} -${
      data.deletions
    }`,
  },
  detailed: {
    fr: async (data: TemplateData) =>
      `${await prTemplates.standard.fr(data)}

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
    en: async (data: TemplateData) =>
      `${await prTemplates.standard.en(data)}

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
