import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { getFileBucket } from "../../../db/storage";
import { fileVersions } from "../../../db/schema";
import { authorizePrivateRequest } from "../private-request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = authorizePrivateRequest(request); if (denied) return denied;
  try {
    const fileId = new URL(request.url).searchParams.get("fileId") ?? "";
    const db = getDb();
    const version = await db.select().from(fileVersions).where(eq(fileVersions.fileId, fileId)).orderBy(desc(fileVersions.versionNumber)).limit(1);
    if (!version.length) return Response.json({ error: "File not found" }, { status: 404 });
    const object = await getFileBucket().get(version[0].r2Key);
    if (!object) return Response.json({ error: "Stored file is unavailable" }, { status: 404 });
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("content-length", String(object.size));
    return new Response(object.body, { headers });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Download failed" }, { status: 500 }); }
}
