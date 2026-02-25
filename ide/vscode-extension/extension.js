const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Try to locate the root of the antigravity-awesome-skills repo from the extension path.
 * This assumes the extension lives under ide/vscode-extension inside the repo.
 */
function getRepoRoot(extensionPath) {
  const candidates = [
    path.join(extensionPath, '..', '..'),
    path.join(extensionPath, '..')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'CATALOG.md'))) {
      return candidate;
    }
  }

  return extensionPath;
}

/**
 * Very lightweight parser for CATALOG.md.
 * Falls back gracefully if the format changes.
 */
function loadSkillsFromCatalog(repoRoot) {
  const catalogPath = path.join(repoRoot, 'CATALOG.md');

  if (!fs.existsSync(catalogPath)) {
    return [];
  }

  const content = fs.readFileSync(catalogPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const skills = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Primary format: markdown table row, e.g.
    // | `skill-alias` | Description ... | tags | triggers |
    if (trimmed.startsWith('|') && trimmed.includes('`')) {
      const parts = trimmed.split('|').map((p) => p.trim());
      // parts[0] is empty before first |, parts[1] should contain alias
      const aliasPart = parts.find((p) => p.includes('`'));
      if (!aliasPart) {
        continue;
      }
      const firstTick = aliasPart.indexOf('`');
      const secondTick = aliasPart.indexOf('`', firstTick + 1);
      if (firstTick === -1 || secondTick === -1) {
        continue;
      }
      const alias = aliasPart.slice(firstTick + 1, secondTick).trim();

      // Description is usually the next column
      const aliasIndex = parts.indexOf(aliasPart);
      const descriptionPart =
        aliasIndex !== -1 && aliasIndex + 1 < parts.length
          ? parts[aliasIndex + 1]
          : '';
      const description = (descriptionPart || '').trim();

      if (!alias) {
        continue;
      }

      skills.push({
        alias,
        description,
        rawLine: trimmed
      });
      continue;
    }

    // Fallback: markdown list items that contain backticks.
    if (!trimmed.startsWith('-')) continue;
    const firstTick = trimmed.indexOf('`');
    const secondTick = trimmed.indexOf('`', firstTick + 1);
    if (firstTick === -1 || secondTick === -1) continue;

    const alias = trimmed.slice(firstTick + 1, secondTick).trim();
    const description = trimmed
      .slice(secondTick + 1)
      .replace(/^[:\-–\s]+/, '')
      .trim();

    if (!alias) continue;

    skills.push({
      alias,
      description,
      rawLine: trimmed
    });
  }

  return skills;
}

/**
 * Group skills into high-level categories based on simple keyword/tag heuristics.
 * This is intentionally lightweight and does not depend on full tag parsing.
 */
function groupSkillsByCategory(skills) {
  const categories = {
    architecture: [],
    business: [],
    'data-ai': [],
    development: [],
    general: [],
    infrastructure: [],
    security: [],
    testing: [],
    workflow: []
  };

  const all = [];

  for (const skill of skills) {
    const line = (skill.rawLine || '').toLowerCase();
    const desc = (skill.description || '').toLowerCase();
    const alias = (skill.alias || '').toLowerCase();

    const text = `${alias} ${desc} ${line}`;

    let matched = false;

    if (text.includes('architecture') || text.includes('c4') || text.includes('system design')) {
      categories.architecture.push(skill);
      matched = true;
    }
    if (
      text.includes('seo') ||
      text.includes('marketing') ||
      text.includes('growth') ||
      text.includes('business')
    ) {
      categories.business.push(skill);
      matched = true;
    }
    if (text.includes('llm') || text.includes('rag') || text.includes('ai ') || text.includes('agent')) {
      categories['data-ai'].push(skill);
      matched = true;
    }
    if (
      text.includes('typescript') ||
      text.includes('javascript') ||
      text.includes('react') ||
      text.includes('backend') ||
      text.includes('frontend') ||
      text.includes('development')
    ) {
      categories.development.push(skill);
      matched = true;
    }
    if (
      text.includes('planning') ||
      text.includes('documentation') ||
      text.includes('brainstorming') ||
      text.includes('general')
    ) {
      categories.general.push(skill);
      matched = true;
    }
    if (
      text.includes('docker') ||
      text.includes('kubernetes') ||
      text.includes('devops') ||
      text.includes('aws') ||
      text.includes('azure') ||
      text.includes('infrastructure')
    ) {
      categories.infrastructure.push(skill);
      matched = true;
    }
    if (text.includes('security') || text.includes('pentest') || text.includes('owasp')) {
      categories.security.push(skill);
      matched = true;
    }
    if (text.includes('test ') || text.includes('tdd') || text.includes('testing')) {
      categories.testing.push(skill);
      matched = true;
    }
    if (text.includes('workflow') || text.includes('automation') || text.includes('process')) {
      categories.workflow.push(skill);
      matched = true;
    }

    if (!matched) {
      all.push(skill);
    }
  }

  return { categories, uncategorized: all };
}

