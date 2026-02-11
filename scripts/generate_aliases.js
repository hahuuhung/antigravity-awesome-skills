const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../skills');
const DOC_FILE = path.join(__dirname, '../doc/short_skills_mapping_full.md');

// Helper to get directories
function getDirectories(src) {
    return fs.readdirSync(src).filter(file => {
        return fs.statSync(path.join(src, file)).isDirectory();
    });
}

// Algorithm to generate short name
function generateShortName(name, existingAliases) {
    const parts = name.split(/[-_]/);
    let alias = '';

    // Strategy 1: Initials (e.g., react-native -> rn)
    alias = parts.map(p => p[0]).join('');
    if (!existingAliases.has(alias) && alias.length < name.length) return alias;

    // Strategy 2: First 2 chars of first word + initials of rest (e.g., ren)
    if (parts.length > 0) {
        alias = parts[0].substring(0, 2) + parts.slice(1).map(p => p[0]).join('');
        if (!existingAliases.has(alias) && alias.length < name.length) return alias;
    }

    // Strategy 3: Initials + last char of last word (e.g., rne)
    alias = parts.map(p => p[0]).join('') + parts[parts.length - 1].slice(-1);
    if (!existingAliases.has(alias) && alias.length < name.length) return alias;

    // Strategy 4: Component based (first 2 chars of every word)
    alias = parts.map(p => p.substring(0, 2)).join('');
    if (!existingAliases.has(alias) && alias.length < name.length) return alias;

    return null; // Failed to generate a unique short alias
}

function main() {
    console.log('Scanning skills...');
    const allSkills = getDirectories(SKILLS_DIR);
    const originalSkills = allSkills.filter(s => s.length > 3); // Assume skills > 3 chars are "original"
    const existingAliases = new Set(allSkills.filter(s => s.length <= 3)); // Assume aliases are <= 3 chars

    const mapping = [];

    console.log(`Found ${originalSkills.length} original skills.`);

    originalSkills.forEach(skillName => {
        let alias = generateShortName(skillName, existingAliases);

        if (alias) {
            existingAliases.add(alias);
            mapping.push({ original: skillName, alias: alias });

            const aliasPath = path.join(SKILLS_DIR, alias);
            const originalPath = path.join(SKILLS_DIR, skillName);

            // 1. Create directory
            if (!fs.existsSync(aliasPath)) {
                fs.mkdirSync(aliasPath);
            }

            // 2. Copy SKILL.md
            const originalSkillFile = path.join(originalPath, 'SKILL.md');
            const aliasSkillFile = path.join(aliasPath, 'SKILL.md');

            if (fs.existsSync(originalSkillFile)) {
                let content = fs.readFileSync(originalSkillFile, 'utf8');

                // Add metadata alias info (optional, helps identifying)
                // matching "name: skillname"
                content = content.replace(/^name: .+$/m, `name: ${alias}\nalias-for: ${skillName}`);

                fs.writeFileSync(aliasSkillFile, content);
            }
        } else {
            console.warn(`Could not generate unique short alias for: ${skillName}`);
        }
    });

    // Generate Documentation
    let docContent = '# Danh Sách Mapping Skills (Full)\n\n';
    docContent += '| Alias | Original Skill |\n| :--- | :--- |\n';

    // Sort by alias
    mapping.sort((a, b) => a.alias.localeCompare(b.alias));

    mapping.forEach(m => {
        docContent += `| **${m.alias}** | ${m.original} |\n`;
    });

    fs.writeFileSync(DOC_FILE, docContent);
    console.log(`Generated ${mapping.length} aliases.`);
    console.log(`Documentation written to ${DOC_FILE}`);
}

main();
