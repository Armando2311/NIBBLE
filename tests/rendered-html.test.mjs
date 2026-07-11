import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the Nibble Rev B workspace", async () => {
  const [page, app, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/NibbleRevB.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /NibbleRevB/);
  assert.match(app, /REV B/);
  assert.match(app, /Private engineering workspace/);
  assert.match(app, /All active work across customers/);
  assert.match(app, /All projects/);
  assert.match(app, /Search projects, files, contents/);
  assert.match(layout, /Your private engineering project cockpit/);
  assert.doesNotMatch(page + app, /codex-preview|Your site is taking shape/);
});

test("ships persistent Rev B API routes and multipart upload metadata", async () => {
  const [workspace, uploads, schema, migration] = await Promise.all([
    readFile(new URL("../app/api/workspace/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_classy_jack_flag.sql", import.meta.url), "utf8"),
  ]);
  assert.match(workspace, /create_customer/);
  assert.match(workspace, /create_project/);
  assert.match(workspace, /projectType/);
  assert.match(uploads, /createMultipartUpload/);
  assert.match(uploads, /100 \* 1024 \* 1024|MAX_FILE_SIZE/);
  assert.match(schema, /upload_sessions/);
  assert.match(schema, /project_type/);
  assert.match(migration, /CREATE TABLE [`"]upload_sessions[`"]/i);
});
