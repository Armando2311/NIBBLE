# Nibble

Nibble is a private engineering project cockpit for NPI work, first articles,
system design, scripts, validation, SOPs, and revision-controlled technical
files.

## Current build

The first product slice includes:

- a responsive project cockpit with milestones, blockers, workstreams, and activity
- global indexed search with project and folder context
- search-result “Reveal in project” navigation
- a folder workspace with file inspection and drag-to-folder behavior
- 100 MB upload validation
- a D1 metadata schema for customers, projects, folders, files, immutable versions, activity, and search records
- R2 object-storage binding for original files and derivatives

The current interface uses coherent demonstration data while persistence,
multipart uploads, content extraction, and Office/HEIC preview workers are
connected in subsequent milestones.

## Development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm test
```

Generate a migration after changing `db/schema.ts`:

```bash
npm run db:generate
```
