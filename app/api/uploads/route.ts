import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { getFileBucket } from "../../../db/storage";
import { files, fileVersions, folders, projects, uploadSessions } from "../../../db/schema";
import { authorizePrivateRequest } from "../private-request";
import { MAX_FILE_SIZE, PART_SIZE, safeFileName } from "./upload-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  try {
    const body = await request.json() as { projectId?: string; folderId?: string; fileId?: string; originalName?: string; mimeType?: string; sizeBytes?: number; changeSummary?: string };
    const projectId = body.projectId?.trim() ?? ""; const folderId = body.folderId?.trim() ?? "";
    const originalName = safeFileName(body.originalName ?? ""); const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!projectId || !folderId || !originalName) return Response.json({ error: "Project, folder, and file name are required" }, { status: 400 });
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE) return Response.json({ error: `${originalName} exceeds the 100 MB limit` }, { status: 413 });

    const db = getDb();
    const project = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
    const folder = await db.select({ id: folders.id }).from(folders).where(and(eq(folders.id, folderId), eq(folders.projectId, projectId))).limit(1);
    if (!project.length || !folder.length) return Response.json({ error: "Project or destination folder not found" }, { status: 404 });
    if (body.fileId) {
      const logicalFile = await db.select({ id: files.id }).from(files).where(and(eq(files.id, body.fileId), eq(files.projectId, projectId))).limit(1);
      if (!logicalFile.length) return Response.json({ error: "Existing file not found" }, { status: 404 });
    }

    const sessionId = `upload_${crypto.randomUUID()}`; const reservedFileId = body.fileId || `file_${crypto.randomUUID()}`; const reservedVersionId = `version_${crypto.randomUUID()}`;
    const r2Key = `projects/${projectId}/files/${reservedFileId}/versions/${reservedVersionId}`;
    const multipart = await getFileBucket().createMultipartUpload(r2Key, { httpMetadata: { contentType: body.mimeType || "application/octet-stream", contentDisposition: `attachment; filename="${originalName.replace(/"/g, "")}"` }, customMetadata: { projectId, fileId: reservedFileId, versionId: reservedVersionId, originalName } });
    const timestamp = new Date();
    await db.insert(uploadSessions).values({ id: sessionId, projectId, folderId, fileId: body.fileId || null, reservedFileId, reservedVersionId, uploadId: multipart.uploadId, r2Key, originalName, mimeType: body.mimeType || "application/octet-stream", expectedSizeBytes: sizeBytes, partSizeBytes: PART_SIZE, status: "initiated", changeSummary: body.changeSummary?.trim().slice(0, 500) || null, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), createdAt: timestamp, updatedAt: timestamp });
    const existingVersions = body.fileId ? await db.select({ number: fileVersions.versionNumber }).from(fileVersions).where(eq(fileVersions.fileId, body.fileId)).orderBy(desc(fileVersions.versionNumber)).limit(1) : [];
    return Response.json({ sessionId, partSize: PART_SIZE, partCount: Math.ceil(sizeBytes / PART_SIZE), nextRevisionNumber: (existingVersions[0]?.number ?? 0) + 1 }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to start upload" }, { status: 500 }); }
}
