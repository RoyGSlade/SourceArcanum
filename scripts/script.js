// --- CONFIG ---
const API_BASE = (window.SITE_ROOT || '') + 'data/';

// --- STATE ---
let PROJECTS = [];
let POSTS = [];
let FUNDING = {};
let MANIFESTO = [
    { title: "LOCAL-FIRST = OWNERSHIP", text: "If it doesn’t run offline, you don’t truly own it. We build tools that still work when the cloud goes dark." },
    { title: "FREE FOREVER = TRUST", text: "No subscriptions. No paywalls. No “free until we pivot.” If it’s on this site, it stays free." },
    { title: "DONATIONS ARE VOTES", text: "You don’t pay for features. You fund the direction. Donations steer priority, not access." },
    { title: "NO ADS. NO SPONSORS. NO HANDLERS.", text: "I don’t sell your attention. I don’t trade your creativity for corporate approval." },
    { title: "DISCOMFORT BUILDS CAPABILITY", text: "This isn’t comfort-software. The goal is courage, competence, and action. Tools that make you stronger." },
    { title: "BUILD TO GIVE", text: "The point isn’t “win capitalism.” It’s to reduce exploitation and decentralize capability, one useful tool at a time." }
];

// --- INIT ---
async function init() {
    injectLayout();

    try {
        const [projectsRes, postsRes, fundingRes] = await Promise.all([
            fetch(`${API_BASE}projects.json`),
            fetch(`${API_BASE}posts.json`),
            fetch(`${API_BASE}funding.json`)
        ]);

        if (projectsRes.ok) PROJECTS = await projectsRes.json();
        if (postsRes.ok) POSTS = await postsRes.json();
        if (fundingRes.ok) FUNDING = await fundingRes.json();

        // Router
        const page = window.location.pathname.split('/').pop().toLowerCase();

        if (page === 'index.html' || page === '' || window.location.pathname.endsWith('/')) {
            renderHome();
        } else if (page.includes('productivity')) {
            renderCategory('productivity');
        } else if (page.includes('games')) {
            renderCategory('games');
        } else if (page.includes('finance')) {
            renderCategory('finance');
        } else if (page.includes('support')) {
            renderSupport();
        }

        bindEvents();

    } catch (err) {
        console.error("Signal Interpretation Failure:", err);
    }
}

// --- LAYOUT INJECTION ---
function injectLayout() {
    // Inject Nav
    const navContainer = document.querySelector('nav');
    if (navContainer) {
        navContainer.innerHTML = `
        <div class="container nav-inner">
            <div class="brand">
                <a href="index.html" style="display:flex; align-items:center; gap:15px; text-decoration:none; color:var(--accent-gold);">
                    <div class="brand-sigil"></div>
                    SOURCE ARCANUM
                </a>
            </div>
            <div class="nav-links">
                <a href="index.html">HOME</a>
                <a href="productivity.html">PRODUCTIVITY</a>
                <a href="games.html">GAMES</a>
                <a href="finance.html">FINANCIAL</a>
                <a href="roadmap.html">ROADMAP</a>
                <a href="support.html">SUPPORT</a>
            </div>
        </div>`;

        // Highlight active link
        const current = window.location.pathname.split('/').pop() || 'index.html';
        const links = navContainer.querySelectorAll('.nav-links a');
        links.forEach(l => {
            if (l.getAttribute('href') === current) {
                l.style.color = 'var(--accent-gold)';
                l.style.textShadow = '0 0 8px var(--accent-dim)';
            }
        });
    }

    // Inject Footer
    const footerContainer = document.querySelector('footer');
    if (footerContainer) {
        footerContainer.innerHTML = `
        <div class="container" style="padding: 4rem 0; border-top: 1px solid var(--stone-dark); margin-top: 4rem; text-align: center;">
            <div class="brand-sigil" style="margin: 0 auto 2rem auto;"></div>
            <p class="mono" style="color: var(--text-muted); font-size: 0.9rem;">SOURCE ARCANUM // EST. 2026</p>
            <p class="mono" style="color: var(--tech-cyan); font-size: 0.8rem; margin-top: 1rem;">LOCAL-FIRST. FREE FOREVER. <a href="https://ko-fi.com/democratizegm" target="_blank" style="color: var(--accent-gold); text-decoration: none; border-bottom: 1px dotted var(--accent-gold);">DONATION-STEERED</a>. NO TELEMETRY.</p>
        </div>`;
    }
}

