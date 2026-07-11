# Nibble

Nibble is a private engineering project cockpit for NPI work, first articles,
system design, scripts, validation, SOPs, and revision-controlled technical
files.

## Revision B

The first product slice includes:

- an all-project Home dashboard with defined and continuous project types
- persistent customer and project creation under the required customer hierarchy
- context-aware Add customer, Add project, and Add file workflows
- a responsive project cockpit with milestones, blockers, workstreams, and activity
- global filename, project, code, and metadata search with “Reveal in project” navigation
- persistent folders, file inspection, download, and drag-to-folder behavior
- chunked multipart R2 uploads up to 100 MB per file
- immutable alphabetic file revisions: A–Z, then AA and beyond
- a D1 metadata schema for customers, projects, folders, files, versions, upload sessions, activity, and search records

The workspace seeds representative engineering projects on first use. Office
and HEIC originals are preserved; rich preview generation and file-content
extraction are planned for Revision C.

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
