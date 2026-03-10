// scripts/generate-previews.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
const apps = [
    { 
        title: "Kanban Vibecoded", 
        desc: "An intuitive Kanban-style task management application in a retro computer (Neo-brutalism) style, designed to organize your workload with a clear separation between professional and personal life.", 
        url: 'https://kanban.philapps.com', 
        filename: 'Kanban' 
    },
    { 
        title: "Journal Vibecoded", 
        desc: "Journaling app for daily routine. the app uses a 4 sections method to structure your journaling and aims to provide insights through AI.", 
        url: 'https://journal.philapps.com', 
        filename: 'Journal' 
    },
    { 
        title: "Ink Gateway", 
        desc: "Collaborative Human-AI framework for writing books and novels. The agent runs writing sessions autonomously on any schedule, while the human review, author and instruct", 
        url: 'https://ink-gateway.philapps.com', 
        filename: 'InkGateway' 
    },
    { 
        title: "Le Comptoir", 
        desc: "The finest of French craftsmanship, brought directly to Austria", 
        url: 'https://drops.philapps.com/', 
        filename: 'LeComptoir' 
    },
    { 
        title: "The Watcher", 
        desc: "Automated tech intelligence feed, running 24/7. Every article here was discovered, parsed, and surfaced by 🦞 OpenClaw", 
        url: 'https://philapps.com/watcher', 
        filename: 'TheWatcher' 
    },
];

const OUTPUT_DIR = path.join(__dirname, '../public/portfolio');
const DATA_FILE = path.join(__dirname, '../src/data/portfolio.json');
// ---------------------

if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const DATA_DIR = path.dirname(DATA_FILE);
if (!fs.existsSync(DATA_DIR)){
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

(async () => {
    console.log('📸 Starting Static Preview Generator...');
    const browser = await chromium.launch();
    const portfolioData = [];
    
    for (const app of apps) {
        console.log(`> Processing: ${app.url}`);
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();

        try {
            await page.goto(app.url, { waitUntil: 'networkidle' });
            
            // Wait for animations to settle and fonts to load
            await page.waitForTimeout(2000);
            await page.evaluate(() => document.fonts.ready);
            
            const imageFilename = `${app.filename}.jpg`;
            const imagePath = path.join(OUTPUT_DIR, imageFilename);
            
            console.log(`  - Capturing screenshot: ${imageFilename}`);
            await page.screenshot({ path: imagePath, quality: 80 });

            portfolioData.push({
                ...app,
                image: `/portfolio/${imageFilename}`
            });

        } catch (e) {
            console.error(`  ❌ ERROR processing ${app.url}: ${e.message}`);
        } finally {
            await context.close();
        }
    }

    // Sauvegarder les métadonnées pour Astro
    fs.writeFileSync(DATA_FILE, JSON.stringify(portfolioData, null, 2));
    console.log(`✅ Data saved to ${DATA_FILE}`);

    await browser.close();
    console.log('🎉 Done.');
})();