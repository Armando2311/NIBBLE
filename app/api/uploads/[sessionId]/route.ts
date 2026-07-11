import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { getFileBucket } from "../../../../db/storage";
import { uploadSessions } from "../../../../db/schema";
import { authorizePrivateRequest } from "../../private-request";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  try {
    const { sessionId } = await params; const db = getDb(); const session = await db.select().from(uploadSessions).where(eq(uploadSessions.id, sessionId)).limit(1);
    if (!session.length) return Response.json({ error: "Upload session not found" }, { status: 404 });
    if (!["complete", "aborted"].includes(session[0].status)) await getFileBucket().resumeMultipartUpload(session[0].r2Key, session[0].uploadId).abort();
    await db.update(uploadSessions).set({ status: "aborted", updatedAt: new Date() }).where(eq(uploadSessions.id, sessionId));
    return Response.json({ aborted: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to cancel upload" }, { status: 500 }); }
}
