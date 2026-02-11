const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../skills');

// Mapping rules: Trigger -> [Skill Names]
const RULES = {
    // Languages & Frameworks
    'react': ['react-best-practices', 'react-patterns', 'react-modernization'],
    'next': ['nextjs-best-practices', 'nextjs-app-router-patterns'],
    'vue': ['vue-best-practices'], // Assuming exists or generic
    'angular': ['angular', 'angular-best-practices'],
    'typescript': ['typescript-expert', 'typescript-advanced-types'],
    'node': ['nodejs-best-practices', 'nodejs-backend-patterns'],
    'express': ['nodejs-backend-patterns'],
    'python': ['python-pro', 'python-patterns', 'python-performance-optimization'],
    'django': ['django-pro'],
    'fastapi': ['fastapi-pro'],
    'rust': ['rust-pro', 'rust-async-patterns'],
    'go': ['golang-pro', 'go-concurrency-patterns'],
    'java': ['java-pro'],
    'csharp': ['csharp-pro', 'dotnet-backend-patterns'],
    'cpp': ['cpp-pro'],
    'ruby': ['ruby-pro', 'skill-rails-upgrade'],
    'php': ['php-pro'],
    'laravel': ['php-pro'], // Generic mapping if specific doesn't exist

    // Infrastructure & Tools
    'docker': ['docker-expert'],
    'kubernetes': ['kubernetes-architect', 'k8s-manifest-generator'],
    'aws': ['aws-skills', 'aws-serverless'],
    'azure': ['azure-functions'],
    'terraform': ['terraform-skill', 'terraform-module-library'],
    'git': ['git-commit', 'git-advanced-workflows'],
    'github': ['github-automation', 'github-actions-templates'],

    // Concepts
    'security': ['security-audit', 'owasp-top-10'], // owasp might need check
    'test': ['testing-patterns', 'test-driven-development'],
    'jest': ['javascript-testing-patterns'],
    'database': ['database-design', 'sql-optimization-patterns']
};

// File extension to keyword mapping
const EXT_MAP = {
    '.js': 'node',
    '.ts': 'typescript',
    '.tsx': 'react',
    '.jsx': 'react',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'cpp',
    '.rb': 'ruby',
    '.php': 'php',
    '.tf': 'terraform',
    '.sql': 'database'
};

// Filename to keyword mapping
const FILE_MAP = {
    'Dockerfile': 'docker',
    'docker-compose.yml': 'docker',
    'package.json': 'node',
    'go.mod': 'go',
    'Cargo.toml': 'rust',
    'pom.xml': 'java',
    'requirements.txt': 'python',
    'pyproject.toml': 'python',
    '.git': 'git'
};

// Helper to find alias
function findAlias(skillName) {
    const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
    // Try to find if there is an existing alias directory that points to this skill
    // This is expensive to search backwards.
    // Instead, let's look for a folder with the same name first (original).
    // The "alias" is actually a separate folder now in this architecture.
    // So we need to find which short folder contains "alias-for: skillName".

    // Quick scan of all directories <= 4 chars
    const dirs = fs.readdirSync(SKILLS_DIR);
    for (const d of dirs) {
        if (d.length <= 4) {
            const readmePath = path.join(SKILLS_DIR, d, 'SKILL.md');
            if (fs.existsSync(readmePath)) {
                const content = fs.readFileSync(readmePath, 'utf8');
                if (content.includes(`alias-for: ${skillName}`)) {
                    return d;
                }
            }
        }
    }
    return null;
}

function analyzeContext(dir) {
    const detected = new Set();

    // 1. Scan files in root
    try {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            const ext = path.extname(f);
            if (EXT_MAP[ext]) detected.add(EXT_MAP[ext]);
            if (FILE_MAP[f]) detected.add(FILE_MAP[f]);
        });
    } catch (e) {
        console.error("Error scanning directory:", e.message);
    }

    // 2. Scan package.json for deps
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            Object.keys(allDeps).forEach(dep => {
                if (dep.includes('react')) detected.add('react');
                if (dep.includes('next')) detected.add('next');
                if (dep.includes('vue')) detected.add('vue');
                if (dep.includes('angular')) detected.add('angular');
                if (dep.includes('express')) detected.add('express');
                if (dep.includes('jest') || dep.includes('mocha')) detected.add('test');
                if (dep.includes('typescript')) detected.add('typescript');
                if (dep.includes('aws-sdk')) detected.add('aws');
            });
        } catch (e) { }
    }

    return Array.from(detected);
}

function main() {
    console.log('Scanning project context...\n');
    const context = analyzeContext(process.cwd());

    if (context.length === 0) {
        console.log('No specific context detected. Try generic skills like @b (brainstorming) or @cc (clean-code).');
        return;
    }

    console.log(`Detected Context: ${context.join(', ')}\n`);
    console.log('Suggested Skills:');
    console.log('| Alias | Skill | Reason |');
    console.log('| :--- | :--- | :--- |');

    const suggestions = new Set();

    context.forEach(key => {
        const skills = RULES[key];
        if (skills) {
            skills.forEach(skillName => {
                if (!suggestions.has(skillName)) {
                    suggestions.add(skillName);
                    const alias = findAlias(skillName) || '-';
                    console.log(`| **@${alias}** | ${skillName} | ${key} |`);
                }
            });
        }
    });

    console.log('\nTip: Use "node scripts/search_skills.js <term>" to search for more.');
}

main();