// --- RENDERERS ---

function renderHome() {
    // 1. Featured Projects Carousel (BetterFingers, PDF Manager, Infinite Ages)
    const featuredIds = ['betterfingers', 'pdf-manager', 'infinite-ages'];
    const featured = PROJECTS.filter(p => featuredIds.includes(p.id));
    renderGrid(featured, 'featured-grid');

    // 2. Chronicles
    renderChronicles();

    // 3. Manifesto Preview (All 6 points)
    renderManifesto(6);
}

function renderChronicles() {
    const container = document.getElementById('chronicles-grid');
    if (!container) return;

    if (POSTS.length === 0) {
        container.innerHTML = `<div class="mono" style="color: var(--text-muted);">// NO LOGS FOUND</div>`;
        return;
    }

    // Top 3
    const latest = POSTS.slice(0, 3);

    container.innerHTML = latest.map(p => `
        <div class="log-entry" onclick="window.location.href='${p.url}'" style="cursor: pointer; margin-bottom: 2rem;">
            <div class="log-date mono">${p.dateISO}</div>
            <div>
                <h3 class="log-title">${p.title}</h3>
                <p class="log-excerpt">${p.excerpt}</p>
                <div class="mono" style="margin-top: 1rem; color: var(--accent-gold); font-size: 0.8rem;">READ ENTRY &rarr;</div>
            </div>
        </div>
    `).join('');
}

function renderCategory(category) {
    const filtered = PROJECTS.filter(p => p.category === category);
    renderGrid(filtered, 'project-grid');
}

