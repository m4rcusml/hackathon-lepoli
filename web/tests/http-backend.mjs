// Test double only. This is not the product backend and does not validate real integration.
// Run from web/: node tests/http-backend.mjs
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const baseSnapshot = JSON.parse(
  readFileSync(
    new URL("../src/lib/demo/base-snapshot.json", import.meta.url),
    "utf8",
  ),
);
const API = "/api/doctor/v0";
const PATIENT = "patient-http";
const CSRF = "csrf-http-test-only";
const SCOPES = [...baseSnapshot.access.scopes];
const now = () => new Date().toISOString();
const future = (seconds) => new Date(Date.now() + seconds * 1000).toISOString();
let state;

function reset() {
  state = {
    revision: 1,
    grantStatus: "active",
    nextDoctor: "doctor-http-a",
    invitationExpiresAt: future(7200),
    grantExpiresAt: future(86400),
    grantApprovedAt: now(),
    sessions: new Map(),
    reviews: new Map(),
    snapshots: new Map(),
    requests: new Map(),
    idempotency: new Map(),
    temporary: new Map(),
    handoffs: new Map(),
    snapshotDelayMs: 0,
    pendingSnapshots: 0,
    invalidSnapshot: false,
    failure: null,
    calls: [],
  };
}
reset();

function json(res, status, data, headers = {}) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, private",
    ...headers,
  });
  res.end(JSON.stringify(data));
}
function envelope(res, data, status = 200, headers) {
  json(
    res,
    status,
    {
      meta: {
        requestId: randomUUID(),
        serverTime: now(),
        contractVersion: "0.1-draft",
      },
      data,
    },
    headers,
  );
}
function problem(res, status, code) {
  json(
    res,
    status,
    {
      type: "about:blank",
      title: "Test HTTP failure",
      status,
      code,
      detail: "Controlled test response.",
      requestId: randomUUID(),
      retryAfterSeconds: null,
    },
    { "Content-Type": "application/problem+json" },
  );
}
async function body(req) {
  let input = "";
  for await (const part of req) {
    input += part;
    if (input.length > 32768) throw new Error("BODY_TOO_LARGE");
  }
  return input ? JSON.parse(input) : {};
}
function cookie(req, key) {
  return req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))
    ?.slice(key.length + 1);
}
function doctor(req) {
  return state.sessions.get(cookie(req, "doctor_session"));
}
function requireDoctor(req, res) {
  const id = doctor(req);
  if (!id) {
    problem(res, 401, "UNAUTHENTICATED");
    return null;
  }
  return id;
}
function grant(scopes = SCOPES) {
  return {
    id: "grant-http",
    patientId: PATIENT,
    status: state.grantStatus,
    scopeVersion: "scope-http-1",
    scopes,
    approvedAt: state.grantApprovedAt,
    expiresAt: state.grantExpiresAt,
    revokedAt: state.grantStatus === "revoked" ? now() : null,
    durationExplicitlyApproved: true,
  };
}
function access(kind = "continuous", id = "grant-http") {
  return {
    kind,
    contextId: id,
    patientId: PATIENT,
    grantId: kind === "continuous" ? "grant-http" : null,
    scopeVersion: "scope-http-1",
    scopes: SCOPES,
    expiresAt: kind === "temporary" ? state.invitationExpiresAt : state.grantExpiresAt,
    readOnly: true,
  };
}
function authorized(req, res, url) {
  if (url.searchParams.has("temporaryAccessId")) {
    const id = url.searchParams.get("temporaryAccessId");
    const temporary = state.temporary.get(id);
    if (
      !temporary ||
      temporary.cookie !== cookie(req, "consultation_session") ||
      temporary.closed
    ) {
      problem(res, 403, "ACCESS_REVOKED");
      return null;
    }
    return { doctor: null, access: temporary.access };
  }
  const id = requireDoctor(req, res);
  if (!id) return null;
  if (state.grantStatus !== "active") {
    problem(
      res,
      403,
      state.grantStatus === "revoked" ? "ACCESS_REVOKED" : "REQUEST_PENDING",
    );
    return null;
  }
  return { doctor: id, access: access() };
}
function reviewFor(id) {
  return state.reviews.get(id) ?? { cursor: 0, reviewedAt: null };
}
function snapshotFor(identity) {
  const s = structuredClone(baseSnapshot);
  const last = reviewFor(identity.doctor);
  s.id = `snapshot-http-${identity.doctor ?? identity.access.contextId}-${state.revision}`;
  s.patientId = PATIENT;
  s.patient = {
    ...s.patient,
    id: PATIENT,
    displayName: "Paciente HTTP de teste",
    disambiguationLabel: "Fixture do servidor de testes",
  };
  s.createdAt = now();
  s.dataRevision = `revision-http-${state.revision}`;
  s.accessRevision = "access-http-1";
  s.updateHighWatermark = `cursor-http-${state.revision}`;
  s.access = identity.access;
  s.review =
    identity.access.kind === "temporary"
      ? null
      : {
          lastReviewedCursor: last.cursor ? `cursor-http-${last.cursor}` : null,
          lastReviewedAt: last.reviewedAt,
          mode: last.cursor ? "changes" : "initial_review",
          unreadGroupCount: last.cursor
            ? Math.max(0, state.revision - last.cursor)
            : null,
        };
  s.graph.nodes[0].label = s.patient.displayName;
  state.snapshots.set(s.id, {
    snapshot: structuredClone(s),
    owner: identity.doctor,
    through: state.revision,
    reviewedFrom: last.cursor,
  });
  return s;
}
function controls() {
  return {
    revision: state.revision,
    grantStatus: state.grantStatus,
    pendingSnapshots: state.pendingSnapshots,
    reviews: Object.fromEntries(state.reviews),
    requests: [...state.requests.values()],
    calls: state.calls.map(({ method, path }) => ({ method, path })),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:4100");
  try {
    // Control endpoints exist only on this test server, outside the app proxy allowlist.
    if (url.pathname === "/__test" && req.method === "POST") {
      const input = await body(req);
      if (input.reset) reset();
      if (input.arrive) state.revision += 1;
      for (const key of [
        "grantStatus",
        "snapshotDelayMs",
        "invalidSnapshot",
        "failure",
        "nextDoctor",
      ])
        if (key in input) state[key] = input[key];
      if (input.decide) {
        for (const request of state.requests.values()) {
          request.status = input.decide;
          if (input.decide === "approved") {
            state.grantStatus = "active";
            request.grant = grant(request.requestedScopes);
          }
        }
      }
      return json(res, 200, controls());
    }
    if (
      ["/__test", "/__test/health"].includes(url.pathname) &&
      req.method === "GET"
    )
      return json(res, 200, controls());
    if (!url.pathname.startsWith(`${API}/`))
      return problem(res, 404, "NOT_FOUND");
    const path = url.pathname.slice(API.length);
    state.calls.push({ method: req.method, path });
    if (
      state.failure &&
      (state.failure.path === "*" || path.endsWith(state.failure.path))
    )
      return problem(res, state.failure.status, state.failure.code);
    if (req.method === "POST" && req.headers["x-csrf-token"] !== CSRF)
      return problem(res, 403, "FORBIDDEN");

    if (path === "/session" && req.method === "GET") {
      const id = doctor(req);
      const handoff = state.handoffs.get(cookie(req, "doctor_handoff")) ?? null;
      return envelope(res, {
        state: id ? "authenticated" : "anonymous",
        doctor: id
          ? {
              id,
              displayName:
                id === "doctor-http-a" ? "Médica HTTP A" : "Médico HTTP B",
              professionalIdentifier: "Identidade de teste",
            }
          : null,
        expiresAt: id ? future(3600) : null,
        csrfToken: CSRF,
        pendingInvitation: id ? handoff : null,
      });
    }
    if (path === "/auth/start" && req.method === "GET") {
      const session = randomUUID();
      state.sessions.set(session, state.nextDoctor);
      res.writeHead(302, {
        Location: url.searchParams.get("returnTo") ?? "/doctor/patients",
        "Set-Cookie": `doctor_session=${session}; HttpOnly; SameSite=Lax; Path=/`,
        "Cache-Control": "no-store",
      });
      return res.end();
    }
    if (path === "/auth/logout" && req.method === "POST") {
      state.sessions.delete(cookie(req, "doctor_session"));
      res.writeHead(204, {
        "Set-Cookie":
          "doctor_session=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/",
        "Cache-Control": "no-store",
      });
      return res.end();
    }
    if (path === "/patients" && req.method === "GET") {
      const id = requireDoctor(req, res);
      if (!id) return;
      const filter = url.searchParams.get("filter") ?? "active";
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      let items = [];
      if (state.grantStatus === "active" && filter !== "inactive") {
        const s = snapshotFor({ doctor: id, access: access() });
        if (
          (!q || s.patient.displayName.toLowerCase().includes(q)) &&
          (filter !== "with_updates" || s.review.unreadGroupCount !== 0)
        )
          items.push({
            relationshipId: "grant-http",
            accessStatus: "active",
            patient: s.patient,
            lastClinicalEventAt: null,
            lastClinicalEventOn: "2025-10-18",
            lastReceivedAt: "2026-11-11T14:30:00Z",
            review: s.review,
            highlight: null,
          });
      } else if (state.grantStatus !== "active" && filter === "inactive" && !q)
        items.push({
          relationshipId: "grant-http",
          accessStatus: state.grantStatus,
          patient: null,
          lastClinicalEventAt: null,
          lastClinicalEventOn: null,
          lastReceivedAt: null,
          review: null,
          highlight: null,
        });
      return envelope(res, {
        items,
        page: { nextCursor: null, hasMore: false },
      });
    }
    if (path === "/sharing/resolve" && req.method === "POST") {
      const input = await body(req);
      if (!["http-followup", "http-consultation"].includes(input.token))
        return problem(res, 410, "INVITATION_EXPIRED");
      const invitation = {
        id: "invitation-http",
        kind: input.token === "http-consultation" ? "consultation" : "followup",
        expiresAt: state.invitationExpiresAt,
        permittedScopes: SCOPES,
        canRequestFollowup: true,
      };
      const handoffId = randomUUID();
      state.handoffs.set(handoffId, { invitation, loginContextId: handoffId });
      let temporaryAccess = null;
      const cookies = [
        `doctor_handoff=${handoffId}; HttpOnly; SameSite=Lax; Path=/`,
      ];
      if (invitation.kind === "consultation") {
        const id = randomUUID(),
          temporaryCookie = randomUUID();
        temporaryAccess = access("temporary", id);
        state.temporary.set(id, {
          access: temporaryAccess,
          cookie: temporaryCookie,
          closed: false,
        });
        cookies.push(
          `consultation_session=${temporaryCookie}; HttpOnly; SameSite=Lax; Path=/`,
        );
      }
      return envelope(
        res,
        {
          invitation,
          temporaryAccess,
          requiresDoctorAuthentication: !doctor(req),
          loginContextId: handoffId,
        },
        200,
        { "Set-Cookie": cookies },
      );
    }
    if (path === "/follow-up-requests" && req.method === "POST") {
      const id = requireDoctor(req, res);
      if (!id) return;
      const input = await body(req),
        key = req.headers["idempotency-key"];
      if (
        !key ||
        input.invitationId !== "invitation-http" ||
        !input.requestedScopes?.length
      )
        return problem(res, 422, "INVALID_REQUEST");
      const fingerprint = JSON.stringify(input),
        cacheKey = `${id}:followup:${key}`;
      const cached = state.idempotency.get(cacheKey);
      if (cached)
        return cached.fingerprint === fingerprint
          ? envelope(res, cached.result, 201)
          : problem(res, 409, "IDEMPOTENCY_CONFLICT");
      const request = {
        id: "request-http",
        invitationId: input.invitationId,
        status: "pending",
        requestedScopes: input.requestedScopes,
        requestedDuration: input.requestedDuration,
        createdAt: now(),
        expiresAt: future(7200),
        grant: null,
      };
      state.requests.set(request.id, request);
      state.idempotency.set(cacheKey, { fingerprint, result: request });
      return envelope(res, request, 201);
    }
    if (path.startsWith("/follow-up-requests/") && req.method === "GET") {
      if (!requireDoctor(req, res)) return;
      const request = state.requests.get(path.split("/").at(-1));
      return request ? envelope(res, request) : problem(res, 404, "NOT_FOUND");
    }
    if (
      path.startsWith("/temporary-access/") &&
      path.endsWith("/close") &&
      req.method === "POST"
    ) {
      const id = path.split("/")[2],
        temporary = state.temporary.get(id);
      if (temporary) temporary.closed = true;
      res.writeHead(204, { "Cache-Control": "no-store" });
      return res.end();
    }
    if (!path.startsWith(`/patients/${PATIENT}/`))
      return problem(res, 404, "NOT_FOUND");
    const identity = authorized(req, res, url);
    if (!identity) return;
    if (path.endsWith("/access") && req.method === "GET") {
      if (
        url.searchParams.has("knownAccessRevision") &&
        url.searchParams.get("knownAccessRevision") !== "access-http-1"
      )
        return problem(res, 409, "ACCESS_CHANGED");
      return envelope(res, {
        access: identity.access,
        accessRevision: "access-http-1",
        latestDataRevision: `revision-http-${state.revision}`,
        hasNewData:
          url.searchParams.get("knownDataRevision") !==
          `revision-http-${state.revision}`,
      });
    }
    if (path.endsWith("/snapshot") && req.method === "GET") {
      const captured = snapshotFor(identity),
        heldState = state;
      heldState.pendingSnapshots += 1;
      try {
        if (heldState.snapshotDelayMs)
          await new Promise((resolve) =>
            setTimeout(resolve, heldState.snapshotDelayMs),
          );
        if (heldState.invalidSnapshot)
          captured.evidence[0].value = "invalid-value";
        return envelope(res, captured);
      } finally {
        heldState.pendingSnapshots -= 1;
      }
    }
    if (path.endsWith("/updates") && req.method === "GET") {
      if (!identity.doctor) return problem(res, 401, "UNAUTHENTICATED");
      const record = state.snapshots.get(url.searchParams.get("snapshotId"));
      if (!record || record.owner !== identity.doctor)
        return problem(res, 409, "SNAPSHOT_INVALID");
      const { snapshot: s, through, reviewedFrom } = record;
      const items =
        through > reviewedFrom
          ? [
              {
                id: `update-http-${through}`,
                kind: "document",
                change: through === 1 ? "added" : "corrected",
                label:
                  through === 1
                    ? "Laudo disponível no conjunto de teste"
                    : "Correção documental posterior ao conjunto anterior",
                receivedAt: now(),
                evidenceRefs: [{ id: "ex-fer-2025", version: "1" }],
                documentId: "doc-fleury-2025",
              },
            ]
          : [];
      return envelope(res, {
        snapshotId: s.id,
        mode: s.review.mode,
        throughCursor: s.updateHighWatermark,
        items,
        page: { nextCursor: null, hasMore: false },
        reviewToken: `review-http-${s.id}`,
      });
    }
    if (path.endsWith("/reviews") && req.method === "POST") {
      if (!identity.doctor) return problem(res, 401, "UNAUTHENTICATED");
      const input = await body(req),
        key = req.headers["idempotency-key"];
      const record = state.snapshots.get(input.snapshotId);
      if (
        !key ||
        !record ||
        record.owner !== identity.doctor ||
        input.reviewToken !== `review-http-${record.snapshot.id}`
      )
        return problem(res, 409, "REVIEW_TOKEN_INVALID");
      const fingerprint = JSON.stringify(input),
        cacheKey = `${identity.doctor}:review:${key}`;
      const cached = state.idempotency.get(cacheKey);
      if (cached)
        return cached.fingerprint === fingerprint
          ? envelope(res, cached.result)
          : problem(res, 409, "IDEMPOTENCY_CONFLICT");
      const previous = reviewFor(identity.doctor),
        cursor = Math.max(previous.cursor, record.through);
      const reviewedAt =
        cursor > previous.cursor ? now() : (previous.reviewedAt ?? now());
      state.reviews.set(identity.doctor, { cursor, reviewedAt });
      const result = {
        status: cursor > previous.cursor ? "recorded" : "already_recorded",
        lastReviewedCursor: `cursor-http-${cursor}`,
        lastReviewedAt: reviewedAt,
        hasUpdatesAfterReview: state.revision > cursor,
      };
      state.idempotency.set(cacheKey, { fingerprint, result });
      return envelope(res, result);
    }
    if (path.endsWith("/content") && req.method === "GET")
      return problem(res, 404, "ORIGINAL_UNAVAILABLE");
    return problem(res, 404, "NOT_FOUND");
  } catch {
    return problem(res, 500, "TEST_SERVER_ERROR");
  }
});

server.listen(4100, "127.0.0.1", () =>
  process.stdout.write("Doctor HTTP test double listening on 127.0.0.1:4100\n"),
);
for (const event of ["SIGINT", "SIGTERM"])
  process.on(event, () => server.close(() => process.exit(0)));
