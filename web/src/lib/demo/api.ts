import type {
  DoctorApi,
  PatientContext,
  RequestOptions,
} from "../api/doctor-api";
import type { Schemas, Snapshot } from "../api/types";
import { ApiError } from "../api/errors";
import { parseResponse, validate } from "../api/validate";
import {
  createFixture,
  projectFixture,
  demoDoctor,
  DEMO_PATIENT,
  DEMO_TIME,
  type DemoScenario,
} from "./fixture";

export function createDemoApi(
  scenario: DemoScenario = "active-initial",
  latency = 120,
) {
  let session: Schemas["Session"] = {
    state: scenario === "temporary-only" ? "anonymous" : "authenticated",
    doctor: scenario === "temporary-only" ? null : demoDoctor,
    expiresAt: scenario === "temporary-only" ? null : "2026-11-11T23:00:00Z",
    csrfToken: "demo-csrf-no-validity",
    pendingInvitation: null,
  };
  let denied: string | null =
    scenario === "revoked"
      ? "ACCESS_REVOKED"
      : scenario === "expired"
        ? "ACCESS_EXPIRED"
        : null;
  let restricted = scenario === "restricted-exams";
  let revision = 1;
  let epoch = 0;
  let scopeRevision = 1;
  let requestSerial = 0;
  let tempSerial = 0;
  let lastRequestId = "";
  const snapshots = new Map<
    string,
    {
      snapshot: Snapshot;
      revision: number;
      owner: string;
      contextId: string;
      firstPageServed: boolean;
      token: string | null;
    }
  >();
  const reviews = new Map<string, { revision: number; at: string }>();
  const followups = new Map<
    string,
    { owner: string; request: Schemas["FollowupRequest"] }
  >();
  const approvedGrants = new Map<string, Schemas["Grant"]>();
  const idempotency = new Map<string, { body: string; result: unknown }>();
  const temporary = new Set<string>();
  const invitations = new Set<string>();
  const invitationMetadata = new Map<string, Schemas["Invitation"]>();
  const now = () => DEMO_TIME;
  const owner = () => session.doctor?.id ?? "anonymous";
  async function pause(o?: RequestOptions, response: "clinical" | "followup-status" = "clinical") {
    const startedEpoch = epoch;
    const startedSession = session;
    if (o?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await new Promise<void>((resolve, reject) => {
      const done = () => {
        o?.signal?.removeEventListener("abort", aborted);
        resolve();
      };
      const timer = setTimeout(done, latency);
      function aborted() {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      }
      o?.signal?.addEventListener("abort", aborted, { once: true });
    });
    if (startedSession !== session || (response === "clinical" && startedEpoch !== epoch))
      throw new ApiError(409, "ACCESS_CHANGED");
    if (scenario === "backend-unavailable")
      throw new ApiError(503, "SERVICE_UNAVAILABLE");
  }
  function authenticated() {
    if (session.state !== "authenticated")
      throw new ApiError(401, "UNAUTHENTICATED");
  }
  function check(ctx: PatientContext) {
    if (ctx.patientId !== DEMO_PATIENT) throw new ApiError(404, "NOT_FOUND");
    if (denied) throw new ApiError(403, denied);
    if (ctx.temporaryAccessId) {
      if (!temporary.has(ctx.temporaryAccessId))
        throw new ApiError(403, "ACCESS_EXPIRED");
    } else {
      authenticated();
      if (
        ["pending-followup", "rejected-followup", "empty-portfolio"].includes(
          scenario,
        ) &&
        !approvedGrants.has(owner())
      )
        throw new ApiError(403, "REQUEST_PENDING");
    }
  }
  const output = <K extends Parameters<typeof parseResponse>[0]>(
    name: K,
    data: unknown,
  ) =>
    parseResponse(name, {
      meta: {
        requestId: "demo-request",
        serverTime: now(),
        contractVersion: "0.1-draft",
      },
      data,
    });
  function projection(ctx?: PatientContext): Snapshot {
    const base = createFixture(restricted ? "restricted-exams" : scenario);
    const grant = ctx?.temporaryAccessId
      ? undefined
      : approvedGrants.get(owner());
    const s = projectFixture(
      base,
      restricted ? ["read_exams"] : (grant?.scopes ?? base.access.scopes),
    );
    if (ctx?.temporaryAccessId)
      s.access = {
        ...s.access,
        kind: "temporary",
        contextId: ctx.temporaryAccessId,
        grantId: null,
        expiresAt: "2026-11-11T17:00:00Z",
      };
    else
      s.access = {
        ...s.access,
        contextId: grant?.id ?? `grant-demo-${owner()}`,
        grantId: grant?.id ?? `grant-demo-${owner()}`,
        scopeVersion: grant?.scopeVersion ?? s.access.scopeVersion,
        expiresAt: grant ? grant.expiresAt : s.access.expiresAt,
      };
    s.accessRevision = `access-demo-${scopeRevision}-${s.access.scopeVersion}-${s.access.contextId}`;
    return s;
  }
  function reviewState(s: Snapshot): Schemas["ReviewState"] {
    const r = reviews.get(reviewOwner(s));
    return r
      ? {
          lastReviewedCursor: `cursor-demo-${r.revision}`,
          lastReviewedAt: r.at,
          mode: "changes",
          unreadGroupCount: s.documents.items.length
            ? Math.max(0, revision - r.revision)
            : 0,
        }
      : {
          ...createFixture(scenario).review!,
          unreadGroupCount: s.documents.items.length
            ? createFixture(scenario).review!.unreadGroupCount
            : 0,
        };
  }
  const reviewOwner = (s: Snapshot) =>
    JSON.stringify([owner(), s.access.contextId, s.access.scopeVersion]);
  function storedSnapshot(ctx: PatientContext, id: string) {
    const stored = snapshots.get(id);
    const current = projection(ctx);
    if (
      !stored ||
      stored.owner !== owner() ||
      stored.contextId !== current.access.contextId ||
      stored.snapshot.accessRevision !== current.accessRevision
    )
      throw new ApiError(409, "ACCESS_CHANGED");
    return stored;
  }
  const intention = (operation: string, key: string) =>
    JSON.stringify([owner(), operation, key]);
  const api: DoctorApi = {
    async session(o) {
      await pause(o);
      return output("Session", structuredClone(session));
    },
    async logout(o) {
      await pause(o);
      session = {
        state: "anonymous",
        doctor: null,
        expiresAt: null,
        csrfToken: "demo-csrf-no-validity",
        pendingInvitation: null,
      };
      epoch++;
      temporary.clear();
      snapshots.clear();
      invitations.clear();
      invitationMetadata.clear();
    },
    async patients(query, o) {
      await pause(o);
      authenticated();
      if (scenario === "invalid-response")
        return output("PatientList", { items: [{ patient: "invalid" }] }).data;
      const request = [...followups.values()].findLast(
        (item) => item.owner === owner(),
      )?.request;
      const inactive = denied
        ? denied === "ACCESS_REVOKED"
          ? "revoked"
          : "expired"
        : ["pending-followup", "rejected-followup"].includes(scenario) &&
            !approvedGrants.has(owner())
          ? request?.status === "rejected" || scenario === "rejected-followup"
            ? "rejected"
            : request?.status === "expired"
              ? "expired"
              : "pending"
          : null;
      const s = projection();
      const row: Schemas["PatientRow"] = {
        relationshipId: s.access.grantId!,
        accessStatus: inactive ?? "active",
        patient: inactive ? null : s.patient,
        lastClinicalEventAt: null,
        lastClinicalEventOn: inactive ? null : s.coverage.to,
        lastReceivedAt: inactive ? null : now(),
        review: inactive ? null : reviewState(s),
        highlight: inactive
          ? null
          : s.access.scopes.includes("read_wearables")
            ? "Exames até out/2025 · wearable até nov/2026"
            : "Dados autorizados disponíveis para revisão",
      };
      const visible =
        (scenario !== "empty-portfolio" || approvedGrants.has(owner())) &&
        (query.filter === "inactive" ? !!inactive : !inactive) &&
        (!query.q ||
          row.patient?.displayName
            .toLocaleLowerCase("pt-BR")
            .includes(query.q.toLocaleLowerCase("pt-BR"))) &&
        (query.filter !== "with_updates" ||
          row.review?.mode === "initial_review" ||
          (row.review?.unreadGroupCount ?? 0) > 0);
      return output("PatientList", {
        items: visible ? [row] : [],
        page: { hasMore: false, nextCursor: null },
      }).data;
    },
    async resolve(token, o) {
      await pause(o);
      if (token === "demo-expired")
        throw new ApiError(410, "INVITATION_EXPIRED");
      if (!["demo-consultation", "demo-followup"].includes(token))
        throw new ApiError(422, "INVITATION_INVALID");
      invitations.add(owner());
      const id = `temporary-demo-${++tempSerial}`;
      const access =
        token === "demo-consultation"
          ? {
              ...projection().access,
              kind: "temporary" as const,
              contextId: id,
              grantId: null,
              expiresAt: "2026-11-11T17:00:00Z",
            }
          : null;
      if (access) temporary.add(id);
      const invitation = {
        id: "invite-demo-1",
        kind:
          token === "demo-followup"
            ? ("followup" as const)
            : ("consultation" as const),
        expiresAt: "2026-11-11T17:00:00Z",
        permittedScopes: createFixture().access.scopes,
        canRequestFollowup: true,
      };
      invitationMetadata.set(owner(), invitation);
      return output("SharingResolution", {
        invitation,
        temporaryAccess: access,
        requiresDoctorAuthentication: session.state !== "authenticated",
        loginContextId: "demo-handoff",
      });
    },
    async requestFollowup(input, key, o) {
      await pause(o);
      authenticated();
      validate("FollowupRequestInput", input);
      const body = JSON.stringify(input);
      const intent = intention("followup", key);
      const previous = idempotency.get(intent);
      if (previous && previous.body !== body)
        throw new ApiError(409, "IDEMPOTENCY_CONFLICT");
      if (previous)
        return structuredClone(previous.result) as Schemas["FollowupRequest"];
      if (!invitations.has(owner()) || input.invitationId !== "invite-demo-1")
        throw new ApiError(403, "INVITATION_INVALID");
      if (
        input.requestedDuration.mode === "until" &&
        input.requestedDuration.expiresAt! <= now()
      )
        throw new ApiError(422, "INVALID_DURATION");
      const pending = output("FollowupRequest", {
        id: `request-demo-${++requestSerial}`,
        invitationId: input.invitationId,
        status: scenario === "rejected-followup" ? "rejected" : "pending",
        requestedScopes: input.requestedScopes,
        requestedDuration: input.requestedDuration,
        createdAt: now(),
        expiresAt: "2026-11-11T17:00:00Z",
        grant: null,
      }).data;
      followups.set(pending.id, { owner: owner(), request: pending });
      lastRequestId = pending.id;
      idempotency.set(intent, { body, result: structuredClone(pending) });
      return structuredClone(pending);
    },
    async followup(id, o) {
      // Approval changes clinical access while this session-bound status read is pending.
      await pause(o, "followup-status");
      authenticated();
      const found = followups.get(id);
      if (!found || found.owner !== owner())
        throw new ApiError(404, "NOT_FOUND");
      return output("FollowupRequest", structuredClone(found.request)).data;
    },
    async snapshot(ctx, o) {
      await pause(o);
      check(ctx);
      if (scenario === "invalid-response")
        return output("Snapshot", { id: "invalid" });
      const s = projection(ctx);
      s.id = `snap-demo-${owner()}-${s.access.contextId}-${revision}-${scopeRevision}-${reviews.get(reviewOwner(s))?.revision ?? "initial"}`;
      s.dataRevision = `rev-demo-${revision}`;
      s.updateHighWatermark = `cursor-demo-${revision}`;
      s.review = ctx.temporaryAccessId ? null : reviewState(s);
      if (!snapshots.has(s.id))
        snapshots.set(s.id, {
          snapshot: structuredClone(s),
          revision,
          owner: owner(),
          contextId: s.access.contextId,
          firstPageServed: false,
          token: null,
        });
      return output("Snapshot", s);
    },
    async access(ctx, known, o) {
      await pause(o);
      check(ctx);
      const s = projection(ctx);
      if (known && known.accessRevision !== s.accessRevision)
        throw new ApiError(409, "ACCESS_CHANGED");
      return output("AccessStatus", {
        access: s.access,
        accessRevision: s.accessRevision,
        latestDataRevision: `rev-demo-${revision}`,
        hasNewData: !!known && known.dataRevision !== `rev-demo-${revision}`,
      });
    },
    async updates(ctx, snapshotId, cursor, o) {
      await pause(o);
      check(ctx);
      if (ctx.temporaryAccessId) throw new ApiError(403, "ACCESS_DENIED");
      const stored = storedSnapshot(ctx, snapshotId);
      const s = stored.snapshot;
      const groupCount = Math.min(2, s.review?.unreadGroupCount ?? 0);
      const groups: Schemas["UpdateGroup"][] =
        s.review?.mode === "initial_review" || groupCount === 0
          ? []
          : s.documents.items
              .slice(-groupCount)
              .map((d) => ({
                id: d.id,
                kind: "document",
                change: stored.revision > 1 ? "corrected" : "added",
                label: d.title,
                receivedAt: d.receivedAt,
                evidenceRefs: d.evidenceRefs,
                documentId: d.id,
              }));
      const nextCursor = `page-two:${snapshotId}`;
      if (cursor && (cursor !== nextCursor || !stored.firstPageServed))
        throw new ApiError(409, "INVALID_CURSOR");
      const hasMore = groups.length > 1 && !cursor;
      stored.firstPageServed = true;
      if (!hasMore) stored.token = `review:${snapshotId}:${owner()}`;
      return output("UpdatesPage", {
        snapshotId,
        mode: s.review?.mode ?? "initial_review",
        throughCursor: s.updateHighWatermark,
        items: cursor ? groups.slice(1) : groups.slice(0, 1),
        page: { nextCursor: hasMore ? nextCursor : null, hasMore },
        reviewToken: hasMore ? null : stored.token,
      }).data;
    },
    async review(ctx, input, key, o) {
      await pause(o);
      check(ctx);
      if (ctx.temporaryAccessId) throw new ApiError(403, "ACCESS_DENIED");
      validate("ReviewInput", input);
      const stored = storedSnapshot(ctx, input.snapshotId);
      if (!stored.token || input.reviewToken !== stored.token)
        throw new ApiError(409, "ACCESS_CHANGED");
      const body = JSON.stringify(input);
      const intent = intention("review", key);
      const previous = idempotency.get(intent);
      if (previous) {
        if (previous.body !== body)
          throw new ApiError(409, "IDEMPOTENCY_CONFLICT");
        return structuredClone(previous.result) as Schemas["ReviewResult"];
      }
      const reviewKey = reviewOwner(stored.snapshot);
      const r = reviews.get(reviewKey);
      const already = !!r && r.revision >= stored.revision;
      if (!already)
        reviews.set(reviewKey, { revision: stored.revision, at: now() });
      const reviewed = reviews.get(reviewKey)!;
      const result = output("ReviewResult", {
        status: already ? "already_recorded" : "recorded",
        lastReviewedCursor: `cursor-demo-${reviewed.revision}`,
        lastReviewedAt: reviewed.at,
        hasUpdatesAfterReview: revision > reviewed.revision,
      }).data;
      idempotency.set(intent, { body, result });
      return result;
    },
    async original(ctx, _id, o) {
      await pause(o);
      check(ctx);
      throw new ApiError(404, "ORIGINAL_UNAVAILABLE");
    },
    async closeTemporary(id, o) {
      await pause(o);
      temporary.delete(id);
    },
  };
  return {
    api,
    controls: {
      revoke() {
        denied = "ACCESS_REVOKED";
        epoch++;
        scopeRevision++;
      },
      restrict() {
        restricted = true;
        epoch++;
        scopeRevision++;
      },
      arrive() {
        revision += 1;
      },
      decide(status: "approved" | "rejected" | "expired") {
        const pending = followups.get(lastRequestId);
        if (!pending || pending.owner !== owner()) return;
        pending.request.status = status;
        pending.request.grant =
          status === "approved"
            ? {
                id: `grant-demo-${owner()}`,
                patientId: DEMO_PATIENT,
                status: "active",
                scopeVersion: `scope-approved-${pending.request.id}`,
                scopes: pending.request.requestedScopes,
                approvedAt: now(),
                expiresAt: pending.request.requestedDuration.expiresAt,
                revokedAt: null,
                durationExplicitlyApproved: true,
              }
            : null;
        if (pending.request.grant) {
          approvedGrants.set(owner(), pending.request.grant);
          epoch++;
          scopeRevision++;
        }
      },
      otherDoctor() {
        session = {
          ...session,
          state: "authenticated",
          doctor: {
            ...demoDoctor,
            id: "doctor-demo-2",
            displayName: "Dr. Rafael Lima",
          },
          expiresAt: "2026-11-11T23:00:00Z",
        };
        epoch++;
      },
      login() {
        const invitation = invitationMetadata.get(owner());
        session = {
          ...session,
          state: "authenticated",
          doctor: demoDoctor,
          expiresAt: "2026-11-11T23:00:00Z",
          pendingInvitation: invitation
            ? { loginContextId: "demo-handoff", invitation }
            : null,
        };
        if (invitation) {
          invitations.add(owner());
          invitationMetadata.set(owner(), invitation);
        }
        temporary.clear();
        epoch++;
      },
      get revision() {
        return revision;
      },
    },
  };
}
