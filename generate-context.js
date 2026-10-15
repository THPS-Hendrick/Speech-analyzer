const fs = require('fs');
const path = require('path');

// Target the 'website' directory in your repo
const websiteDir = path.join(__dirname, 'website');
const outputFile = path.join(__dirname, 'website-context.md');

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
let contextOutput = '# THPS Website Context Blueprint\n\n';
contextOutput += `*Auto-generated snapshot of site architecture, schemas, and content hierarchy.*\n\n---\n\n`;

htmlFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
    
    contextOutput += `## File: /${relativePath}\n\n`;

    // 1. Extract Title
    const titleMatch = content.match(/<title>(.*?)<\/title>/is);
    if (titleMatch) contextOutput += `**Title:** ${titleMatch[1].trim()}\n\n`;

    // 2. Extract JSON-LD Schemas
    const schemaMatches = content.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis);
    let schemaCount = 1;
    for (const match of schemaMatches) {
        contextOutput += `**Schema ${schemaCount}:**\n\`\`\`json\n${match[1].trim()}\n\`\`\`\n\n`;
        schemaCount++;
    }

    // 3. Extract H1, H2, H3 Headings
    const headings = content.matchAll(/<(h[1-3])[^>]*>(.*?)<\/\1>/gis);
    contextOutput += `**Headings:**\n`;
    let hasHeadings = false;
    for (const match of headings) {
        hasHeadings = true;
        const cleanText = match[2].replace(/<[^>]+>/g, '').trim();
        contextOutput += `- ${match[1].toUpperCase()}: ${cleanText}\n`;
    }
    if (!hasHeadings) contextOutput += `- None found\n`;
    
    contextOutput += `\n---\n\n`;
});

fs.writeFileSync(outputFile, contextOutput);
console.log(`✅ Blueprint successfully generated at ${outputFile}`);
