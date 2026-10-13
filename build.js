const fs = require('fs');
const path = require('path');

const websiteDir = path.join(__dirname, 'website');
const headerPath = path.join(websiteDir, 'partials', 'header.html');
const footerPath = path.join(websiteDir, 'partials', 'footer.html');

// Read the single-source-of-truth files
const headerContent = fs.readFileSync(headerPath, 'utf8');
const footerContent = fs.readFileSync(footerPath, 'utf8');

// Recursively find and update all HTML files
function stitchPages(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        // Ignore the partials folder itself, dive into other folders (like /members)
        if (stat.isDirectory() && file !== 'partials') {
            stitchPages(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            if (content.includes('<!-- INJECT_HEADER -->')) {
                content = content.replace('<!-- INJECT_HEADER -->', headerContent);
                modified = true;
            }
            if (content.includes('<!-- INJECT_FOOTER -->')) {
                content = content.replace('<!-- INJECT_FOOTER -->', footerContent);
                modified = true;
            }
            
            // Save the fully stitched file back to the folder
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Successfully stitched: ${file}`);
            }
        }
    }
}

stitchPages(websiteDir);
console.log('Build complete: All pages are stitched and ready for SEO crawling.');
