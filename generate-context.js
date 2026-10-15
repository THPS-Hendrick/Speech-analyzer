const fs = require('fs');
const path = require('path');

const websiteDir = path.join(__dirname, 'website');
const archOutputFile = path.join(__dirname, 'website-context-architecture.md');
const detailOutputFile = path.join(__dirname, 'website-context-detailed.md');

function getAllHtmlFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllHtmlFiles(filePath, fileList);
        } else if (filePath.endsWith('.html')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const htmlFiles = getAllHtmlFiles(websiteDir);

// Initialize both output strings
let archOutput = '# THPS Website Architecture Blueprint\n*Auto-generated snapshot of site schemas and hierarchy.*\n\n---\n\n';
let detailOutput = '# THPS Website Detailed Blueprint\n*Auto-generated snapshot of body text, buttons, and media alt-text.*\n\n---\n\n';

htmlFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
    
    archOutput += `## File: /${relativePath}\n\n`;
    detailOutput += `## File: /${relativePath}\n\n`;

    // --- ARCHITECTURE EXTRACTION ---
    const titleMatch = content.match(/<title>(.*?)<\/title>/is);
    if (titleMatch) archOutput += `**Title:** ${titleMatch[1].trim()}\n\n`;

    const schemaMatches = content.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis);
    let schemaCount = 1;
    for (const match of schemaMatches) {
        archOutput += `**Schema ${schemaCount}:**\n\`\`\`json\n${match[1].trim()}\n\`\`\`\n\n`;
        schemaCount++;
    }

    const headings = content.matchAll(/<(h[1-3])[^>]*>(.*?)<\/\1>/gis);
    archOutput += `**Headings:**\n`;
    let hasHeadings = false;
    for (const match of headings) {
        hasHeadings = true;
        archOutput += `- ${match[1].toUpperCase()}: ${match[2].replace(/<[^>]+>/g, '').trim()}\n`;
    }
    if (!hasHeadings) archOutput += `- None found\n`;
    archOutput += `\n---\n\n`;

    // --- DETAILED EXTRACTION ---
    // 1. Extract Body Paragraphs
    const paragraphs = content.matchAll(/<p[^>]*>(.*?)<\/p>/gis);
    detailOutput += `### Body Text:\n`;
    for (const match of paragraphs) {
        detailOutput += `- ${match[1].replace(/<[^>]+>/g, '').trim()}\n`;
    }

    // 2. Extract Interactables (Buttons/Links/Summary tags for accordions)
    const interactables = content.matchAll(/<(a|button|summary)[^>]*>(.*?)<\/\1>/gis);
    detailOutput += `\n### Interactables (Links/Buttons):\n`;
    for (const match of interactables) {
        detailOutput += `- [${match[1].toUpperCase()}] ${match[2].replace(/<[^>]+>/g, '').trim()}\n`;
    }

    // 3. Extract Image Alt Text
    const images = content.matchAll(/<img[^>]+alt="([^"]+)"[^>]*>/gis);
    detailOutput += `\n### Image Alt Text:\n`;
    for (const match of images) {
        detailOutput += `- ${match[1].trim()}\n`;
    }
    
    detailOutput += `\n---\n\n`;
});

fs.writeFileSync(archOutputFile, archOutput);
fs.writeFileSync(detailOutputFile, detailOutput);
console.log(`✅ Architecture generated at ${archOutputFile}`);
console.log(`✅ Detailed content generated at ${detailOutputFile}`);
