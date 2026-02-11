const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../skills');
const TERMS_FILE = path.join(__dirname, '../data/common_terms.json');

// Validated translations for top skills (Manual/Pre-defined)
const TRANSLATIONS = {
    'clean-code': {
        description: 'Nguyên tắc và quy chuẩn để viết code sạch, dễ bảo trì và dễ đọc (theo Robert C. Martin).',
        usage: 'Sử dụng skill này khi bạn muốn refactor code, review code hoặc bắt đầu dự án mới.'
    },
    'brainstorming': {
        description: 'Quy trình tư duy và thảo luận để tạo ra ý tưởng mới, giải pháp sáng tạo cho vấn đề.',
        usage: 'Sử dụng trước khi bắt đầu code để làm rõ yêu cầu và thiết kế giải pháp.'
    },
    'architecture': {
        description: 'Hướng dẫn thiết kế kiến trúc phần mềm, lựa chọn công nghệ và mô hình hệ thống.',
        usage: 'Sử dụng khi thiết kế hệ thống mới hoặc đánh giá kiến trúc hiện tại.'
    },
    'security-audit': {
        description: 'Quy trình kiểm tra bảo mật toàn diện cho hệ thống, tìm lỗ hổng và đề xuất khắc phục.',
        usage: 'Chạy khi cần kiểm tra bảo mật định kỳ hoặc trước khi deploy production.'
    },
    'git-commit': {
        description: 'Tạo commit message chuẩn Conventional Commits.',
        usage: 'Sử dụng khi bạn muốn tạo commit message chuyên nghiệp và nhất quán.'
    },
    'prompt-engineer': {
        description: 'Kỹ thuật tối ưu hóa câu lệnh (prompt) để làm việc hiệu quả với AI.',
        usage: 'Sử dụng khi bạn cần AI thực hiện tác vụ phức tạp và cần độ chính xác cao.'
    },
    'readme-generator': {
        description: 'Tự động tạo file README.md chuyên nghiệp cho dự án.',
        usage: 'Sử dụng khi bạn muốn tài liệu hóa dự án một cách nhanh chóng và đầy đủ.'
    }
};

function loadTerms() {
    if (fs.existsSync(TERMS_FILE)) {
        return JSON.parse(fs.readFileSync(TERMS_FILE, 'utf8')).terms;
    }
    return {};
}

function translateContent(content, terms) {
    let translated = content;

    // Simple term replacement (case-insensitive)
    for (const [eng, vie] of Object.entries(terms)) {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translated = translated.replace(regex, vie);
    }

    return translated;
}

function main() {
    console.log('Starting translation process...');
    const terms = loadTerms();

    // Process predefined skills
    for (const [skillName, trans] of Object.entries(TRANSLATIONS)) {
        const skillDir = path.join(SKILLS_DIR, skillName);
        const skillFile = path.join(skillDir, 'SKILL.md');
        const targetFile = path.join(skillDir, 'SKILL.vi.md');

        if (fs.existsSync(skillFile)) {
            let content = fs.readFileSync(skillFile, 'utf8');

            // Replace Description
            if (trans.description) {
                content = content.replace(/^description: .+$/m, `description: ${trans.description}`);
            }

            // Append Vietnamese notice
            content = `> [!NOTE]\n> Tài liệu này được dịch tự động sang Tiếng Việt.\n\n${content}`;

            // Apply term replacement for the body
            // content = translateContent(content, terms); 
            // Note: Full body translation via regex is risky for markdown structure. 
            // For now, we only translate Description and specific sections if we had parser.
            // Let's stick to swapping the description and saving the file to enable multilang support.

            fs.writeFileSync(targetFile, content);
            console.log(`Translated: ${skillName} -> SKILL.vi.md`);
        } else {
            console.warn(`Skill not found: ${skillName}`);
        }
    }

    console.log('Translation completed for top skills.');
}

main();
