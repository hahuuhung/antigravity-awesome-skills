const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../skills');

// Helper to get directories
function getDirectories(src) {
    return fs.readdirSync(src).filter(file => {
        return fs.statSync(path.join(src, file)).isDirectory();
    });
}

// Function to calculate relevance score
function calculateScore(skill, term) {
    let score = 0;
    term = term.toLowerCase();

    const name = skill.name.toLowerCase();
    const description = (skill.description || '').toLowerCase();
    const tags = (skill.tags || []).map(t => t.toLowerCase());
    const alias = skill.alias ? skill.alias.toLowerCase() : '';

    // Exact alias match (highest priority)
    if (alias === term) score += 100;

    // Exact name match
    if (name === term) score += 80;

    // Partial name match
    if (name.includes(term)) score += 50;

    // Tag match
    if (tags.some(t => t === term)) score += 40;
    if (tags.some(t => t.includes(term))) score += 20;

    // Description match
    if (description.includes(term)) score += 10;

    return score;
}

function main() {
    const args = process.argv.slice(2);
    const searchTerm = args.join(' ');

    if (!searchTerm) {
        console.log('Usage: node scripts/search_skills.js <search term>');
        process.exit(1);
    }

    console.log(`Searching for "${searchTerm}"...`);

    const allSkillsDirs = getDirectories(SKILLS_DIR);
    const skillsData = [];

    allSkillsDirs.forEach(dir => {
        const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
            const content = fs.readFileSync(skillPath, 'utf8');

            // Parse basic metadata (naive parsing)
            const nameMatch = content.match(/^name: (.+)$/m);
            const descMatch = content.match(/^description: (.+)$/m);
            // Tags might be handled differently in different files, simplistic approach here
            // Assuming headers or some other structure if strictly YAML frontmatter isn't used consistently.
            // But let's try to extract from text for now if YAML isn't strict.

            const name = nameMatch ? nameMatch[1].trim() : dir;
            const description = descMatch ? descMatch[1].trim() : '';

            // Check if it's an alias
            const isAlias = dir.length <= 4; // Simple heuristic
            const aliasForMatch = content.match(/^alias-for: (.+)$/m);
            const original = aliasForMatch ? aliasForMatch[1].trim() : null;

            skillsData.push({
                dir: dir,
                name: name,
                description: description,
                isAlias: isAlias,
                original: original,
                tags: [] // Tags implementations vary, keeping simple for now
            });
        }
    });

    const results = skillsData.map(skill => {
        const score = calculateScore(skill, searchTerm);
        return { ...skill, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    if (results.length === 0) {
        console.log('No matching skills found.');
        return;
    }

    console.log('\nTop Results:');
    console.table(results.slice(0, 10).map(r => ({
        Alias: r.isAlias ? r.dir : (r.original ? 'N/A' : 'See mapping'),
        Name: r.name,
        Score: r.score,
        Description: r.description.substring(0, 50) + (r.description.length > 50 ? '...' : '')
    })));
}

main();
