# SOURCE ARCANUM

> "Hoard nothing. Reject reliance. Build sovereignty."

Source Arcanum is a collection of local-first, privacy-focused tools designed for the offline era. This repository hosts the static site that serves as the distribution hub and manifesto for the project.

## Philosophy

- **The Cave**: We build in the dark, for clarity.
- **Local First**: If it can't run offline, it's not yours.
- **Steering**: We don't take VC money. We don't run ads. Users vote on the roadmap via donations.

## Architecture

This is a vanilla HTML/CSS/JS site. No build steps required for the static pages, but we use GitHub Actions for validation and deployment.

- `/data/*.json`: The database. All projects, posts, and funding stats live here.
- `/scripts/script.js`: The renderer. Injects navigation, renders grids, and handles the modal logic.
- `/posts/*.html`: Static entries for the "Chronicles" (blog).
- `docs.html`: Central documentation hub.

## Managing Data

### Adding a Project
1. Open `data/projects.json`.
2. Add a new object to the array following the schema:
   ```json
   {
     "id": "my-project",
     "realName": "My Project",
     "codename": "Project Name",
     "status": "ALPHA",
     "shortDesc": "One line summary.",
     "fullDesc": "Full HTML description.",
     "tags": ["Tool", "Local"],
     "stats": { "Version": "1.0" },
     "links": [ { "label": "Download", "url": "#", "type": "download" } ],
     "roadmap": [],
     "category": "productivity",
     "featured": false
   }
   ```
3. Commit. The site will automatically update.

### Adding a Post
1. Create a new HTML file in `/posts/`.
2. Link `styles/styles.css` and `scripts/script.js`.
3. Add the metadata to `data/posts.json`:
   ```json
   {
     "id": "2026-new-post",
     "dateISO": "2026-03-01",
     "title": "New Post Title",
     "excerpt": "Short summary...",
     "url": "posts/new-post.html",
     "projectId": "linked-project-id" // Optional, for changelogs
   }
   ```

### Updating Funding
Funding data is located in `data/funding.json`.
- **Note**: The `funding-refresh.yml` workflow runs weekly to update the `lastUpdatedISO` timestamp and validate the schema.

## Deployment

The site is hosted on **GitHub Pages**.

- **Workflow**: `.github/workflows/pages.yml`
- **Trigger**: Push to `main`.
- **Process**:
  1. Validates JSON data (`scripts/validateData.js`).
  2. Uploads the root directory.
  3. Deploys to GitHub Pages.

## Verification

To run the data validator locally:
```bash
node scripts/validateData.js
```
