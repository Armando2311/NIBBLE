import { asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { activities, customers, files, fileVersions, folders, projects } from "../../../db/schema";
import { authorizePrivateRequest } from "../private-request";

export const dynamic = "force-dynamic";

const defaultFolders = [
  ["customer", "Customer Documents"], ["requirements", "Requirements"],
  ["design", "System Design"], ["scripts", "Scripts & Tools"],
  ["builds", "Build Records"], ["validation", "Validation & Testing"],
  ["sops", "SOPs & Work Instructions"],
] as const;

function id(prefix: string) { return `${prefix}_${crypto.randomUUID()}`; }
function now() { return new Date(); }
function clean(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

async function createDefaultFolders(projectId: string) {
  const db = getDb();
  const created = defaultFolders.map(([key, name], sortOrder) => ({
    id: `${projectId}_${key}`, projectId, parentId: null, name, sortOrder, createdAt: now(), updatedAt: now(),
  }));
  await db.insert(folders).values(created);
  return created;
}

async function seedIfEmpty() {
  const db = getDb();
  const existing = await db.select({ id: customers.id }).from(customers).limit(1);
  if (existing.length) return;

  const created = now();
  await db.insert(customers).values([
    { id: "customer_axiomtek", name: "Axiomtek", code: "AXT", color: "#4ca6ff", description: "Internal engineering and operations programs", createdAt: created, updatedAt: created },
    { id: "customer_netscout", name: "NETSCOUT", code: "NET", color: "#8b75e8", description: "Production systems and technical support", createdAt: created, updatedAt: created },
    { id: "customer_atlas", name: "Atlas Medical", code: "ATM", color: "#e99a55", description: "Medical device production programs", createdAt: created, updatedAt: created },
  ]);

  await db.insert(projects).values([
    { id: "project_edge_ai", customerId: "customer_axiomtek", name: "Edge AI Visual Inspection Station", code: "AXT-NPI-026", description: "Deploy a production inspection cell using industrial vision to validate connector placement and enclosure labeling.", projectType: "defined", phase: "validate", health: "at_risk", status: "active", nextMilestone: "First article sign-off", currentBlocker: "Camera trigger drops after controller resume", currentBuild: "EVT-03", systemRevision: "C", favorite: true, targetDate: new Date("2026-08-14T12:00:00Z"), createdAt: created, updatedAt: created },
    { id: "project_netscout_support", customerId: "customer_netscout", name: "Production Line Engineering Support", code: "NET-SUP-001", description: "Continuous technical support, corrective action, scripting, and process improvement for the NETSCOUT production line.", projectType: "continuous", phase: "active_support", health: "on_track", status: "active", nextMilestone: "Weekly production review", currentBlocker: null, currentBuild: null, systemRevision: "B", favorite: true, targetDate: null, createdAt: created, updatedAt: created },
    { id: "project_burnin", customerId: "customer_axiomtek", name: "Burn-in Test Automation", code: "AXT-OPS-014", description: "Automate burn-in orchestration, evidence capture, and operator reporting.", projectType: "defined", phase: "build", health: "on_track", status: "active", nextMilestone: "Pilot station deployment", currentBlocker: null, currentBuild: "PILOT-02", systemRevision: "A", favorite: false, targetDate: new Date("2026-09-04T12:00:00Z"), createdAt: created, updatedAt: created },
    { id: "project_transit", customerId: "customer_atlas", name: "Transit Controller NPI", code: "ATM-NPI-021", description: "First article, validation, and production release for the revised controller platform.", projectType: "defined", phase: "design", health: "blocked", status: "active", nextMilestone: "Design review", currentBlocker: "Awaiting customer-approved connector specification", currentBuild: "DVT-01", systemRevision: "B", favorite: false, targetDate: new Date("2026-10-02T12:00:00Z"), createdAt: created, updatedAt: created },
  ]);

  for (const projectId of ["project_edge_ai", "project_netscout_support", "project_burnin", "project_transit"]) await createDefaultFolders(projectId);
}

async function workspacePayload() {
  const db = getDb();
  const [customerRows, projectRows, folderRows, fileRows, versionRows, activityRows] = await Promise.all([
    db.select().from(customers).where(isNull(customers.archivedAt)).orderBy(asc(customers.name)),
    db.select().from(projects).where(eq(projects.status, "active")).orderBy(desc(projects.favorite), desc(projects.updatedAt)),
    db.select().from(folders).orderBy(asc(folders.sortOrder)),
    db.select().from(files).where(isNull(files.deletedAt)).orderBy(desc(files.updatedAt)),
    db.select().from(fileVersions).orderBy(desc(fileVersions.versionNumber)),
    db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50),
  ]);
  return { customers: customerRows, projects: projectRows, folders: folderRows, files: fileRows, versions: versionRows, activities: activityRows };
}

export async function GET(request: Request) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  try { await seedIfEmpty(); return Response.json(await workspacePayload()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load workspace" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = clean(payload.action, 50);
    const db = getDb();

    if (action === "create_customer") {
      const name = clean(payload.name, 120); const code = clean(payload.code, 12).toUpperCase();
      if (!name || !code) return Response.json({ error: "Customer name and code are required" }, { status: 400 });
      const customer = { id: id("customer"), name, code, color: clean(payload.color, 20) || "#4ca6ff", description: clean(payload.description, 500) || null, archivedAt: null, createdAt: now(), updatedAt: now() };
      await db.insert(customers).values(customer);
      return Response.json({ customer }, { status: 201 });
    }

    if (action === "create_project") {
      const name = clean(payload.name, 160); const code = clean(payload.code, 30).toUpperCase(); const customerId = clean(payload.customerId, 100);
      const projectType = payload.projectType === "continuous" ? "continuous" : "defined";
      if (!name || !code || !customerId) return Response.json({ error: "Customer, project name, and code are required" }, { status: 400 });
      const projectId = id("project");
      const targetDate = projectType === "defined" && clean(payload.targetDate, 30) ? new Date(clean(payload.targetDate, 30)) : null;
      const project = { id: projectId, customerId, name, code, description: clean(payload.description, 1000) || null, projectType, phase: projectType === "continuous" ? "active_support" : "intake", health: "on_track", status: "active", nextMilestone: null, currentBlocker: null, currentBuild: null, systemRevision: "A", favorite: false, targetDate, archivedAt: null, createdAt: now(), updatedAt: now() };
      await db.insert(projects).values(project);
      const projectFolders = await createDefaultFolders(projectId);
      return Response.json({ project, folders: projectFolders }, { status: 201 });
    }

    if (action === "create_folder") {
      const projectId = clean(payload.projectId, 100); const name = clean(payload.name, 120);
      if (!projectId || !name) return Response.json({ error: "Project and folder name are required" }, { status: 400 });
      const folder = { id: id("folder"), projectId, parentId: clean(payload.parentId, 100) || null, name, sortOrder: 100, archivedAt: null, createdAt: now(), updatedAt: now() };
      await db.insert(folders).values(folder); return Response.json({ folder }, { status: 201 });
    }

    if (action === "move_file") {
      const fileId = clean(payload.fileId, 100); const folderId = clean(payload.folderId, 100);
      if (!fileId || !folderId) return Response.json({ error: "File and folder are required" }, { status: 400 });
      await db.update(files).set({ folderId, updatedAt: now() }).where(eq(files.id, fileId));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown workspace action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace update failed";
    const status = message.includes("UNIQUE") ? 409 : 500;
    return Response.json({ error: status === 409 ? "That code is already in use" : message }, { status });
  }
}
