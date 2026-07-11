export function authorizePrivateRequest(request: Request): Response | null {
  const url = new URL(request.url);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const authenticatedEmail = request.headers.get("oai-authenticated-user-email");

  if (isLocal || authenticatedEmail) return null;
  return Response.json({ error: "Authentication required" }, { status: 401 });
}