function getFileContextCategory(document) {
  if (!document) return 'general';

  const fileName = document.fileName.toLowerCase();
  const languageId = document.languageId;

  if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
    return 'development';
  }
  if (fileName.endsWith('.py') || fileName.endsWith('.go') || fileName.endsWith('.java')) {
    return 'development';
  }
  if (
    fileName.includes('dockerfile') ||
    fileName.endsWith('docker-compose.yml') ||
    fileName.endsWith('.yml') ||
    fileName.endsWith('.yaml')
  ) {
    return 'infrastructure';
  }
  if (
    fileName.includes('auth') ||
    fileName.includes('security') ||
    fileName.includes('policy')
  ) {
    return 'security';
  }
  if (languageId === 'markdown') {
    return 'general';
  }

  return 'general';
}

function getStaticRecommendationsForCategory(category) {
  const mapping = {
    development: [
      '@typescript-expert',
      '@python-patterns',
      '@react-patterns',
      '@clean-code',
      '@test-driven-development'
    ],
    infrastructure: [
      '@docker-expert',
      '@aws-serverless',
      '@vercel-deployment',
      '@devops-best-practices'
    ],
    security: [
      '@api-security-best-practices',
      '@sql-injection-testing',
      '@vulnerability-scanner',
      '@security-audit'
    ],
    general: [
      '@brainstorming',
      '@writing-plans',
      '@doc-coauthoring',
      '@readme-generator'
    ]
  };

  return mapping[category] || mapping.general;
}

class SkillTreeItem extends vscode.TreeItem {
  /**
   * @param {string} label
   * @param {vscode.TreeItemCollapsibleState} collapsibleState
   * @param {object} [options]
   */
  constructor(label, collapsibleState, options = {}) {
    super(label, collapsibleState);
    this.contextValue = options.contextValue;
    this.description = options.description;
    this.skillAlias = options.skillAlias;
    this.command = options.command;
    this.tooltip = options.tooltip;
  }
}

