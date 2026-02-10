const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

function loadJSON(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing file: ${filename}`);
        process.exit(1);
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`❌ Invalid JSON in ${filename}:`, e.message);
        process.exit(1);
    }
}

function validateProjects(projects) {
    console.log(`P: Validating ${projects.length} projects...`);
    const seenIds = new Set();
    let errors = 0;

    projects.forEach((p, i) => {
        if (!p.id) { console.error(`  [${i}] Missing 'id'`); errors++; }
        if (seenIds.has(p.id)) { console.error(`  [${i}] Duplicate id: ${p.id}`); errors++; }
        seenIds.add(p.id);

        if (!p.realName) { console.error(`  [${p.id || i}] Missing 'realName'`); errors++; }
        if (!p.status) { console.error(`  [${p.id || i}] Missing 'status'`); errors++; }
        if (typeof p.featured !== 'boolean') { console.error(`  [${p.id || i}] 'featured' must be boolean`); errors++; }
    });

    return { errors, ids: seenIds };
}

function validatePosts(posts, projectIds) {
    console.log(`P: Validating ${posts.length} posts...`);
    let errors = 0;

    posts.forEach((p, i) => {
        if (!p.id) { console.error(`  [${i}] Missing 'id'`); errors++; }
        if (!p.title) { console.error(`  [${p.id || i}] Missing 'title'`); errors++; }
        if (!p.url) { console.error(`  [${p.id || i}] Missing 'url'`); errors++; }

        // Validate projectId link if present
        if (p.projectId && !projectIds.has(p.projectId)) {
            console.warn(`  [${p.id}] WARNING: projectId '${p.projectId}' not found in projects.json`);
            // Not a hard error, maybe the project is archived/hidden, but good to know
        }
    });

    return errors;
}

function validateFunding(funding) {
    console.log(`P: Validating funding...`);
    let errors = 0;

    if (!funding.buckets || !Array.isArray(funding.buckets)) {
        console.error(`  Missing 'buckets' array`);
        return 1;
    }

    funding.buckets.forEach((b, i) => {
        if (!b.id) { console.error(`  Bucket [${i}] missing 'id'`); errors++; }
        if (!b.title) { console.error(`  Bucket [${b.id || i}] missing 'title'`); errors++; }
        if (typeof b.goalUSD !== 'number') { console.error(`  Bucket [${b.id || i}] 'goalUSD' is failing type check`); errors++; }
    });

    return errors;
}

// MAIN
console.log("--- STARTING VALIDATION ---");
const projects = loadJSON('projects.json');
const posts = loadJSON('posts.json');
const funding = loadJSON('funding.json');

const projResult = validateProjects(projects);
const postErrors = validatePosts(posts, projResult.ids);
const fundErrors = validateFunding(funding);

const totalErrors = projResult.errors + postErrors + fundErrors;

if (totalErrors > 0) {
    console.error(`\n❌ Validation FAILED with ${totalErrors} errors.`);
    process.exit(1);
} else {
    console.log("\n✅ All data files valid.");
    process.exit(0);
}
