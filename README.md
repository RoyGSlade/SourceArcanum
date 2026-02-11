# SOURCE ARCANUM

“Hoard nothing. Reject reliance. Build sovereignty.”

Source Arcanum is a local-first umbrella: a collection of free, privacy-respecting tools designed to keep working offline, without subscriptions, accounts, or data harvesting.

This repository hosts the **static GitHub Pages site** that acts as:

*   a manifesto + trust anchor
*   a project library
*   a proof-of-work archive (Chronicles)
*   a distribution hub (downloads, docs, updates)
*   a donation-steered roadmap board

## What This Is (Plain Language)

Most modern software is a rental agreement.

Source Arcanum exists to build the opposite: tools you can run on your machine, keep forever, and trust not to change terms later.

*   No subscriptions
*   No telemetry
*   No accounts
*   No cloud dependency
*   No “free until we pivot”

## The Pact (Core Philosophy)

*   **Local-first = ownership**
    If it can’t run offline, you don’t truly own it.

*   **Free forever = trust**
    No paywalls. No feature gating. No bait-and-switch.

*   **Donations are votes**
    Donations steer priority, not access.

*   **No ads. No sponsors. No handlers.**
    The mission stays independent.

*   **Discomfort → growth**
    The goal is capability, courage, and forward motion.

*   **Build to give**
    Decentralize tools that improve real lives.

## Repository Overview

This is a static site built with vanilla HTML/CSS/JS.

No build step is required for the core site. GitHub Actions is used for validation and deployment.

### Key paths

*   `/data/`
    The site’s database (projects, posts, funding).

*   `/scripts/`
    The renderer and UI logic (grids, navigation, dossier modal).

*   `/posts/`
    Static Chronicle entries (proof-of-work).

*   `/docs/` (optional / if enabled)
    Documentation for each project.

*   `index.html`
    The entry point for GitHub Pages.

## Data Model

### `data/projects.json`

Defines every project shown on the site.

Each project uses:
*   Real Name (primary)
*   Codename (secondary flavor)
*   Status + category
*   Features, roadmap, trust facts, and links

### `data/posts.json`

Defines the Chronicles feed.

Posts can optionally link to a project ID for changelog-style filtering.

### `data/funding.json`

Defines the funding board / donation steering display.

**Important:** Funding data is intentionally stored as static JSON.
No API keys. No third-party live calls. No hidden dependencies.

## Editing the Site

### Add a project

1.  Open `data/projects.json`
2.  Add a new object using the existing schema
3.  Commit to main

The site will update automatically.

### Add a Chronicle post

1.  Create a new HTML file in `/posts/`
2.  Add an entry to `data/posts.json`:

```json
{
  "id": "2026-new-post",
  "dateISO": "2026-03-01",
  "title": "New Post Title",
  "excerpt": "Short summary...",
  "url": "posts/new-post.html",
  "projectId": "linked-project-id"
}
```

### Update the funding board

Funding is stored in:

`data/funding.json`

If a scheduled workflow exists, it may update `lastUpdatedISO` automatically, but the values are still controlled in-repo.

## Local Preview

Use any static server.

Example (Python):

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Deployment

The site deploys via GitHub Pages.

*   **Workflow:** `.github/workflows/pages.yml`
*   **Trigger:** push to main

Typical deploy steps:
1.  Validate JSON data (`scripts/validateData.js`)
2.  Upload the site artifact
3.  Deploy to GitHub Pages

### Validation

Run the data validator locally:

```bash
node scripts/validateData.js
```

## License

This repo contains the Source Arcanum site and data.

Project repos linked from this site may have their own licenses.
Check each project for details.
