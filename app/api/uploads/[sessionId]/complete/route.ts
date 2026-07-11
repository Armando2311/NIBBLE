import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { getFileBucket } from "../../../../../db/storage";
import { activities, files, fileVersions, uploadParts, uploadSessions } from "../../../../../db/schema";
import { authorizePrivateRequest } from "../../../private-request";
import { alphabeticRevision, fileKind } from "../../upload-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  const { sessionId } = await params; const db = getDb();
  const session = await db.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId)).limit(1);
  if (!session.length) return Response.json({ error: "Upload session not found" }, { status: 404 });
  if (session[0].status === "complete") return Response.json({ fileId: session[0].reservedFileId, complete: true });
  try {
    const parts = await db.select().from(uploadParts).where(eq(uploadParts.sessionId, sessionId)).orderBy(asc(uploadParts.partNumber));
    const expectedCount = Math.ceil(session[0].expectedSizeBytes / session[0].partSizeBytes); const totalSize = parts.reduce((sum, part) => sum + part.sizeBytes, 0);
    if (parts.length !== expectedCount || totalSize !== session[0].expectedSizeBytes) return Response.json({ error: "Not all file parts have uploaded" }, { status: 409 });
    await db.update(uploadSessions).set({ status: "completing", updatedAt: new Date() }).where(eq(uploadSessions.id, sessionId));
    const completed = await getFileBucket().resumeMultipartUpload(session[0].r2Key, session[0].uploadId).complete(parts.map(({ partNumber, etag }) => ({ partNumber, etag })));
    const latest = session[0].fileId ? await db.select({ number: fileVersions.versionNumber }).from(fileVersions).where(eq(fileVersions.fileId, session[0].fileId)).orderBy(desc(fileVersions.versionNumber)).limit(1) : [];
    const versionNumber = (latest[0]?.number ?? 0) + 1; const revision = alphabeticRevision(versionNumber); const createdAt = new Date();
    if (!session[0].fileId) await db.insert(files).values({ id: session[0].reservedFileId, projectId: session[0].projectId, folderId: session[0].folderId, displayName: session[0].originalName, kind: fileKind(session[0].originalName, session[0].mimeType), description: null, documentNumber: null, lifecycleStatus: "released", currentVersionId: session[0].reservedVersionId, deletedAt: null, createdAt, updatedAt: createdAt });
    await db.insert(fileVersions).values({ id: session[0].reservedVersionId, fileId: session[0].reservedFileId, versionNumber, revisionLabel: revision, originalName: session[0].originalName, mimeType: session[0].mimeType, sizeBytes: session[0].expectedSizeBytes, sha256: null, r2Key: session[0].r2Key, r2Etag: completed.etag, changeSummary: session[0].changeSummary || (versionNumber === 1 ? "Initial release" : `Released revision ${revision}`), extractionStatus: fileKind(session[0].originalName, session[0].mimeType) === "code" ? "ready" : "queued", previewStatus: ["pdf", "image", "code"].includes(fileKind(session[0].originalName, session[0].mimeType)) ? "ready" : "queued", createdAt });
    if (session[0].fileId) await db.update(files).set({ currentVersionId: session[0].reservedVersionId, displayName: session[0].originalName, lifecycleStatus: "released", updatedAt: createdAt }).where(eq(files.id, session[0].reservedFileId));
    await db.insert(activities).values({ id: `activity_${crypto.randomUUID()}`, projectId: session[0].projectId, entityType: "file", entityId: session[0].reservedFileId, action: versionNumber === 1 ? "file_uploaded" : "revision_released", payloadJson: JSON.stringify({ name: session[0].originalName, revision, versionNumber }), createdAt });
    await db.update(uploadSessions).set({ status: "complete", updatedAt: createdAt }).where(eq(uploadSessions.id, sessionId));
    return Response.json({ fileId: session[0].reservedFileId, versionId: session[0].reservedVersionId, revision, versionNumber, complete: true });
  } catch (error) {
    await getFileBucket().delete(session[0].r2Key).catch(() => undefined); await db.update(uploadSessions).set({ status: "failed", updatedAt: new Date() }).where(eq(uploadSessions.id, sessionId));
    return Response.json({ error: error instanceof Error ? error.message : "Unable to complete upload" }, { status: 500 });
  }
}
