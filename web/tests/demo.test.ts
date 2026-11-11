import { describe, expect, it } from "vitest";
import type { DoctorApi } from "@/lib/api/doctor-api";
import type { Schemas } from "@/lib/api/types";
import { parseResponse } from "@/lib/api/validate";
import { createDemoApi } from "@/lib/demo/api";
import {
  createFixture,
  projectFixture,
  DEMO_PATIENT,
  DEMO_TIME,
  scenarioNames,
} from "@/lib/demo/fixture";

const ctx = { patientId: DEMO_PATIENT };
const followupInput: Schemas["FollowupRequestInput"] = {
  invitationId: "invite-demo-1",
  requestedScopes: ["read_exams"],
  requestedDuration: { mode: "until", expiresAt: "2026-12-11T15:00:00Z" },
};
async function reviewInput(
  api: DoctorApi,
  snapshotId: string,
): Promise<Schemas["ReviewInput"]> {
  let page = await api.updates(ctx, snapshotId);
  while (page.page.hasMore)
    page = await api.updates(ctx, snapshotId, page.page.nextCursor!);
  return { snapshotId, reviewToken: page.reviewToken! };
}

describe("deterministic fixture", () => {
  it.each(scenarioNames)("has valid closed references in %s", (scenario) => {
    const data = createFixture(scenario);
    expect(() =>
      parseResponse("Snapshot", {
        meta: {
          requestId: "test",
          serverTime: DEMO_TIME,
          contractVersion: "0.1-draft",
        },
        data,
      }),
    ).not.toThrow();
    expect(
      data.evidence
        .filter((e) => e.label.includes("HRV"))
        .every((e) => e.value! > 0),
    ).toBe(true);
    expect(data.exams.items.some((series) => series.id === "hba1c")).toBe(
      false,
    );
    expect(
      data.documents.items.every(
        (document) => document.originalAvailable === false,
      ),
    ).toBe(true);
  });

  const allScopes = createFixture().access.scopes;
  const grants = Array.from({ length: 2 ** allScopes.length }, (_, mask) =>
    allScopes.filter((_, index) => Boolean(mask & (1 << index))),
  );
  it.each(
    grants.map((scopes) => [scopes.join(",") || "no scopes", scopes] as const),
  )("keeps all projections closed for %s", (_label, scopes) => {
    const data = projectFixture(createFixture(), [...scopes]);
    expect(() =>
      parseResponse("Snapshot", {
        meta: {
          requestId: "scopes-test",
          serverTime: DEMO_TIME,
          contractVersion: "0.1-draft",
        },
        data,
      }),
    ).not.toThrow();
    if (!scopes.includes("read_exams"))
      expect(data.documents.items).toEqual([]);
    if (!scopes.includes("read_wearables"))
      expect(data.sources.some((item) => item.kind === "wearable")).toBe(false);
    if (!scopes.includes("read_clinical_context"))
      expect(data.graph.nodes.some((item) => item.kind === "medication")).toBe(
        false,
      );
  });
});

