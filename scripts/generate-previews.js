// scripts/generate-previews.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
// Liste tes applications ici
const appsToRecord = [
    { url: 'https://news.ycombinator.com', filename: 'hacker-news-demo' }, // Exemple
    { url: 'https://astro.build', filename: 'astro-demo' }, // Exemple
    // Ajoute tes vraies apps ici
    // { url: 'https://mon-app-vibecodee.com', filename: 'mon-app' },
    { url: 'https://kanban.philapps.com', filename: 'Kanban' },
    { url: 'https://journal.philapps.com', filename: 'Journal' },
];

const OUTPUT_DIR = path.join(__dirname, '../public/portfolio');
const VIDEO_DURATION_MS = 5000; // 5 secondes de vidéo par app
// ---------------------

// S'assurer que le dossier de sortie existe
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
    console.log('📼 Starting Vibecoding Preview Generator (Garage Edition)...');
    
    // Lancement du navigateur (chrome headless)
    const browser = await chromium.launch();
    
    for (const app of appsToRecord) {
        console.log(`> Processing: ${app.url}`);
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 }, // Résolution desktop standard
            recordVideo: {
                dir: OUTPUT_DIR,
                size: { width: 1280, height: 800 }
            }
        });

        const page = await context.newPage();

        try {
            console.log('  - Navigating & Waiting for load...');
            await page.goto(app.url, { waitUntil: 'networkidle' });

            console.log('  - Scrolling down vibe...');
            // Simulation d'un scroll humain lent vers le bas
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        // On s'arrête si on est en bas ou après un certain temps (géré par le sleep nodejs plus bas)
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });

            // On laisse tourner l'enregistrement pendant la durée définie
            console.log(`  - Recording for ${VIDEO_DURATION_MS/1000}s...`);
            await page.waitForTimeout(VIDEO_DURATION_MS);

        } catch (e) {
            console.error(`ERROR recording ${app.url}: ${e.message}`);
        } finally {
            // Fermer le contexte arrête l'enregistrement et sauvegarde le fichier
            await context.close();
            
            // Playwright génère des noms aléatoires pour les vidéos.
            // On doit trouver le dernier fichier créé et le renommer.
            const files = fs.readdirSync(OUTPUT_DIR)
                .filter(f => f.endsWith('.webm')) // Playwright enregistre en .webm par défaut (très bien pour le web)
                .sort((a, b) => {
                     return fs.statSync(path.join(OUTPUT_DIR, b)).mtime.getTime() - 
                            fs.statSync(path.join(OUTPUT_DIR, a)).mtime.getTime();
                });

            if (files.length > 0) {
                const latestVideo = files[0];
                const oldPath = path.join(OUTPUT_DIR, latestVideo);
                // On renomme en .mp4 juste pour la compatibilité habituelle, mais c'est du WebM en réalité. 
                // Idéalement, garde .webm dans PortfolioSection.astro si tu ne veux pas convertir.
                // Changeons l'extension cible en .webm pour être propre.
                const newPath = path.join(OUTPUT_DIR, `${app.filename}.webm`);
                
                // Supprimer l'ancien fichier s'il existe déjà
                if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
                fs.renameSync(oldPath, newPath);
                console.log(`  ✅ Saved as: public/portfolio/${app.filename}.webm`);
            }
        }
    }

    await browser.close();
    console.log('🎉 All previews generated! Time to deploy.');
})();