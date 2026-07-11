import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { getFileBucket } from "../../../../../../db/storage";
import { uploadParts, uploadSessions } from "../../../../../../db/schema";
import { authorizePrivateRequest } from "../../../../private-request";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ sessionId: string; partNumber: string }> }) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  try {
    const { sessionId, partNumber: rawPart } = await params; const partNumber = Number(rawPart); const db = getDb();
    const session = await db.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId)).limit(1);
    if (!session.length || !["initiated", "uploading"].includes(session[0].status)) return Response.json({ error: "Upload session is unavailable" }, { status: 404 });
    const expectedParts = Math.ceil(session[0].expectedSizeBytes / session[0].partSizeBytes);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > expectedParts) return Response.json({ error: "Invalid upload part" }, { status: 400 });
    const size = Number(request.headers.get("content-length") ?? 0); const expectedSize = partNumber === expectedParts ? session[0].expectedSizeBytes - (expectedParts - 1) * session[0].partSizeBytes : session[0].partSizeBytes;
    if (size !== expectedSize) return Response.json({ error: "Upload part size does not match the session" }, { status: 400 });
    const multipart = getFileBucket().resumeMultipartUpload(session[0].r2Key, session[0].uploadId);
    const uploaded = await multipart.uploadPart(partNumber, request.body);
    await db.insert(uploadParts).values({ id: `${sessionId}_${partNumber}`, sessionId, partNumber, etag: uploaded.etag, sizeBytes: size, createdAt: new Date() }).onConflictDoUpdate({ target: [uploadParts.sessionId, uploadParts.partNumber], set: { etag: uploaded.etag, sizeBytes: size, createdAt: new Date() } });
    await db.update(uploadSessions).set({ status: "uploading", updatedAt: new Date() }).where(eq(uploadSessions.id, sessionId));
    return Response.json({ partNumber, etag: uploaded.etag });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Part upload failed" }, { status: 500 }); }
}