describe("consent and temporary contexts", () => {
  it("never promotes a temporary invitation to a longitudinal relationship", async () => {
    const { api } = createDemoApi("temporary-only", 0);
    const resolution = (await api.resolve("demo-consultation")).data;
    const temporaryCtx = {
      ...ctx,
      temporaryAccessId: resolution.temporaryAccess!.contextId,
    };
    const snapshot = (await api.snapshot(temporaryCtx)).data;
    expect(snapshot.access.kind).toBe("temporary");
    expect(snapshot.review).toBeNull();
    await expect(api.patients({})).rejects.toMatchObject({ status: 401 });
    await expect(api.snapshot(ctx)).rejects.toMatchObject({ status: 401 });
    await expect(api.updates(temporaryCtx, snapshot.id)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      api.review(
        temporaryCtx,
        { snapshotId: snapshot.id, reviewToken: "no-token" },
        "review",
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("keeps the original TTL on re-resolution and closes only the chosen context", async () => {
    const { api } = createDemoApi("temporary-only", 0);
    const first = (await api.resolve("demo-consultation")).data
      .temporaryAccess!;
    const second = (await api.resolve("demo-consultation")).data
      .temporaryAccess!;
    expect(first.expiresAt).toBe(second.expiresAt);
    expect(first.contextId).not.toBe(second.contextId);
    await api.closeTemporary(first.contextId);
    await expect(
      api.snapshot({ ...ctx, temporaryAccessId: first.contextId }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      api.snapshot({ ...ctx, temporaryAccessId: second.contextId }),
    ).resolves.toBeDefined();
  });

  it("login resumes only invitation metadata and clears temporary clinical access", async () => {
    const { api, controls } = createDemoApi("temporary-only", 0);
    const resolution = (await api.resolve("demo-consultation")).data;
    controls.login();
    const session = (await api.session()).data;
    expect(session.pendingInvitation?.invitation.id).toBe(
      resolution.invitation.id,
    );
    expect(session.pendingInvitation).not.toHaveProperty("temporaryAccess");
    await expect(
      api.snapshot({
        ...ctx,
        temporaryAccessId: resolution.temporaryAccess!.contextId,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect((await api.requestFollowup(followupInput, "resumed")).status).toBe(
      "pending",
    );
  });

  it("requires external approval and projects only the requested scopes and duration", async () => {
    const { api, controls } = createDemoApi("pending-followup", 0);
    await api.resolve("demo-followup");
    const request = await api.requestFollowup(followupInput, "request-1");
    expect(request.status).toBe("pending");
    expect(request.grant).toBeNull();
    await expect(api.snapshot(ctx)).rejects.toMatchObject({ status: 403 });
    controls.decide("approved");
    expect((await api.followup(request.id)).status).toBe("approved");
    const snapshot = (await api.snapshot(ctx)).data;
    expect(snapshot.access.scopes).toEqual(["read_exams"]);
    expect(snapshot.access.expiresAt).toBe(
      followupInput.requestedDuration.expiresAt,
    );
    expect(snapshot.wearables.state).toBe("not_shared");
    expect(snapshot.briefing.state).toBe("not_shared");
    expect(snapshot.clinicalContext.state).toBe("not_shared");
    expect(snapshot.evidence.every((item) => item.kind === "lab_result")).toBe(
      true,
    );
    expect(
      snapshot.sources.every((source) => source.kind === "laboratory"),
    ).toBe(true);
    expect(
      snapshot.graph.nodes.some((node) => node.kind === "medication"),
    ).toBe(false);
    expect((await api.patients({})).items[0].highlight).not.toContain(
      "wearable",
    );
  });

  it("returns external approval even when it arrives during a follow-up status read", async () => {
    const { api, controls } = createDemoApi("pending-followup", 10);
    await api.resolve("demo-followup");
    const request = await api.requestFollowup(followupInput, "pending-read");
    const pending = api.followup(request.id);
    controls.decide("approved");
    await expect(pending).resolves.toMatchObject({
      status: "approved",
      grant: { scopes: ["read_exams"], durationExplicitlyApproved: true },
    });
  });

  it("still rejects a clinical response started before a follow-up approval changed access", async () => {
    const { api, controls } = createDemoApi("pending-followup", 10);
    await api.resolve("demo-followup");
    await api.requestFollowup(followupInput, "pending-clinical");
    const pending = api.snapshot(ctx);
    controls.decide("approved");
    await expect(pending).rejects.toMatchObject({ code: "ACCESS_CHANGED" });
  });

  it.each(["otherDoctor", "login", "logout"] as const)(
    "rejects a delayed follow-up status read across %s rather than exposing another session's decision",
    async (change) => {
      const { api, controls } = createDemoApi("pending-followup", 10);
      await api.resolve("demo-followup");
      const request = await api.requestFollowup(followupInput, "session-change");
      const logout = change === "logout" ? api.logout() : null;
      const pending = api.followup(request.id);
      if (change !== "logout") controls[change]();
      await expect(pending).rejects.toMatchObject({ code: "ACCESS_CHANGED" });
      if (logout) await logout;
    },
  );

  it.each(["rejected", "expired"] as const)(
    "does not unlock clinical data after %s follow-up",
    async (status) => {
      const { api, controls } = createDemoApi("pending-followup", 0);
      await api.resolve("demo-followup");
      await api.requestFollowup(followupInput, "request");
      controls.decide(status);
      await expect(api.snapshot(ctx)).rejects.toMatchObject({ status: 403 });
      const row = (await api.patients({ filter: "inactive" })).items[0];
      expect(row.accessStatus).toBe(status);
      expect(row.patient).toBeNull();
      expect(row.highlight).toBeNull();
    },
  );

  it("retries the same request idempotently and rejects a changed intention under the same key", async () => {
    const { api } = createDemoApi("pending-followup", 0);
    await api.resolve("demo-followup");
    expect(await api.requestFollowup(followupInput, "request")).toEqual(
      await api.requestFollowup(followupInput, "request"),
    );
    await expect(
      api.requestFollowup(
        { ...followupInput, requestedScopes: ["read_wearables"] },
        "request",
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("review snapshot and concurrency", () => {
  it("does not issue a review token until the last page and rejects premature review", async () => {
    const { api } = createDemoApi("active-with-updates", 0);
    const s = (await api.snapshot(ctx)).data;
    const page = await api.updates(ctx, s.id);
    expect(page.page.hasMore).toBe(true);
    expect(page.reviewToken).toBeNull();
    await expect(
      api.review(
        ctx,
        { snapshotId: s.id, reviewToken: `review:${s.id}:doctor-demo-1` },
        "premature",
      ),
    ).rejects.toMatchObject({ status: 409 });
    const last = await api.updates(ctx, s.id, page.page.nextCursor!);
    expect(last.reviewToken).toBeTruthy();
    expect(last.throughCursor).toBe(page.throughCursor);
  });

  it("keeps new data after the snapshot unread and preserves page high-watermark", async () => {
    const { api, controls } = createDemoApi("concurrent-update", 0);
    const s = (await api.snapshot(ctx)).data;
    const first = await api.updates(ctx, s.id);
    controls.arrive();
    const last = await api.updates(ctx, s.id, first.page.nextCursor!);
    expect(last.throughCursor).toBe(s.updateHighWatermark);
    const result = await api.review(
      ctx,
      { snapshotId: s.id, reviewToken: last.reviewToken! },
      "review-old",
    );
    expect(result.lastReviewedCursor).toBe(s.updateHighWatermark);
    expect(result.hasUpdatesAfterReview).toBe(true);
    expect((await api.patients({ filter: "with_updates" })).items).toHaveLength(
      1,
    );
    const status = (
      await api.access(ctx, {
        accessRevision: s.accessRevision,
        dataRevision: s.dataRevision,
      })
    ).data;
    expect(status.hasNewData).toBe(true);
  });

  it("does not regress review when another tab finishes an older snapshot later", async () => {
    const { api, controls } = createDemoApi("active-with-updates", 0);
    const older = (await api.snapshot(ctx)).data;
    const olderInput = await reviewInput(api, older.id);
    controls.arrive();
    const newer = (await api.snapshot(ctx)).data;
    const newerInput = await reviewInput(api, newer.id);
    const latest = await api.review(ctx, newerInput, "newer");
    const late = await api.review(ctx, olderInput, "older");
    expect(late.status).toBe("already_recorded");
    expect(late.lastReviewedCursor).toBe(latest.lastReviewedCursor);
    expect((await api.patients({ filter: "with_updates" })).items).toHaveLength(
      0,
    );
  });

  it("repeats one review idempotently and rejects reusing its key for another body", async () => {
    const { api, controls } = createDemoApi("active-initial", 0);
    const older = (await api.snapshot(ctx)).data;
    const input = await reviewInput(api, older.id);
    const first = await api.review(ctx, input, "same-key");
    expect(await api.review(ctx, input, "same-key")).toEqual(first);
    controls.arrive();
    const newer = (await api.snapshot(ctx)).data;
    await expect(
      api.review(ctx, await reviewInput(api, newer.id), "same-key"),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("isolates snapshots, follow-up and review state by doctor", async () => {
    const { api, controls } = createDemoApi("active-with-updates", 0);
    const s = (await api.snapshot(ctx)).data;
    const input = await reviewInput(api, s.id);
    await api.review(ctx, input, "review");
    await api.resolve("demo-followup");
    const followup = await api.requestFollowup(followupInput, "followup");
    controls.otherDoctor();
    await expect(api.updates(ctx, s.id)).rejects.toMatchObject({ status: 409 });
    await expect(api.review(ctx, input, "cross-doctor")).rejects.toMatchObject({
      status: 409,
    });
    await expect(api.followup(followup.id)).rejects.toMatchObject({
      status: 404,
    });
    expect((await api.patients({ filter: "with_updates" })).items).toHaveLength(
      1,
    );
  });

  it("invalidates a served review token when scopes change", async () => {
    const { api, controls } = createDemoApi("active-with-updates", 0);
    const s = (await api.snapshot(ctx)).data;
    const input = await reviewInput(api, s.id);
    controls.restrict();
    await expect(api.review(ctx, input, "old-scope")).rejects.toMatchObject({
      status: 409,
    });
    await expect(
      api.access(ctx, {
        dataRevision: s.dataRevision,
        accessRevision: s.accessRevision,
      }),
    ).rejects.toMatchObject({ code: "ACCESS_CHANGED" });
  });
});

describe("revocation, delayed responses and failure states", () => {
  it.each(["revoke", "restrict", "otherDoctor"] as const)(
    "rejects a response that began before %s",
    async (change) => {
      const { api, controls } = createDemoApi("active-initial", 10);
      const pending = api.snapshot(ctx);
      controls[change]();
      await expect(pending).rejects.toMatchObject({
        status: 409,
        code: "ACCESS_CHANGED",
      });
    },
  );

  it("revocation removes portfolio previews and prevents snapshot, original and review", async () => {
    const { api, controls } = createDemoApi("active-initial", 0);
    const s = (await api.snapshot(ctx)).data;
    const input = await reviewInput(api, s.id);
    controls.revoke();
    const row = (await api.patients({ filter: "inactive" })).items[0];
    expect(row.patient).toBeNull();
    expect(row.review).toBeNull();
    expect(row.highlight).toBeNull();
    await expect(api.snapshot(ctx)).rejects.toMatchObject({ status: 403 });
    await expect(api.original(ctx, "doc-2025-10-18")).rejects.toMatchObject({
      status: 403,
    });
    await expect(api.review(ctx, input, "revoked")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("aborts in-flight demo requests", async () => {
    const { api } = createDemoApi("active-initial", 10);
    const controller = new AbortController();
    const pending = api.snapshot(ctx, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("leaves basic data available when the briefing is unavailable", async () => {
    const { api } = createDemoApi("briefing-unavailable", 0);
    const s = (await api.snapshot(ctx)).data;
    expect(s.briefing.state).toBe("unavailable");
    expect(s.exams.items.length).toBeGreaterThan(0);
  });

  it.each(["backend-unavailable", "invalid-response"] as const)(
    "does not replace %s with an active fixture",
    async (scenario) => {
      const { api } = createDemoApi(scenario, 0);
      await expect(api.snapshot(ctx)).rejects.toBeDefined();
    },
  );
});