class SkillsTreeDataProvider {
  /**
   * @param {Array<{alias: string, description: string, rawLine: string}>} skills
   */
  constructor(skills) {
    this.allSkills = skills || [];
    const grouped = groupSkillsByCategory(this.allSkills);
    this.categories = grouped.categories;
    this.uncategorized = grouped.uncategorized;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh(skills) {
    this.allSkills = skills || this.allSkills;
    const grouped = groupSkillsByCategory(this.allSkills);
    this.categories = grouped.categories;
    this.uncategorized = grouped.uncategorized;
    this._onDidChangeTreeData.fire();
  }

  /**
   * @param {SkillTreeItem} [element]
   * @returns {Thenable<SkillTreeItem[]> | SkillTreeItem[]}
   */
  getChildren(element) {
    if (!element) {
      // Root: list categories
      const items = [];
      for (const [key, value] of Object.entries(this.categories)) {
        if (!value.length) continue;
        items.push(
          new SkillTreeItem(`${key} (${value.length})`, vscode.TreeItemCollapsibleState.Collapsed, {
            contextValue: 'category',
            tooltip: `Skills in ${key}`
          })
        );
      }
      if (this.uncategorized.length) {
        items.push(
          new SkillTreeItem(
            `other (${this.uncategorized.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              contextValue: 'category-other',
              tooltip: 'Skills that did not match main categories'
            }
          )
        );
      }
      return items;
    }

    if (element.contextValue === 'category') {
      const key = element.label.split(' ')[0];
      const skills = this.categories[key] || [];
      return skills.map(
        (skill) =>
          new SkillTreeItem(skill.alias, vscode.TreeItemCollapsibleState.None, {
            contextValue: 'skill',
            description: skill.description,
            skillAlias: skill.alias,
            tooltip: skill.description || skill.rawLine,
            command: {
              command: 'antigravitySkills.insertAliasAtCursor',
              title: 'Insert Skill Alias at Cursor',
              arguments: [skill.alias]
            }
          })
      );
    }

    if (element.contextValue === 'category-other') {
      return this.uncategorized.map(
        (skill) =>
          new SkillTreeItem(skill.alias, vscode.TreeItemCollapsibleState.None, {
            contextValue: 'skill',
            description: skill.description,
            skillAlias: skill.alias,
            tooltip: skill.description || skill.rawLine,
            command: {
              command: 'antigravitySkills.insertAliasAtCursor',
              title: 'Insert Skill Alias at Cursor',
              arguments: [skill.alias]
            }
          })
      );
    }

    return [];
  }

  /**
   * @param {SkillTreeItem} element
   */
  getTreeItem(element) {
    return element;
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const repoRoot = getRepoRoot(context.extensionPath);
  const cachedSkills = loadSkillsFromCatalog(repoRoot);

  const treeDataProvider = new SkillsTreeDataProvider(cachedSkills);
  const treeView = vscode.window.createTreeView('antigravitySkills.treeView', {
    treeDataProvider
  });

  const openPalette = vscode.commands.registerCommand(
    'antigravitySkills.openPalette',
    async () => {
      if (!cachedSkills.length) {
        vscode.window.showWarningMessage(
          'Antigravity Skills: CATALOG.md not found or could not be parsed. Showing static suggestions only.'
        );
      }

      const items = (cachedSkills.length ? cachedSkills : []).map((skill) => ({
        label: skill.alias,
        description: skill.description || '',
        detail: skill.rawLine
      }));

      if (!items.length) {
        // Fallback to a tiny static palette
        items.push(
          { label: '@brainstorming', description: 'Plan and ideate projects.' },
          { label: '@clean-code', description: 'Refactor code with Clean Code principles.' },
          { label: '@architecture', description: 'System design and architecture guidance.' },
          { label: '@security-audit', description: 'Check code and configs for security issues.' }
        );
      }

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an Antigravity skill to copy its alias or read its description.'
      });

      if (!picked) return;

      const alias = picked.label;
      vscode.env.clipboard.writeText(alias);
      vscode.window.showInformationMessage(
        `Antigravity Skills: Copied ${alias} to clipboard. Use it in your AI prompt, e.g. "Use ${alias} to help with this file."`
      );
    }
  );

  const suggestForFile = vscode.commands.registerCommand(
    'antigravitySkills.suggestForFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          'Antigravity Skills: Open a file to get context-aware skill suggestions.'
        );
        return;
      }

      const category = getFileContextCategory(editor.document);
      const staticRecommendations = getStaticRecommendationsForCategory(category);

      // Try to intersect static recommendations with catalog skills if available.
      const byAlias = new Map();
      for (const skill of cachedSkills) {
        byAlias.set(skill.alias, skill);
      }

      const quickItems = staticRecommendations.map((alias) => {
        const fromCatalog = byAlias.get(alias);
        return {
          label: alias,
          description: fromCatalog ? fromCatalog.description : '',
          detail: fromCatalog ? fromCatalog.rawLine : `Suggested for ${category} context`
        };
      });

      const picked = await vscode.window.showQuickPick(quickItems, {
        placeHolder: `Recommended Antigravity skills for ${category} files.`
      });

      if (!picked) return;

      await vscode.env.clipboard.writeText(picked.label);
      vscode.window.showInformationMessage(
        `Antigravity Skills: Copied ${picked.label} to clipboard. Paste it into your AI assistant and say what you want it to do.`
      );
    }
  );

  const insertAliasAtCursor = vscode.commands.registerCommand(
    'antigravitySkills.insertAliasAtCursor',
    async (aliasFromArg) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          'Antigravity Skills: Open a text editor to insert a skill alias.'
        );
        return;
      }

      let alias = aliasFromArg;

      if (!alias) {
        const items = cachedSkills.map((skill) => ({
          label: skill.alias,
          description: skill.description || '',
          detail: skill.rawLine
        }));

        const picked = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a skill alias to insert at cursor.'
        });

        if (!picked) return;
        alias = picked.label;
      }

      await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
          editBuilder.insert(selection.active, alias);
        }
      });
    }
  );

  context.subscriptions.push(openPalette, suggestForFile, insertAliasAtCursor, treeView);
}

function deactivate() {
  // No-op for now
}

module.exports = {
  activate,
  deactivate
};