function renderSupport(sortBy = 'priority') {
    const fundingDiv = document.getElementById('funding-grid');
    if (!fundingDiv || !FUNDING.buckets) return;

    let buckets = [...FUNDING.buckets];

    // Sorting Logic
    if (sortBy === 'priority') {
        buckets.sort((a, b) => a.priorityRank - b.priorityRank);
    } else if (sortBy === 'funded') {
        buckets.sort((a, b) => {
            const pctA = (a.raisedUSD / a.goalUSD);
            const pctB = (b.raisedUSD / b.goalUSD);
            return pctB - pctA; // Descending
        });
    }

    fundingDiv.innerHTML = buckets.map(b => {
        // Find votes for this bucket
        const voteData = FUNDING.votes ? FUNDING.votes.find(v => v.bucketId === b.id) : null;
        const voteCount = voteData ? voteData.totalVotes : 0;
        const percent = Math.min(100, Math.round((b.raisedUSD / b.goalUSD) * 100));

        return `
        <div class="funding-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h4 style="margin-bottom: 0.5rem; color: var(--accent-gold);">${b.title}</h4>
                <span class="mono" style="font-size: 0.8rem; color: var(--tech-cyan);">RANK: ${b.priorityRank}</span>
            </div>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">${b.description}</p>
            
            <!-- Progress Bar -->
            <div style="margin-top: 1rem; margin-bottom: 0.5rem; background: var(--bg-void); height: 6px; width: 100%; position: relative;">
                <div style="background: var(--tech-cyan); height: 100%; width: ${percent}%;"></div>
            </div>
            <div class="mono" style="font-size: 0.8rem; color: var(--text-muted); display:flex; justify-content:space-between;">
                <span>$${b.raisedUSD} / $${b.goalUSD} RAISED (${percent}%)</span>
                <span>${voteCount} VOTES</span>
            </div>

            <!-- Links -->
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                ${b.links.map(l => `
                    <a href="${l.url}" target="_blank" class="btn btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.7rem;">${l.label}</a>
                `).join('')}
            </div>
        </div>`;
    }).join('');

    // Toggle Button Logic
    const sorts = document.querySelectorAll('.sort-toggle');
    sorts.forEach(btn => {
        btn.onclick = () => {
            // Update UI
            document.querySelectorAll('.sort-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Re-render
            renderSupport(btn.dataset.sort);
        };
    });
}

function renderGrid(items, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `<div class="mono" style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem;">// NO ARTIFACTS FOUND IN THIS SECTOR</div>`;
        return;
    }

    grid.innerHTML = items.map(p => {
        // Safe check for stats/version if needed, though mostly in modal now
        const version = p.stats && p.stats.Version ? p.stats.Version : null;

        // Check for a demo link
        const demoLink = p.links ? p.links.find(l => l.type === 'demo' && l.url) : null;
        const demoBtnHtml = demoLink
            ? `<a href="${demoLink.url}" class="btn btn-primary" onclick="event.stopPropagation();" style="display:inline-block; margin-top:1rem; padding:0.6rem 1.5rem; font-size:0.75rem; text-align:center;">▶ ${demoLink.label.toUpperCase()}</a>`
            : '';

        return `
        <div class="project-card" 
             role="button" 
             tabindex="0" 
             onclick="windowModal('${p.id}')" 
             onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); windowModal('${p.id}'); }">
            <div style="height: 100%; display: flex; flex-direction: column;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1rem;">
                    <div class="project-status">${p.statusLabel || p.status.toUpperCase()}</div>
                </div>
                
                <h3 style="margin: 0; font-size: 1.4rem; line-height: 1.2; color: var(--text-main);">${p.realName}</h3>
                <div class="mono" style="font-size: 0.8rem; color: var(--accent-gold); margin-bottom: 1rem;">(Codename: ${p.codename})</div>
                
                <p style="margin-bottom: 1.5rem; flex-grow: 1;">${p.plainDescription}</p>
                
                ${demoBtnHtml}
                
                <div class="click-prompt" style="margin-top: auto;">
                    [ ACCESS DOSSIER ] &rarr;
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function renderManifesto(limit = 99) {
    const container = document.getElementById('manifesto-grid');
    if (!container) return;

    container.innerHTML = MANIFESTO.slice(0, limit).map(m => `
        <div class="manifesto-point">
            <h4>// ${m.title}</h4>
            <p>${m.text}</p>
        </div>
    `).join('');
}

// --- MODAL LOGIC ---
let lastFocusedElement;

function bindEvents() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Tab') handleTab(e);
    });

    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    window.openModal = openModal;
    window.closeModal = closeModal;
    window.windowModal = openModal; // Alias for HTML usage
}

function handleTab(e) {
    const overlay = document.getElementById('overlay');
    if (!overlay || !overlay.classList.contains('active')) return;

    const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

function openModal(projectId) {
    lastFocusedElement = document.activeElement;

    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    // Populate Headers
    setText('modal-title', project.realName);
    setText('modal-status', `STATUS: ${project.statusLabel}`);

    // Populate Body
    const descEl = document.getElementById('modal-desc');
    if (descEl) {
        let html = `
            <div style="margin-bottom: 2rem;">
                <p class="reading-text" style="font-weight: 500; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">
                    ${project.plainDescription}
                </p>
                <p class="mono" style="color: var(--text-muted); font-style: italic; font-size: 0.9rem; border-left: 2px solid var(--accent-gold); padding-left: 1rem;">
                    "${project.flavorDescription}"
                </p>
            </div>

            <div class="divider"></div>
            
            <div class="reading-text" style="margin-bottom: 2rem;">
                ${project.fullDescription.map(para => `<p>${para}</p>`).join('')}
            </div>

            <div style="margin-bottom: 2rem;">
                <h4 class="mono" style="color: var(--accent-gold); margin-bottom: 1rem;">// FLAGSHIP CAPABILITIES</h4>
                <ul style="list-style: none; padding: 0;">
                    ${project.flagshipFeatures.map(f => {
            const parts = f.split('::');
            const title = parts[0];
            const text = parts[1] || '';
            return `<li style="margin-bottom: 1rem;">
                             <strong style="color: var(--tech-cyan);">${title}</strong>
                             <span style="color: var(--text-muted);"> ${text}</span>
                         </li>`;
        }).join('')}
                </ul>
            </div>

            <div style="margin-bottom: 2rem;">
                 <h4 class="mono" style="color: var(--text-muted); margin-bottom: 1rem;">// STANDARD FEATURES</h4>
                 <ul style="padding-left: 1.5rem; color: var(--text-main);">
                     ${project.features.map(f => `<li>${f}</li>`).join('')}
                 </ul>
            </div>
        `;

        descEl.innerHTML = html;
    }

    // Trust Facts (Sidebar)
    const statsEl = document.getElementById('modal-stats');
    if (statsEl && project.trustFacts) {
        const tf = project.trustFacts;
        statsEl.innerHTML = `
            <div class="d-stat-row"><span class="d-stat-label">OFFLINE?</span><span class="d-stat-val" style="color:${tf.runsOffline ? 'var(--tech-cyan)' : 'var(--text-muted)'}">${tf.runsOffline ? 'YES' : 'NO'}</span></div>
            <div class="d-stat-row"><span class="d-stat-label">NET REQ?</span><span class="d-stat-val">${tf.requiresInternet}</span></div>
            <div class="d-stat-row"><span class="d-stat-label">TELEMETRY</span><span class="d-stat-val">${tf.telemetry}</span></div>
            <div class="d-stat-row"><span class="d-stat-label">ACCOUNTS</span><span class="d-stat-val">${tf.accounts}</span></div>
            <div class="d-stat-row"><span class="d-stat-label">DATA LOC</span><span class="d-stat-val">${tf.dataStoredWhere}</span></div>
        `;
    }

    // Links (Sidebar)
    const linksEl = document.getElementById('modal-links');
    if (linksEl) {
        linksEl.innerHTML = project.links.length > 0
            ? project.links.filter(l => l.url).map(l => `
                <a href="${l.url}" target="_blank" class="btn btn-primary" style="text-align:center; font-size: 0.8rem;">${l.label.toUpperCase()}</a>
            `).join('')
            : `<div class="mono" style="color: var(--text-muted); font-size: 0.8rem;">// ACCESS RESTRICTED</div>`;
    }

    // Roadmap
    const roadmapEl = document.getElementById('modal-roadmap');
    if (roadmapEl && project.roadmap) {
        let html = '';
        if (project.roadmap.nearTerm && project.roadmap.nearTerm.length > 0) {
            html += `<h5 class="mono" style="color: var(--tech-cyan); margin-top: 1rem;">NEAR TERM</h5><ul style="font-size: 0.9rem; padding-left: 1.2rem;">${project.roadmap.nearTerm.map(t => `<li>${t}</li>`).join('')}</ul>`;
        }
        if (project.roadmap.midTerm && project.roadmap.midTerm.length > 0) {
            html += `<h5 class="mono" style="color: var(--accent-gold); margin-top: 1rem;">MID TERM</h5><ul style="font-size: 0.9rem; padding-left: 1.2rem;">${project.roadmap.midTerm.map(t => `<li>${t}</li>`).join('')}</ul>`;
        }
        if (project.roadmap.longTerm) {
            html += `<h5 class="mono" style="color: var(--text-muted); margin-top: 1rem;">LONG TERM</h5><p style="font-size: 0.9rem; color: var(--text-muted);">${project.roadmap.longTerm}</p>`;
        }
        roadmapEl.innerHTML = html;
    }

    // Show
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'modal-title');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const closeBtn = overlay.querySelector('.close-btn');
        if (closeBtn) closeBtn.focus();
    }
}

function closeModal() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scroll

        // Remove Attributes
        overlay.removeAttribute('role');
        overlay.removeAttribute('aria-modal');
        overlay.removeAttribute('aria-labelledby');
    }

    // Restore Focus
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// Start
init();