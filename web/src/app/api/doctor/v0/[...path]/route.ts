import { NextRequest } from "next/server";
import { allowedOperation, safeReturnTo } from "@/lib/api/proxy-policy";

export const dynamic = "force-dynamic";
const problem = (status: number, code: string) =>
  Response.json(
    {
      type: "about:blank",
      title: "Solicitação não concluída",
      status,
      code,
      detail: "Consulte a configuração da integração.",
      requestId: crypto.randomUUID(),
      retryAfterSeconds: null,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Type": "application/problem+json",
      },
    },
  );
async function transport(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  if (!allowedOperation(req.method, path)) return problem(404, "NOT_FOUND");
  // Next dev may normalize nextUrl.host to localhost; Host is the browser's destination.
  // Behind a deployment proxy, pin the externally visible origin explicitly.
  const publicOrigin =
    process.env.DOCTOR_WEB_ORIGIN ||
    (req.headers.get("host")
      ? `${req.nextUrl.protocol}//${req.headers.get("host")}`
      : req.nextUrl.origin);
  if (
    req.method === "POST" &&
    (req.headers.get("origin") !== publicOrigin ||
      !req.headers.get("x-csrf-token"))
  )
    return problem(403, "FORBIDDEN");
  if (
    path === "auth/start" &&
    !safeReturnTo(req.nextUrl.searchParams.get("returnTo"))
  )
    return problem(422, "INVALID_RETURN_TO");
  const configured = process.env.DOCTOR_API_UPSTREAM_URL;
  if (!configured) return problem(503, "UPSTREAM_NOT_CONFIGURED");
  let upstream: URL;
  try {
    upstream = new URL(
      configured.endsWith("/") ? configured : `${configured}/`,
    );
    if (
      !["http:", "https:"].includes(upstream.protocol) ||
      upstream.username ||
      upstream.password ||
      upstream.search ||
      upstream.hash
    )
      throw new Error();
  } catch {
    return problem(503, "UPSTREAM_NOT_CONFIGURED");
  }
  const target = new URL(path, upstream);
  target.search = req.nextUrl.search;
  const headers = new Headers();
  for (const name of [
    "cookie",
    "content-type",
    "accept",
    "x-csrf-token",
    "idempotency-key",
    "range",
    "if-range",
    "origin",
  ]) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }
  let response: Response;
  try {
    response = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await req.arrayBuffer() : undefined,
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(30000)]),
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return problem(503, "SERVICE_UNAVAILABLE");
  }
  const outgoing = new Headers({
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of [
    "content-type",
    "content-range",
    "accept-ranges",
    "retry-after",
  ]) {
    const value = response.headers.get(name);
    if (value) outgoing.set(name, value);
  }
  for (const cookie of response.headers.getSetCookie())
    outgoing.append("set-cookie", cookie);
  if (response.status >= 300 && response.status < 400) {
    if (path !== "auth/start" || !response.headers.has("location"))
      return problem(502, "INVALID_RESPONSE");
    const raw = response.headers.get("location")!;
    if (raw.startsWith("/doctor") && safeReturnTo(raw))
      outgoing.set("location", raw);
    else {
      let location: URL;
      try {
        location = new URL(raw, target);
      } catch {
        return problem(502, "INVALID_RESPONSE");
      }
      const allowed = [
        upstream.origin,
        ...(process.env.DOCTOR_AUTH_REDIRECT_ORIGINS ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      ];
      if (
        !["https:", "http:"].includes(location.protocol) ||
        location.username ||
        location.password ||
        !allowed.includes(location.origin)
      )
        return problem(502, "INVALID_RESPONSE");
      outgoing.set("location", location.href);
    }
  }
  if (path.endsWith("/content")) {
    const mime = response.headers.get("content-type")?.split(";")[0];
    if (
      response.ok &&
      !["application/pdf", "image/jpeg", "image/png"].includes(mime ?? "")
    )
      return problem(502, "INVALID_RESPONSE");
    outgoing.set(
      "Content-Security-Policy",
      "sandbox; default-src 'none'; style-src 'unsafe-inline'",
    );
    outgoing.set("Content-Disposition", "inline");
  }
  return new Response(response.body, {
    status: response.status,
    headers: outgoing,
  });
}
export { transport as GET, transport as POST };
