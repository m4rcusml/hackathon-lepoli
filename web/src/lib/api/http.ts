import type { DoctorApi, PatientContext, RequestOptions } from "./doctor-api";
import { ApiError } from "./errors";
import { parseResponse, validate } from "./validate";
import * as validators from "./validators.js";

export const apiBase = "/api/doctor/v0";
export function authenticationUrl(
  returnTo = "/doctor/patients",
  loginContextId?: string | null,
) {
  if (
    !/^\/doctor(?:\/|$)/.test(returnTo) ||
    returnTo.includes("\\") ||
    returnTo.includes("#") ||
    returnTo.includes("?")
  )
    throw new Error("Retorno inválido");
  const q = new URLSearchParams({ returnTo });
  if (loginContextId) q.set("loginContextId", loginContextId);
  return `${apiBase}/auth/start?${q}`;
}
const segment = (s: string) => encodeURIComponent(s);
const patientPath = (
  ctx: PatientContext,
  resource: string,
  params: Record<string, string | undefined> = {},
) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({
    ...params,
    temporaryAccessId: ctx.temporaryAccessId,
  }))
    if (v) q.set(k, v);
  return `/patients/${segment(ctx.patientId)}/${resource}${q.size ? `?${q}` : ""}`;
};
export function createHttpApi(fetcher: typeof fetch = fetch): DoctorApi {
  let csrf = "";
  async function request(
    path: string,
    options: RequestInit = {},
    o?: RequestOptions,
  ) {
    let response: Response;
    try {
      response = await fetcher(apiBase + path, {
        ...options,
        signal: o?.signal,
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(options.method === "POST"
            ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
            : {}),
          ...options.headers,
        },
      });
    } catch (error) {
      if (o?.signal?.aborted) throw error;
      throw new ApiError(503, "SERVICE_UNAVAILABLE");
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      // Never reflect upstream detail/title, tokens or clinical content into errors.
      const code =
        typeof body?.code === "string"
          ? body.code
          : response.status === 401
            ? "UNAUTHENTICATED"
            : "SERVICE_UNAVAILABLE";
      throw new ApiError(response.status, code);
    }
    return response;
  }
  async function json<K extends keyof typeof validators>(
    name: K,
    path: string,
    options?: RequestInit,
    o?: RequestOptions,
  ) {
    const response = await request(path, options, o);
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new ApiError(502, "INVALID_RESPONSE");
    }
    return parseResponse(name, raw);
  }
  return {
    async session(o) {
      const r = await json("Session", "/session", undefined, o);
      csrf = r.data.csrfToken;
      return r;
    },
    async logout(o) {
      await request("/auth/logout", { method: "POST" }, o);
      csrf = "";
    },
    async patients(query, o) {
      const q = new URLSearchParams({
        filter: query.filter ?? "active",
        limit: "25",
      });
      for (const k of ["q", "cursor"] as const)
        if (query[k]) q.set(k, query[k]);
      return (await json("PatientList", `/patients?${q}`, undefined, o)).data;
    },
    resolve: (token, o) =>
      json(
        "SharingResolution",
        "/sharing/resolve",
        { method: "POST", body: JSON.stringify({ token }) },
        o,
      ),
    async requestFollowup(input, key, o) {
      validate("FollowupRequestInput", input);
      return (
        await json(
          "FollowupRequest",
          "/follow-up-requests",
          {
            method: "POST",
            body: JSON.stringify(input),
            headers: { "Idempotency-Key": key },
          },
          o,
        )
      ).data;
    },
    async followup(id, o) {
      return (
        await json(
          "FollowupRequest",
          `/follow-up-requests/${segment(id)}`,
          undefined,
          o,
        )
      ).data;
    },
    snapshot: (ctx, o) =>
      json("Snapshot", patientPath(ctx, "snapshot"), undefined, o),
    access: (ctx, known, o) =>
      json(
        "AccessStatus",
        patientPath(ctx, "access", {
          knownDataRevision: known?.dataRevision,
          knownAccessRevision: known?.accessRevision,
        }),
        undefined,
        o,
      ),
    async updates(ctx, snapshotId, cursor, o) {
      return (
        await json(
          "UpdatesPage",
          patientPath(ctx, "updates", { snapshotId, cursor }),
          undefined,
          o,
        )
      ).data;
    },
    async review(ctx, input, key, o) {
      validate("ReviewInput", input);
      return (
        await json(
          "ReviewResult",
          patientPath(ctx, "reviews"),
          {
            method: "POST",
            body: JSON.stringify(input),
            headers: { "Idempotency-Key": key },
          },
          o,
        )
      ).data;
    },
    async original(ctx, id, o) {
      const r = await request(
        patientPath(ctx, `documents/${segment(id)}/content`),
        { headers: { Accept: "application/pdf,image/jpeg,image/png" } },
        o,
      );
      if (
        !["application/pdf", "image/png", "image/jpeg"].includes(
          r.headers.get("content-type")?.split(";")[0] ?? "",
        )
      )
        throw new ApiError(502, "INVALID_RESPONSE");
      return r.blob();
    },
    async closeTemporary(id, o) {
      await request(
        `/temporary-access/${segment(id)}/close`,
        { method: "POST" },
        o,
      );
    },
  };
}
