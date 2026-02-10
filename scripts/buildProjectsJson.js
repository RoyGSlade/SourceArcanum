const fs = require('fs');
const path = require('path');

const PROJECT_CARDS_DIR = path.join(__dirname, '../project_cards');
const PROJECTS_JSON_PATH = path.join(__dirname, '../data/projects.json');

// Helper to clean text
const clean = (str) => str ? str.trim() : '';

// Normalization maps
const CATEGORY_MAP = {
    'productivity': 'productivity',
    'games': 'games',
    'financial': 'finance',
    'finance': 'finance',
    'tool': 'tools',
    'tools': 'tools',
    'games / tools': 'tools'
};

function parseMarkdown(filename, content) {
    const slug = path.basename(filename, '.md');
    const project = {
        id: slug,
        realName: '',
        codename: '',
        category: '',
        status: '',
        statusLabel: '',
        tagline: '',
        plainDescription: '',
        flavorDescription: '',
        fullDescription: [],
        features: [],
        flagshipFeatures: [],
        roadmap: {
            nearTerm: [],
            midTerm: [],
            longTerm: ''
        },
        trustFacts: {
            runsOffline: false,
            requiresInternet: '',
            telemetry: '',
            accounts: '',
            dataStoredWhere: ''
        },
        links: []
    };

    // Regex patterns - improved for flexibility
    const patterns = {
        realName: /\*\*Real Name:\*\*\s*(.+)/,
        codename: /\*\*Codename:\*\*\s*(.+)/,
        category: /\*\*Category:\*\*\s*(.+)/,
        status: /\*\*Status \(Machine\):\*\*\s*(.+)/,
        statusLabel: /\*\*Status Label \(Display\):\*\*\s*(.+)/,
        tagline: /\*\*Short Tagline \(7-12 words\):\*\*\s*\n(.+)/,
        plainDesc: /\*\*Plain Description \(1 sentence\):\*\*\s*\n(.+)/,
        flavorDesc: /\*\*Flavor Description \(1 sentence, myth tone\):\*\*\s*\n(.+)/,
        fullDesc: /## Full Description\s*\n\s*\*\*1-2 Paragraphs:\*\*\s*\n\s*\(.*?\)\s*\n([\s\S]*?)\n## Feature List/,
        featureList: /## Feature List\s*\n\s*\*\*6-12 Bullet Features:\*\*\s*\n([\s\S]*?)\n\*\*3 [“"”']?Flagship[“"”']? Features:\*\*/,
        flagship: /\*\*3 [“"”']?Flagship[“"”']? Features:\*\*\s*\n([\s\S]*?)\n## Roadmap/,
        roadmapNear: /\*\*Next 3 Features \(Near-term\):\*\*\s*\n([\s\S]*?)\n\*\*Next 3 Features/,
        roadmapMid: /\*\*Next 3 Features \(Mid-term\):\*\*\s*\n([\s\S]*?)\n\*\*Long-term Direction/,
        roadmapLong: /\*\*Long-term Direction \(1 paragraph\):\*\*\s*\n([\s\S]*?)\n## Trust Facts/,
        trustFacts: /## Trust Facts\s*\n([\s\S]*?)\n## Downloads/,
        links: /## Downloads \+ Links([\s\S]*)/
    };

    // Extract Basic Info
    const match = (regex) => {
        const m = content.match(regex);
        return m ? clean(m[1]) : '';
    };

    project.realName = match(patterns.realName);
    project.codename = match(patterns.codename);
    project.category = match(patterns.category).toLowerCase();
    project.status = match(patterns.status).toLowerCase();
    project.statusLabel = match(patterns.statusLabel);

    // Fallback for status
    if (!project.status) {
        const oldStatusObj = content.match(/\*\*Status:\*\*\s*(.+)/);
        if (oldStatusObj) {
            project.status = 'prototype';
            project.statusLabel = clean(oldStatusObj[1]);
        }
    }

    project.tagline = match(patterns.tagline);
    project.plainDescription = match(patterns.plainDesc);
    project.flavorDescription = match(patterns.flavorDesc);

    // FIX: pdf-manager special case
    if (slug === 'pdf-manager') {
        project.realName = 'PDF Editor/Manager';
        project.codename = 'Codex Forge';
    }

    // Normalization
    if (CATEGORY_MAP[project.category]) {
        project.category = CATEGORY_MAP[project.category];
    }

    // Full Description
    const fullDescRaw = match(patterns.fullDesc);
    if (fullDescRaw) {
        project.fullDescription = fullDescRaw.split(/\r?\n\r?\n/).map(clean).filter(p => p.length > 0);
    }

    // Features
    const featuresRaw = match(patterns.featureList);
    if (featuresRaw) {
        project.features = featuresRaw.split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('- '))
            .map(l => l.replace(/^- /, '').replace(/^\*\*(.*?)\*\*:? /, '$1: ').trim());
    }

    // Flagship Features
    const flagshipRaw = match(patterns.flagship);
    if (flagshipRaw) {
        project.flagshipFeatures = flagshipRaw.split('\n')
            .map(l => l.trim())
            .filter(l => /^\d+\./.test(l))
            .map(l => l.replace(/^\d+\.\s*/, '').replace(/^\*\*(.*?)\*\*:? /, '$1: ').trim());
    }

    // Roadmap
    const parseRoadmapList = (raw) => {
        return raw ? raw.split('\n')
            .map(l => l.trim())
            .filter(l => /^\d+\./.test(l))
            .map(l => l.replace(/^\d+\.\s*/, '').replace(/^\*\*(.*?)\*\*:? /, '$1: ').trim()) : [];
    };
    project.roadmap.nearTerm = parseRoadmapList(match(patterns.roadmapNear));
    project.roadmap.midTerm = parseRoadmapList(match(patterns.roadmapMid));
    project.roadmap.longTerm = match(patterns.roadmapLong);

    // Trust Facts
    const trustRaw = match(patterns.trustFacts);
    if (trustRaw) {
        const cleanVal = (val) => val.replace(/^\.?\s*\*\* ?/, '').trim();
        trustRaw.split('\n').forEach(line => {
            if (line.includes('runs offline')) project.trustFacts.runsOffline = line.toLowerCase().includes('yes');
            if (line.includes('Requires internet')) project.trustFacts.requiresInternet = cleanVal(line.split(':')[1] || '');
            if (line.includes('Telemetry')) project.trustFacts.telemetry = cleanVal(line.split(':')[1] || '');
            if (line.includes('Accounts')) project.trustFacts.accounts = cleanVal(line.split(':')[1] || '');
            if (line.includes('Data stored where')) project.trustFacts.dataStoredWhere = cleanVal(line.split(':')[1] || '');
        });
    }

    // Links
    const linksRaw = match(patterns.links);
    if (linksRaw) {
        linksRaw.split('\n').filter(l => l.trim().startsWith('-')).forEach(line => {
            // - **GitHub repo link:** [Link] OR - **GitHub repo link**: [Link]
            // Capture everything between ** and ** as label, then everything after
            const linkMatch = line.match(/^- \*\*(.*?)\*\*(.*)/);
            if (linkMatch) {
                const labelRaw = linkMatch[1].replace(/:$/, '').trim(); // Remove trailing colon if inside bold
                let urlJs = linkMatch[2].replace(/^:/, '').trim(); // Remove leading colon if outside bold

                // Clean URL
                urlJs = urlJs.replace(/^\[Link\]$/i, '').replace(/^\[(.*?)\]$/, '$1').trim();
                if (urlJs.toLowerCase() === '[link]') urlJs = '';

                let type = 'other';
                let label = 'Link';

                if (labelRaw.toLowerCase().includes('repo')) { type = 'github'; label = 'GitHub'; }
                else if (labelRaw.toLowerCase().includes('release')) { type = 'download'; label = 'Releases'; }
                else if (labelRaw.toLowerCase().includes('docs')) { type = 'docs'; label = 'Docs'; }
                else if (labelRaw.toLowerCase().includes('demo')) { type = 'video'; label = 'Demo'; }

                // Add link even if URL is empty (placeholder), per user schema
                project.links.push({ label, url: urlJs, type });
            }
        });
    }

    // Validation
    const required = ['id', 'realName', 'codename', 'category', 'status', 'tagline', 'plainDescription'];
    const missing = required.filter(f => !project[f]);
    if (missing.length > 0) {
        console.error(`ERROR: ${slug} missing fields: ${missing.join(', ')}`);
        process.exit(1);
    }

    return project;
}

const files = fs.readdirSync(PROJECT_CARDS_DIR).filter(f => f.endsWith('.md'));
const projects = [];

console.log(`Found ${files.length} project cards.`);

files.forEach(file => {
    const content = fs.readFileSync(path.join(PROJECT_CARDS_DIR, file), 'utf-8');
    try {
        const p = parseMarkdown(file, content);
        projects.push(p);
        console.log(`Processed ${p.id}`);
    } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
        process.exit(1);
    }
});

fs.writeFileSync(PROJECTS_JSON_PATH, JSON.stringify(projects, null, 2));
console.log(`Successfully wrote ${projects.length} projects to ${PROJECTS_JSON_PATH}`);
